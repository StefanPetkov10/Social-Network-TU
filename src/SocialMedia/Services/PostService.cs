using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
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
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly IMapper _mapper;

        public PostService(UserManager<ApplicationUser> userManager,
            IRepository<Post, Guid> postRepository, IMapper mapper,
             IRepository<Database.Models.Profile, Guid> profileRepository,
              IRepository<Friendship, Guid> friendshipRepository)
            : base(userManager)
        {
            _postRepository = postRepository;
            _mapper = mapper;
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
        }

        public async Task<ApiResponse<PostDto>> CreatePostAsPost(ClaimsPrincipal userClaims, CreatePostDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var author = await _profileRepository.GetByApplicationIdAsync(userId);
            if (author == null)
                return NotFoundResponse<PostDto>("Post");

            var post = _mapper.Map<Post>(dto);
            post.ProfileId = author.Id;

            if (!Enum.IsDefined(typeof(PostVisibility), post.Visibility))
                post.Visibility = PostVisibility.Public;

            await _postRepository.AddAsync(post);
            await _postRepository.SaveChangesAsync();

            var postDto = _mapper.Map<PostDto>(post);
            var profile = await _profileRepository.GetByIdAsync(post.ProfileId);
            postDto.AuthorName = profile.FullName ?? "Unknown Author";
            postDto.AuthorAvatar = profile.Photo;

            return ApiResponse<PostDto>.SuccessResponse(postDto, "Post created successfully.");
        }
        public async Task<ApiResponse<PostDto>> GetPostByIdAsync(Guid postId)
        {
            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null || post.IsDeleted)
                return NotFoundResponse<PostDto>("Post");

            var postDto = _mapper.Map<PostDto>(post);
            var profile = await _profileRepository.GetByIdAsync(post.ProfileId);
            postDto.AuthorName = profile.FullName ?? "Unknown Author";
            postDto.AuthorAvatar = profile.Photo;

            //postDto.AuthorName = _profileRepository.GetByIdAsync(post.ProfileId).Result.User.UserName;
            //postDto.AuthorName = post.Profile?.User.UserName ?? "Unknown Author";

            return ApiResponse<PostDto>.SuccessResponse(postDto, "Post retrieved successfully.");
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetAllPostsAsync()
        {
            var posts = await _postRepository.GetAllAsync();

            var activePosts = posts.Where(x => !x.IsDeleted).ToList();

            if (!activePosts.Any())
                return NotFoundResponse<IEnumerable<PostDto>>("Posts");

            var postDtos = _mapper.Map<IEnumerable<PostDto>>(activePosts);
            foreach (var postDto in postDtos)
            {
                Post post = activePosts.FirstOrDefault(p => p.Id == postDto.Id);
                var profile = await _profileRepository.GetByIdAsync(post.ProfileId);
                postDto.AuthorName = profile.FullName ?? "Unknown Author";
                postDto.AuthorAvatar = profile.Photo;

            }

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(postDtos, "Posts retrieved successfully.");
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
