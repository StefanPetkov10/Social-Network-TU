using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Follow;

namespace SocialMedia.Services.Interfaces
{
    public interface IFollowService
    {
        Task<ApiResponse<bool>> FollowAsync(ClaimsPrincipal userClaims, Guid followingId);
        Task<ApiResponse<bool>> UnfollowAsync(ClaimsPrincipal userClaims, Guid followingId);
        Task<ApiResponse<bool>> RemoveFollowerAsync(ClaimsPrincipal userClaims, Guid followerId);

        Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowersAsync(
            ClaimsPrincipal userClaims,
            Guid targetProfileId,
            DateTime? lastFollowerDate = null,
            int take = 20);

        Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowingAsync(
            ClaimsPrincipal userClaims,
            Guid targetProfileId,
            DateTime? lastFollowingDate = null,
            int take = 20);

        Task<ApiResponse<IEnumerable<FollowSuggestionDto>>> GetFollowSuggestionsAsync(
            ClaimsPrincipal userClaims,
            int skip = 0,
            int take = 10);

        Task<ApiResponse<IEnumerable<FollowDto>>> SearchFollowersAsync(ClaimsPrincipal userClaims, Guid targetProfileId, string query, int take = 20);
        Task<ApiResponse<IEnumerable<FollowDto>>> SearchFollowingAsync(ClaimsPrincipal userClaims, Guid targetProfileId, string query, int take = 20);
    }
}