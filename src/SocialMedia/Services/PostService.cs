using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class PostService : BaseService, IPostService
    {
        private readonly IRepository<Post, Guid> _postRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IMapper _mapper;

        public PostService(UserManager<ApplicationUser> userManager,
            IRepository<Post, Guid> postRepository, IMapper mapper,
             IRepository<Database.Models.Profile, Guid> profileRepository)
            : base(userManager)
        {
            _postRepository = postRepository;
            _mapper = mapper;
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

            await _postRepository.AddAsync(post);
            await _postRepository.SaveChangesAsync();

            var postDto = _mapper.Map<PostDto>(post);
            postDto.AuthorName = userClaims.Identity?.Name ?? "Unknown Author";

            return ApiResponse<PostDto>.SuccessResponse(postDto, "Post created successfully.");
        }

        public async Task<ApiResponse<object>> DeletePostAsync(ClaimsPrincipal userId, Guid postId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetAllPostsAsync()
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<PostDto>> GetPostByIdAsync(Guid postId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> LikePostAsync(ClaimsPrincipal userClaims, Guid postId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> UnlikePostAsync(ClaimsPrincipal userClaims, Guid postId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> UpdatePostAsync(ClaimsPrincipal userClaims, Guid postId, UpdatePostDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
