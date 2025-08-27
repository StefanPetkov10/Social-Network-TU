using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Friendship;

namespace SocialMedia.Services.Interfaces
{
    public interface IFriendshipService
    {
        Task<ApiResponse<bool>> SendFriendRequestAsync(ClaimsPrincipal userClaims, Guid targetProfileId);
        Task<ApiResponse<bool>> AcceptFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId);
        Task<ApiResponse<bool>> DeclineFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId);
        Task<ApiResponse<bool>> RemoveFriendAsync(ClaimsPrincipal userClaims, Guid friendProfileId);
        Task<ApiResponse<IEnumerable<FriendDto>>> GetFriendsListAsync(ClaimsPrincipal userClaims);
        Task<ApiResponse<IEnumerable<FriendDto>>> GetPendingFriendRequestsAsync(ClaimsPrincipal userClaims);
    }
}
