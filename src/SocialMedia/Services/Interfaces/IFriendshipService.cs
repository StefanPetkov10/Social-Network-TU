using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Friendship;

namespace SocialMedia.Services.Interfaces
{
    public interface IFriendshipService
    {
        Task<ApiResponse<IEnumerable<FriendSuggestionDto>>> GetFriendSuggestionsAsync(ClaimsPrincipal userClaims, int skip = 0, int take = 20);
        Task<ApiResponse<bool>> SendFriendRequestAsync(ClaimsPrincipal userClaims, Guid targetProfileId);
        Task<ApiResponse<bool>> CancelFriendRequestAsync(ClaimsPrincipal userClaims, Guid targetProfileId);
        Task<ApiResponse<bool>> AcceptFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId);
        Task<ApiResponse<bool>> DeclineFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId);
        Task<ApiResponse<bool>> RemoveFriendAsync(ClaimsPrincipal userClaims, Guid friendProfileId);
        Task<ApiResponse<IEnumerable<FriendDto>>> GetFriendsListAsync(Guid profileId, DateTime? lastFriendshipDate = null, int take = 20);
        Task<ApiResponse<IEnumerable<PendingFriendDto>>> GetPendingFriendRequestsAsync(
            ClaimsPrincipal userClaims,
            DateTime? lastRequestDate = null,
            int take = 20);
    }
}