using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Comment;

namespace SocialMedia.Services.Interfaces
{
    public interface ICommentService
    {
        Task<ApiResponse<CommentDto>> CreateCommentAsPost(ClaimsPrincipal userClaims, Guid postId, CreateCommentDto dto);
        Task<ApiResponse<IEnumerable<CommentDto>>> GetCommentsByPostIdAsync(ClaimsPrincipal userClaims, Guid postId, Guid? lastCommentId = null, int take = 20);
        Task<(IEnumerable<CommentDto> Replies, int TotalCount)> GetRepliesAsync(Guid commentId, Guid? lastCommentId, int take = 20);
        Task<ApiResponse<bool>> SoftDeleteCommentAsync(Guid commentId, Guid requesterProfileId); // soft delete
        Task<ApiResponse<CommentDto?>> EditCommentAsync(Guid commentId, Guid requesterProfileId, string newContent, IFormFileCollection? newFiles = null, IEnumerable<Guid>? removeMediaIds = null);
        Task<ApiResponse<int>> GetCommentCountForPostAsync(Guid postId);

    }
}
