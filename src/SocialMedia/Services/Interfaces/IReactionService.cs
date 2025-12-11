using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Services.Interfaces
{
    public interface IReactionService
    {
        Task<ApiResponse<string>> ReactToPostAsync(ClaimsPrincipal userClaim, Guid postId, ReactionType type);
        Task<ApiResponse<string>> ReactToCommentAsync(ClaimsPrincipal userClaim, Guid commentId, ReactionType type);


    }
}
