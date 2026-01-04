using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Follow;

namespace SocialMedia.Services.Interfaces
{
    public interface IFollowService
    {
        Task<ApiResponse<bool>> FollowAsync(ClaimsPrincipal userClaims, Guid followingId);
        Task<ApiResponse<bool>> UnfollowAsync(ClaimsPrincipal userClaims, Guid followingId);

        Task<ApiResponse<bool>> IsFollowingAsync(ClaimsPrincipal userClaims, Guid followingId);

        Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowersAsync(ClaimsPrincipal userClaims, DateTime? lastFollowerDate = null, int take = 20);
        Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowingAsync(ClaimsPrincipal userClaims, DateTime? lastFollowingDate = null, int take = 20);

        Task<ApiResponse<IEnumerable<FollowSuggestionDto>>> GetFollowSuggestionsAsync(ClaimsPrincipal userClaims, int skip = 0, int take = 10);
    }
}
