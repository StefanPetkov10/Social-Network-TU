using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Reaction;

namespace SocialMedia.Services.Interfaces
{
    public interface IReactionService
    {
        Task<ApiResponse<string>> ReactToPostAsync(ClaimsPrincipal userClaim, Guid postId, ReactionType type);
        Task<ApiResponse<string>> ReactToCommentAsync(ClaimsPrincipal userClaim, Guid commentId, ReactionType type);
        Task<ApiResponse<string>> ReactToMessageAsync(ClaimsPrincipal userClaim, Guid messageId, ReactionType type);
        Task<ApiResponse<ReactorListResponse>> GetReactorsAsync(
            ClaimsPrincipal userClaims,
            Guid entityId,
            string entityType,
            ReactionType? typeFilter = null,
            Guid? lastReactionId = null,
            int take = 20);
    }
}
