using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class PostService : BaseService, IPostService
    {
        private readonly IRepository<Post, Guid> _postRepository;
        private readonly IRepository<Group, Guid> _groupRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly IFileService _fileService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public PostService(UserManager<ApplicationUser> userManager,
            IRepository<Post, Guid> postRepository, IMapper mapper,
             IRepository<Database.Models.Profile, Guid> profileRepository,
              IRepository<Friendship, Guid> friendshipRepository,
               IFileService fileService, IRepository<Group, Guid> groupRepository,
                IHttpContextAccessor httpContextAccessor)
            : base(userManager)
        {
            _postRepository = postRepository;
            _mapper = mapper;
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
            _fileService = fileService;
            _groupRepository = groupRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<PostDto>> CreatePostAsPost(ClaimsPrincipal userClaims, CreatePostDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var author = await _profileRepository.GetByApplicationIdAsync(userId);
            if (author == null)
                return NotFoundResponse<PostDto>("Post");

            if (dto.GroupId.HasValue)
            {
                var group = await _groupRepository.GetByIdAsync(dto.GroupId.Value);
                if (group == null)
                    return NotFoundResponse<PostDto>("Group");

                var isMember = await _groupRepository.IsMemberAsync(group.Id, author.Id);
                if (!isMember)
                    return ApiResponse<PostDto>.ErrorResponse("You are not a member of this group.");
            }

            var post = _mapper.Map<Post>(dto);
            post.Id = Guid.NewGuid();
            post.ProfileId = author.Id;
            post.Visibility = dto.GroupId.HasValue ? PostVisibility.Public : dto.Visibility;
            post.Media = new List<PostMedia>();

            if (dto.Files != null && dto.Files.Any())
            {
                int order = 0;

                foreach (var file in dto.Files)
                {
                    var (filePath, mediaType) = await _fileService.SaveFileAsync(file);

                    post.Media.Add(new PostMedia
                    {
                        Id = Guid.NewGuid(),
                        PostId = post.Id,
                        FilePath = filePath,
                        MediaType = mediaType,
                        Order = order++
                    });
                }
            }

            await _postRepository.AddAsync(post);
            await _postRepository.SaveChangesAsync();

            var profile = await _profileRepository.GetByIdAsync(post.ProfileId);

            return SuccessPostDto(post, profile, "Post created successfully.");
        }

        public async Task<ApiResponse<PostDto>> GetPostByIdAsync(ClaimsPrincipal userClaims, Guid postId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null)
                return ApiResponse<PostDto>.ErrorResponse("Invalid user profile.");

            var post = await _postRepository.QueryNoTracking()
                .Include(p => p.Media)
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post == null || post.IsDeleted)
                return NotFoundResponse<PostDto>("Post");

            var authorProfile = await _profileRepository.GetByIdAsync(post.ProfileId);

            if (post.GroupId.HasValue)
            {
                var group = await _groupRepository.GetByIdAsync(post.GroupId.Value);
                if (group == null)
                    return NotFoundResponse<PostDto>("Group");

                if (group.Privacy == GroupPrivacy.Public)
                {
                    return SuccessPostDto(post, authorProfile, "Post retrieved successfully.");
                }

                var isMember = await _groupRepository.IsMemberAsync(group.Id, viewerProfile.Id);
                if (!isMember)
                    return ApiResponse<PostDto>.ErrorResponse("You are not a member of this group.");

                return SuccessPostDto(post, authorProfile, "Post retrieved successfully.");
            }

            if (viewerProfile.Id == post.ProfileId)
                return SuccessPostDto(post, authorProfile, "Post retrieved successfully.");

            if (post.Visibility == PostVisibility.Public)
                return SuccessPostDto(post, authorProfile, "Post retrieved successfully.");

            var isFriend = await _friendshipRepository.AnyAsync(f =>
               f.Status == FriendshipStatus.Accepted &&
               ((f.RequesterId == viewerProfile.Id && f.AddresseeId == post.ProfileId) ||
               (f.RequesterId == post.ProfileId && f.AddresseeId == viewerProfile.Id)));
            if (isFriend)
                return SuccessPostDto(post, authorProfile, "Post retrieved successfully.");

            var isFollowing = await _profileRepository.AnyAsync(p =>
                p.Id == post.ProfileId &&
                p.Followers.Any(f => f.FollowerId == viewerProfile.Id));
            if (isFollowing)
                return SuccessPostDto(post, authorProfile, "Post retrieved successfully.");


            return ApiResponse<PostDto>.ErrorResponse("You are not authorized to view this post.");
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetFeedAsync(ClaimsPrincipal userClaims,
           Guid? lastPostId = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null)
                return ApiResponse<IEnumerable<PostDto>>.ErrorResponse("Invalid user profile.");

            var friendIds = await _friendshipRepository.QueryNoTracking()
                .Where(f => f.Status == FriendshipStatus.Accepted &&
                    f.RequesterId == viewerProfile.Id || f.AddresseeId == viewerProfile.Id)
                .Select(f => viewerProfile.Id == f.RequesterId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            var followingIds = await _profileRepository.QueryNoTracking()
                .Where(p => p.Followers.Any(f => f.FollowerId == viewerProfile.Id))
                .Select(p => p.Id)
                .ToListAsync();

            var query = _postRepository.QueryNoTracking()
                .Include(p => p.Media)
                .Include(p => p.Profile)
                .Where(p => !p.IsDeleted &&
                    (
                        p.Visibility == PostVisibility.Public ||
                        p.ProfileId == viewerProfile.Id ||
                        (p.Visibility == PostVisibility.FriendsOnly && friendIds.Contains(p.ProfileId)) ||
                        followingIds.Contains(p.ProfileId))
                    )
                .OrderByDescending(p => p.CreatedDate)
                .AsQueryable();

            if (lastPostId.HasValue)
            {
                var lastPost = await _postRepository.GetByIdAsync(lastPostId.Value);
                if (lastPost != null)
                {
                    query = query.Where(p => p.CreatedDate < lastPost.CreatedDate);
                }
            }

            var posts = await query.Take(take).ToListAsync();

            var dtos = posts.Select(p => SuccessPostDto(p, p.Profile, "").Data).ToList();

            var last = posts.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(
                dtos,
                "Feed retrieved successfully.",
                new { lastPostId = last }
            );
        }
        public async Task<ApiResponse<IEnumerable<PostDto>>> GetUserPostsAsync(
                ClaimsPrincipal userClaims,
                Guid profileId,
                Guid? lastPostId = null,
                int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);

            bool isOwner = false, isFriend = false, isFollower = false;

            isOwner = viewerProfile.Id == profileId;

            isFriend = await _friendshipRepository.AnyAsync(f =>
                f.Status == FriendshipStatus.Accepted &&
                ((f.RequesterId == viewerProfile.Id && f.AddresseeId == profileId) ||
                 (f.AddresseeId == viewerProfile.Id && f.RequesterId == profileId)));

            isFollower = await _profileRepository.QueryNoTracking()
                .Where(p => p.Id == profileId)
                .AnyAsync(p => p.Followers.Any(f => f.FollowerId == viewerProfile.Id));


            var query = _postRepository.QueryNoTracking()
                .Include(p => p.Media)
                .Include(p => p.Profile)
                .Where(p => !p.IsDeleted && p.ProfileId == profileId)
                .Where(p =>
                    p.Visibility == PostVisibility.Public ||
                    isOwner ||
                    (p.Visibility == PostVisibility.FriendsOnly && isFriend) ||
                    isFollower)
                .OrderByDescending(p => p.CreatedDate)
                .AsQueryable();

            if (lastPostId.HasValue)
            {
                var lastPost = await _postRepository.GetByIdAsync(lastPostId.Value);
                if (lastPost != null)
                    query = query.Where(p => p.CreatedDate < lastPost.CreatedDate);
            }

            var posts = await query.Take(take).ToListAsync();

            var dtos = posts.Select(p => SuccessPostDto(p, p.Profile, "").Data).ToList();
            var last = posts.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(
                dtos,
                "User posts retrieved successfully.",
                new { lastPostId = last }
            );
        }


        public async Task<ApiResponse<PostDto>> UpdatePostAsync(ClaimsPrincipal userClaims, Guid postId, UpdatePostDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null)
                return NotFoundResponse<PostDto>("Profile");

            var post = _postRepository.Query()
                .Include(p => p.Media)
                .FirstOrDefault(p => p.Id == postId && !p.IsDeleted);
            if (post == null)
                return NotFoundResponse<PostDto>("Post");

            if (viewerProfile.Id != post.ProfileId)
                return ApiResponse<PostDto>.ErrorResponse("You are not authorized to update this post.");

            _mapper.Map(dto, post);
            if (post.GroupId.HasValue)
            {
                post.Visibility = PostVisibility.Public;
            }

            if (dto.FilesToDelete != null && dto.FilesToDelete.Any())
            {
                var mediaToRemove = post.Media.Where(m => dto.FilesToDelete.Contains(m.Id)).ToList();
                foreach (var media in mediaToRemove)
                {
                    post.Media.Remove(media);
                }
            }

            if (dto.NewFiles != null && dto.NewFiles.Any())
            {
                int order = 0;

                foreach (var file in dto.NewFiles)
                {
                    var (filePath, mediaType) = await _fileService.SaveFileAsync(file);

                    post.Media.Add(new PostMedia
                    {
                        Id = Guid.NewGuid(),
                        PostId = post.Id,
                        FilePath = filePath,
                        MediaType = mediaType,
                        Order = order++
                    });
                }
            }

            await _postRepository.SaveChangesAsync();

            var profile = await _profileRepository.GetByIdAsync(post.ProfileId);
            return SuccessPostDto(post, profile, "Post updated successfully.");
        }

        public async Task<ApiResponse<object>> DeletePostAsync(ClaimsPrincipal userId, Guid postId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userId, out var userIdValue);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
                return NotFoundResponse<object>("Post");

            if (post.IsDeleted == true)
                return ApiResponse<object>.ErrorResponse("Delete failed", new[] { "Post already deleted." });

            post.IsDeleted = true;
            await _postRepository.UpdateAsync(post);
            await _postRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse(null, "Post deleted successfully.");
        }

        public async Task<ApiResponse<object>> LikePostAsync(ClaimsPrincipal userClaims, Guid postId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> UnlikePostAsync(ClaimsPrincipal userClaims, Guid postId)
        {
            throw new NotImplementedException();
        }

        private ApiResponse<PostDto> SuccessPostDto(Post post, Database.Models.Profile profile, string message)
        {
            var dto = _mapper.Map<PostDto>(post);
            dto.AuthorName = profile.FullName ?? "Unknown Author";
            dto.AuthorAvatar = profile.Photo;

            var baseUrl = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}";
            foreach (var media in post.Media)
            {
                dto.Media = post.Media.Select(m => new PostMediaDto
                {
                    Id = m.Id,
                    Url = $"{baseUrl}/{m.FilePath}",
                    MediaType = m.MediaType,
                    Order = m.Order
                }).ToList();
            }

            return ApiResponse<PostDto>.SuccessResponse(dto, message);
        }
    }
}
