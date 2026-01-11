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
        private readonly IRepository<Reaction, Guid> _reactionRepository;
        private readonly IRepository<PostMedia, Guid> _postMediaRepository;
        private readonly IRepository<Group, Guid> _groupRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly IRepository<Follow, Guid> _followRepository;
        private readonly IFileService _fileService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public PostService(UserManager<ApplicationUser> userManager,
            IRepository<Post, Guid> postRepository,
            IMapper mapper,
            IRepository<Database.Models.Profile, Guid> profileRepository,
            IRepository<Friendship, Guid> friendshipRepository,
            IRepository<Follow, Guid> followRepository,
            IFileService fileService,
            IRepository<Group, Guid> groupRepository,
            IRepository<PostMedia, Guid> postMediaRepository,
            IHttpContextAccessor httpContextAccessor,
            IRepository<Reaction, Guid> reactionRepository)
            : base(userManager)
        {
            _postRepository = postRepository;
            _mapper = mapper;
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
            _followRepository = followRepository;
            _fileService = fileService;
            _groupRepository = groupRepository;
            _postMediaRepository = postMediaRepository;
            _httpContextAccessor = httpContextAccessor;
            _reactionRepository = reactionRepository;
        }

        public async Task<ApiResponse<PostDto>> CreatePostAsPost(ClaimsPrincipal userClaims, CreatePostDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var author = await _profileRepository.GetByApplicationIdAsync(userId);
            if (author == null) return NotFoundResponse<PostDto>("Post");

            Group? group = null;

            if (dto.GroupId.HasValue)
            {
                group = await _groupRepository.GetByIdAsync(dto.GroupId.Value);
                if (group == null) return NotFoundResponse<PostDto>("Group");

                var isMember = await _groupRepository.IsMemberAsync(group.Id, author.Id);
                if (!isMember) return ApiResponse<PostDto>.ErrorResponse("You are not a member of this group.");
            }

            var post = _mapper.Map<Post>(dto);
            post.Id = Guid.NewGuid();
            post.ProfileId = author.Id;
            post.Visibility = dto.GroupId.HasValue ? PostVisibility.Public : dto.Visibility ?? PostVisibility.Public;
            post.Media = new List<PostMedia>();

            if (dto.Files != null && dto.Files.Any())
            {
                int order = 0;
                foreach (var file in dto.Files)
                {
                    var (filePath, mediaType) = await _fileService.SaveFileAsync(file);
                    if (string.IsNullOrEmpty(filePath) || mediaType == MediaType.Other)
                        return ApiResponse<PostDto>.ErrorResponse($"File '{file.FileName}' is not supported type.");

                    post.Media.Add(new PostMedia
                    {
                        Id = Guid.NewGuid(),
                        PostId = post.Id,
                        FilePath = filePath,
                        MediaType = mediaType,
                        FileName = file.FileName,
                        Order = order++
                    });
                }
            }

            await _postRepository.AddAsync(post);
            await _postRepository.SaveChangesAsync();

            post.Profile = author;
            post.Group = group;

            return SuccessPostDto(post, author, "Post created successfully.");
        }

        public async Task<ApiResponse<PostDto>> GetPostByIdAsync(ClaimsPrincipal userClaims, Guid postId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null) return ApiResponse<PostDto>.ErrorResponse("Invalid user profile.");

            var post = await _postRepository.QueryNoTracking()
                .Include(p => p.Group)
                .Include(p => p.Profile)
                .Include(p => p.Media)
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post == null || post.IsDeleted) return NotFoundResponse<PostDto>("Post");
            var authorProfile = await _profileRepository.GetByIdAsync(post.ProfileId);

            if (post.GroupId.HasValue)
            {
                var group = await _groupRepository.GetByIdAsync(post.GroupId.Value);
                if (group == null) return NotFoundResponse<PostDto>("Group");

                if (group.Privacy == GroupPrivacy.Public)
                    return SuccessPostDto(post, authorProfile, "Success.");

                var isMember = await _groupRepository.IsMemberAsync(group.Id, viewerProfile.Id);
                if (!isMember) return ApiResponse<PostDto>.ErrorResponse("Not a member.");

                return SuccessPostDto(post, authorProfile, "Success.");
            }

            if (viewerProfile.Id == post.ProfileId) return SuccessPostDto(post, authorProfile, "Success.");

            if (post.Visibility == PostVisibility.Public) return SuccessPostDto(post, authorProfile, "Success.");

            if (post.Visibility == PostVisibility.FriendsOnly)
            {
                var isFriend = await _friendshipRepository.AnyAsync(f =>
                   f.Status == FriendshipStatus.Accepted &&
                   ((f.RequesterId == viewerProfile.Id && f.AddresseeId == post.ProfileId) ||
                   (f.RequesterId == post.ProfileId && f.AddresseeId == viewerProfile.Id)));

                if (isFriend) return SuccessPostDto(post, authorProfile, "Success.");
            }

            return ApiResponse<PostDto>.ErrorResponse("You are not authorized to view this post.");
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetFeedAsync(ClaimsPrincipal userClaims, Guid? lastPostId = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null) return ApiResponse<IEnumerable<PostDto>>.ErrorResponse("Invalid user profile.");

            var followingIds = await _followRepository.QueryNoTracking()
                .Where(f => f.FollowerId == viewerProfile.Id).Select(f => f.FollowingId).ToListAsync();
            followingIds.Add(viewerProfile.Id);

            var friendIds = await _friendshipRepository.QueryNoTracking()
                .Where(f => f.Status == FriendshipStatus.Accepted &&
                    (f.RequesterId == viewerProfile.Id || f.AddresseeId == viewerProfile.Id))
                .Select(f => viewerProfile.Id == f.RequesterId ? f.AddresseeId : f.RequesterId).ToListAsync();

            var myGroupIds = await _groupRepository.QueryNoTracking()
                .Where(g => g.Members.Any(m =>
                    m.ProfileId == viewerProfile.Id &&
                    m.Status == MembershipStatus.Approved))
                .Select(g => g.Id)
                .ToListAsync();

            var query = _postRepository.QueryNoTracking()
                .Include(p => p.Media)
                .Include(p => p.Group)
                .Include(p => p.Profile)
                .ThenInclude(p => p.User)
                .Where(p => !p.IsDeleted)
                .Where(p =>
                    (p.GroupId.HasValue && myGroupIds.Contains(p.GroupId.Value))
                    ||
                    (!p.GroupId.HasValue && followingIds.Contains(p.ProfileId) &&
                        (
                            p.Visibility == PostVisibility.Public ||
                            p.ProfileId == viewerProfile.Id ||
                            (p.Visibility == PostVisibility.FriendsOnly && friendIds.Contains(p.ProfileId))
                        )
                    )
                )
                .OrderByDescending(p => p.CreatedDate).AsQueryable();

            if (lastPostId.HasValue)
            {
                var lastPost = await _postRepository.GetByIdAsync(lastPostId.Value);
                if (lastPost != null) query = query.Where(p => p.CreatedDate < lastPost.CreatedDate);
            }

            var posts = await query.Take(take).ToListAsync();
            var dtos = posts.Select(p => SuccessPostDto(p, p.Profile, "").Data).ToList();
            var last = posts.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(dtos, "Feed retrieved.", new { lastPostId = last });
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetUserPostsAsync(ClaimsPrincipal userClaims, Guid profileId, Guid? lastPostId = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            bool isOwner = viewerProfile.Id == profileId;

            bool isFriend = await _friendshipRepository.AnyAsync(f =>
                f.Status == FriendshipStatus.Accepted &&
                ((f.RequesterId == viewerProfile.Id && f.AddresseeId == profileId) ||
                 (f.AddresseeId == viewerProfile.Id && f.RequesterId == profileId)));

            var query = _postRepository.QueryNoTracking()
                .Include(p => p.Media)
                .Include(p => p.Group)
                .Include(p => p.Profile)
                .ThenInclude(p => p.User)
                .Where(p => !p.IsDeleted && p.ProfileId == profileId)
                .Where(p =>
                    p.Visibility == PostVisibility.Public ||
                    isOwner ||
                    (p.Visibility == PostVisibility.FriendsOnly && isFriend)
                )
                .OrderByDescending(p => p.CreatedDate).AsQueryable();

            if (lastPostId.HasValue)
            {
                var lastPost = await _postRepository.GetByIdAsync(lastPostId.Value);
                if (lastPost != null) query = query.Where(p => p.CreatedDate < lastPost.CreatedDate);
            }

            var posts = await query.Take(take).ToListAsync();

            var postIds = posts.Select(p => p.Id).ToList();
            var userReactions = await _reactionRepository.QueryNoTracking()
                .Where(r => postIds.Contains((Guid)r.PostId) && r.ProfileId == viewerProfile.Id)
                .Select(r => new { r.PostId, r.Type }).ToListAsync();
            var reactionsDict = userReactions.ToDictionary(k => k.PostId, v => v.Type);

            var dtos = posts.Select(p =>
            {
                var dto = SuccessPostDto(p, p.Profile, "").Data;
                dto.UserReaction = reactionsDict.TryGetValue(p.Id, out var type) ? type : null;
                return dto;
            }).ToList();

            var last = posts.LastOrDefault()?.Id;
            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(dtos, "User posts retrieved.", new { lastPostId = last });
        }

        public async Task<ApiResponse<PostDto>> UpdatePostAsync(ClaimsPrincipal userClaims, Guid postId, UpdatePostDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null) return NotFoundResponse<PostDto>("Profile");

            var post = _postRepository.Query()
                .Include(p => p.Media)
                .FirstOrDefault(p => p.Id == postId && !p.IsDeleted);

            if (post == null) return NotFoundResponse<PostDto>("Post");

            if (viewerProfile.Id != post.ProfileId)
                return ApiResponse<PostDto>.ErrorResponse("Unauthorized update.");

            _mapper.Map(dto, post);
            if (post.GroupId.HasValue) post.Visibility = PostVisibility.Public;

            if (dto.FilesToDelete != null && dto.FilesToDelete.Any())
            {
                var mediaToRemove = post.Media.Where(m => dto.FilesToDelete.Contains(m.Id)).ToList();
                foreach (var media in mediaToRemove) _postRepository.RemoveMedia(media);
            }
            await _postRepository.SaveChangesAsync();

            var postToAddMedia = await _postRepository.GetByIdAsync(post.Id);
            if (dto.NewFiles != null && dto.NewFiles.Any())
            {
                int order = postToAddMedia.Media.Count;
                foreach (var file in dto.NewFiles)
                {
                    var (filePath, mediaType) = await _fileService.SaveFileAsync(file);
                    var media = new PostMedia
                    {
                        Id = Guid.NewGuid(),
                        FilePath = filePath,
                        PostId = post.Id,
                        MediaType = mediaType,
                        FileName = file.FileName,
                        Order = ++order
                    };
                    postToAddMedia.UpdatedDate = DateTime.UtcNow;
                    await _postMediaRepository.AddAsync(media);
                }
            }
            await _postRepository.SaveChangesAsync();
            var profile = await _profileRepository.GetByIdAsync(post.ProfileId);
            return SuccessPostDto(post, profile, "Post updated successfully.");
        }

        public async Task<ApiResponse<object>> DeletePostAsync(ClaimsPrincipal userId, Guid postId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userId, out var userIdValue);
            if (invalidUserResponse != null) return invalidUserResponse;

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null) return NotFoundResponse<object>("Post");

            if (post.IsDeleted)
                return ApiResponse<object>.ErrorResponse("Already deleted.");

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null || profile.Id != post.ProfileId)
                return ApiResponse<object>.ErrorResponse("Unauthorized delete.");

            post.IsDeleted = true;
            await _postRepository.UpdateAsync(post);
            await _postRepository.SaveChangesAsync();
            return ApiResponse<object>.SuccessResponse(true, "Post deleted successfully.");
        }

        public async Task<ApiResponse<ProfileMediaDto>> GetProfileMediaAsync(ClaimsPrincipal userClaims, Guid profileId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<ProfileMediaDto>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;
            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null) return ApiResponse<ProfileMediaDto>.ErrorResponse("Invalid user profile.");

            bool isOwner = viewerProfile.Id == profileId;
            bool isFriend = await _friendshipRepository.AnyAsync(f =>
                f.Status == FriendshipStatus.Accepted &&
                ((f.RequesterId == viewerProfile.Id && f.AddresseeId == profileId) ||
                 (f.AddresseeId == viewerProfile.Id && f.RequesterId == profileId)));

            var query = _postMediaRepository.QueryNoTracking()
                .Include(m => m.Post)
                .Where(m => !m.Post.IsDeleted && m.Post.ProfileId == profileId)
                .Where(m => m.Post.Visibility == PostVisibility.Public || isOwner ||
                           (m.Post.Visibility == PostVisibility.FriendsOnly && isFriend));

            var images = await query.Where(m => m.MediaType == MediaType.Image || m.MediaType == MediaType.Video)
                .OrderByDescending(m => m.Post.CreatedDate).Take(6)
                .Select(m => new PostMediaDto
                {
                    Id = m.Id,
                    Url = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}/{m.FilePath}",
                    MediaType = m.MediaType,
                    FileName = m.FileName,
                    Order = m.Order
                }).ToListAsync();

            var documents = await query.Where(m => m.MediaType == MediaType.Document)
                .OrderByDescending(m => m.Post.CreatedDate).Take(3)
                .Select(m => new PostMediaDto
                {
                    Id = m.Id,
                    Url = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}/{m.FilePath}",
                    MediaType = m.MediaType,
                    FileName = m.FileName,
                    Order = m.Order
                }).ToListAsync();

            return ApiResponse<ProfileMediaDto>.SuccessResponse(new ProfileMediaDto { Images = images, Documents = documents });
        }

        private ApiResponse<PostDto> SuccessPostDto(Post post, Database.Models.Profile profile, string message)
        {
            var dto = _mapper.Map<PostDto>(post);
            dto.CreatedAt = post.CreatedDate;
            dto.AuthorName = profile.FullName ?? "Unknown Author";
            dto.AuthorAvatar = profile.Photo;
            dto.Username = profile.User.UserName;
            dto.GroupId = post.GroupId;
            dto.GroupName = post.Group != null ? post.Group.Name : null;
            var baseUrl = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}";
            dto.Media = post.Media.Select(m => new PostMediaDto
            {
                Id = m.Id,
                Url = $"{baseUrl}/{m.FilePath}",
                MediaType = m.MediaType,
                FileName = m.FileName,
                Order = m.Order
            }).ToList();
            return ApiResponse<PostDto>.SuccessResponse(dto, message);
        }
    }
}