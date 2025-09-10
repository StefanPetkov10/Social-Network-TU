using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Post;

namespace SocialMedia.Services.Interfaces
{
    public interface IPostService
    {
        Task<ApiResponse<PostDto>> CreatePostAsPost(ClaimsPrincipal userClaims, CreatePostDto dto);
        Task<ApiResponse<PostDto>> GetPostByIdAsync(Guid postId);
        Task<ApiResponse<IEnumerable<PostDto>>> GetAllPostsAsync();
        Task<ApiResponse<object>> UpdatePostAsync(ClaimsPrincipal userClaims, Guid postId, UpdatePostDto dto);
        Task<ApiResponse<object>> DeletePostAsync(ClaimsPrincipal userId, Guid postId);
        Task<ApiResponse<object>> LikePostAsync(ClaimsPrincipal userClaims, Guid postId);
        Task<ApiResponse<object>> UnlikePostAsync(ClaimsPrincipal userClaims, Guid postId);
    }
}