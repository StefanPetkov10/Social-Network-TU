using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Comment;

namespace SocialMedia.Services.Interfaces
{
    public interface ICommentService
    {
        Task<ApiResponse<CommentDto>> CreateCommentAsPost(ClaimsPrincipal userClaims, Guid postId, CreateCommentDto dto);
        Task<ApiResponse<IEnumerable<CommentDto>>> GetCommentsByPostIdAsync(ClaimsPrincipal userClaims, Guid postId, Guid? lastCommentId = null, int take = 20);
        Task<ApiResponse<IEnumerable<CommentDto>>> GetRepliesAsync(ClaimsPrincipal userClaims, Guid commentId, Guid? lastCommentId = null, int take = 10);
        Task<ApiResponse<bool>> SoftDeleteCommentAsync(ClaimsPrincipal userClaims, Guid commentId);
        Task<ApiResponse<CommentDto?>> EditCommentAsync(ClaimsPrincipal userClaim, Guid commentId, UpdateCommentDto dto);
    }
}
