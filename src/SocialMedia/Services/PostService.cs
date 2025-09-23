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
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;

        public PostService(UserManager<ApplicationUser> userManager,
            IRepository<Post, Guid> postRepository, IMapper mapper,
             IRepository<Database.Models.Profile, Guid> profileRepository,
              IRepository<Friendship, Guid> friendshipRepository,
               IFileService fileService, IRepository<Group, Guid> groupRepository)
            : base(userManager)
        {
            _postRepository = postRepository;
            _mapper = mapper;
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
            _fileService = fileService;
            _groupRepository = groupRepository;
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

            var postDto = _mapper.Map<PostDto>(post);
            var profile = await _profileRepository.GetByIdAsync(post.ProfileId);
            postDto.AuthorName = profile.FullName ?? "Unknown Author";
            postDto.AuthorAvatar = profile.Photo;

            return ApiResponse<PostDto>.SuccessResponse(postDto, "Post created successfully.");
        }

        public async Task<ApiResponse<PostDto>> GetPostByIdAsync(ClaimsPrincipal userClaims, Guid postId)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post == null || post.IsDeleted)
                return NotFoundResponse<PostDto>("Post");

            var profile = await _profileRepository.GetByIdAsync(post.ProfileId);

            if (post.Visibility == PostVisibility.Public)
            {
                var dtoPublic = _mapper.Map<PostDto>(post);
                dtoPublic.AuthorName = profile.FullName ?? "Unknown Author";
                dtoPublic.AuthorAvatar = profile.Photo;
                return ApiResponse<PostDto>.SuccessResponse(dtoPublic, "Post retrieved successfully.");
            }

            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            var isGuest = invalidUserResponse != null;

            if (!isGuest)
            {
                var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
                if (viewerProfile != null && viewerProfile.Id == post.ProfileId)
                {
                    var dtoOwner = _mapper.Map<PostDto>(post);
                    dtoOwner.AuthorName = profile.FullName ?? "Unknown Author";
                    dtoOwner.AuthorAvatar = profile.Photo;
                    return ApiResponse<PostDto>.SuccessResponse(dtoOwner, "Post retrieved successfully.");
                }

                var isFriend = await _friendshipRepository
                    .AnyAsync(f =>
                        f.Status == FriendshipStatus.Accepted &&
                        ((f.RequesterId == viewerProfile.Id && f.AddresseeId == post.ProfileId) ||
                         (f.RequesterId == post.ProfileId && f.AddresseeId == viewerProfile.Id)));

                if (isFriend)
                {
                    var dtoFriend = _mapper.Map<PostDto>(post);
                    dtoFriend.AuthorName = profile.FullName ?? "Unknown Author";
                    dtoFriend.AuthorAvatar = profile.Photo;
                    return ApiResponse<PostDto>.SuccessResponse(dtoFriend, "Post retrieved successfully.");
                }
            }


            /*var postDto = _mapper.Map<PostDto>(post);
            var profile = await _profileRepository.GetByIdAsync(post.ProfileId);
            postDto.AuthorName = profile.FullName ?? "Unknown Author";*/
            //postDto.AuthorName = _profileRepository.GetByIdAsync(post.ProfileId).Result.User.UserName;
            //postDto.AuthorName = post.Profile?.User.UserName ?? "Unknown Author";

            return ApiResponse<PostDto>.ErrorResponse("You are not authorized to view this post.");
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetFeedAsync(ClaimsPrincipal userClaims,
            Guid? lastPostId = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            var isGuest = invalidUserResponse != null;

            var query = _postRepository.GetAllAttached()
                .Where(p => !p.IsDeleted)
                .Include(p => p.Profile)
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

            if (isGuest)
            {
                query = query.Where(p => p.Visibility == PostVisibility.Public);
            }
            else
            {
                var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
                if (viewerProfile == null)
                    return ApiResponse<IEnumerable<PostDto>>.ErrorResponse("Profile not found.");

                var friendIds = await _friendshipRepository.GetAllAttached()
                    .Where(f =>
                        (f.RequesterId == viewerProfile.Id || f.AddresseeId == viewerProfile.Id) &&
                        f.Status == FriendshipStatus.Accepted)
                    .Select(f => f.RequesterId == viewerProfile.Id ? f.AddresseeId : f.RequesterId)
                    .ToListAsync();

                query = query.Where(p =>
                    p.Visibility == PostVisibility.Public ||
                    (p.Visibility == PostVisibility.FriendsOnly && friendIds.Contains(p.ProfileId)) ||
                    p.ProfileId == viewerProfile.Id);
            }

            var posts = await query.Take(take).ToListAsync();
            var dtos = _mapper.Map<IEnumerable<PostDto>>(posts);

            foreach (var dto in dtos)
            {
                if (string.IsNullOrEmpty(dto.AuthorName))
                {
                    var profile = posts.FirstOrDefault(p => p.Id == dto.Id)?.Profile;
                    dto.AuthorName = profile?.FullName ?? "Unknown";
                    dto.AuthorAvatar = profile?.Photo;
                }
            }

            var last = posts.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(
                dtos,
                "Feed retrieved successfully.",
                new { lastPostId = last }
            );
        }
        public async Task<ApiResponse<IEnumerable<PostDto>>> GetUserPostsAsync(ClaimsPrincipal userClaims,
            Guid profileId, Guid? lastPostId = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            var isGuest = invalidUserResponse != null;

            var query = _postRepository.GetAllAttached()
                .Where(p => !p.IsDeleted && p.ProfileId == profileId)
                .Include(p => p.Profile)
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

            if (isGuest)
            {
                query = query.Where(p => p.Visibility == PostVisibility.Public);
            }
            else
            {
                var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
                if (viewerProfile == null)
                    return ApiResponse<IEnumerable<PostDto>>.ErrorResponse("Profile not found.");

                var isOwner = viewerProfile.Id == profileId;

                var isFriend = await _friendshipRepository
                    .AnyAsync(f =>
                        (f.RequesterId == viewerProfile.Id && f.AddresseeId == profileId ||
                         f.AddresseeId == viewerProfile.Id && f.RequesterId == profileId) &&
                        f.Status == FriendshipStatus.Accepted);

                query = query.Where(p =>
                    p.Visibility == PostVisibility.Public ||
                    (p.Visibility == PostVisibility.FriendsOnly && isFriend) ||
                    isOwner);
            }

            var posts = await query.Take(take).ToListAsync();
            var dtos = _mapper.Map<IEnumerable<PostDto>>(posts);

            var profile = await _profileRepository.GetByIdAsync(profileId);
            foreach (var dto in dtos)
            {
                dto.AuthorName = profile?.FullName ?? "Unknown";
                dto.AuthorAvatar = profile?.Photo;
            }

            var last = posts.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(
                dtos,
                "User posts retrieved successfully.",
                new { lastPostId = last }
            );
        }

        public async Task<ApiResponse<object>> UpdatePostAsync(ClaimsPrincipal userClaims, Guid postId, UpdatePostDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
                return NotFoundResponse<object>("Post");

            var updatePost = _mapper.Map(dto, post);

            await _postRepository.UpdateAsync(updatePost);
            await _postRepository.SaveChangesAsync();

            var postDto = _mapper.Map<PostDto>(updatePost);
            postDto.AuthorName = userClaims.Identity?.Name ?? "Unknown Author";

            return ApiResponse<object>.SuccessResponse(postDto, "Post updated successfully.");
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

    }
}
