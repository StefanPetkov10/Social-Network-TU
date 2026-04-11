using SocialMedia.Common;
using SocialMedia.DTOs.Group;
using SocialMedia.DTOs.Profile;
using System.Security.Claims;

namespace SocialMedia.Services.Interfaces
{
    public interface ISearchService
    {
        Task<ApiResponse<List<ProfileDto>>> SearchUsersAsync(ClaimsPrincipal userClaims, string query);
        Task<ApiResponse<List<GroupDto>>> SearchGroupsAsync(ClaimsPrincipal userClaims, string query);
    }
}
