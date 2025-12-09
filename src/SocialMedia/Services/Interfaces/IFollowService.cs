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

        Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowersAsync(ClaimsPrincipal userClaims);
        Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowingAsync(ClaimsPrincipal userClaims);
    }
}
