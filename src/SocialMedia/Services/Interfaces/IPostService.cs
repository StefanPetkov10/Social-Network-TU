using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Post;

namespace SocialMedia.Services.Interfaces
{
    public interface IPostService
    {
        Task<ApiResponse<PostDto>> CreatePostAsPost(ClaimsPrincipal userClaims, CreatePostDto dto);
        Task<ApiResponse<PostDto>> GetPostByIdAsync(ClaimsPrincipal userClaims, Guid postId);
        Task<ApiResponse<IEnumerable<PostDto>>> GetFeedAsync(ClaimsPrincipal userClaims, Guid? lastPostId = null, int take = 20);
        Task<ApiResponse<IEnumerable<PostDto>>> GetUserPostsAsync(ClaimsPrincipal userClaims, Guid profileId, Guid? lastPostId = null, int take = 10);
        Task<ApiResponse<PostDto>> UpdatePostAsync(ClaimsPrincipal userClaims, Guid postId, UpdatePostDto dto);
        Task<ApiResponse<object>> DeletePostAsync(ClaimsPrincipal userId, Guid postId);
        Task<ApiResponse<ProfileMediaDto>> GetProfileMediaAsync(ClaimsPrincipal userClaims, Guid profileId);
    }
}