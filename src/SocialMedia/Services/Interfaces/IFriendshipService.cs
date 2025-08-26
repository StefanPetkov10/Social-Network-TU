using System.Security.Claims;
using SocialMedia.Common;

namespace SocialMedia.Services.Interfaces
{
    public interface IFriendshipService
    {
        Task<ApiResponse<bool>> SendFriendRequestAsync(ClaimsPrincipal userClaims, Guid targetProfileId);
        Task<ApiResponse<bool>> AcceptFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId);
        Task<ApiResponse<bool>> DeclineFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId);
        Task<ApiResponse<bool>> RemoveFriendAsync(ClaimsPrincipal userClaims, Guid friendProfileId);
        Task<ApiResponse<IEnumerable<Database.Models.Profile>>> GetFriendsListAsync(ClaimsPrincipal userClaims);
        Task<ApiResponse<IEnumerable<Database.Models.Profile>>> GetPendingFriendRequestsAsync(ClaimsPrincipal userClaims);
    }
}
