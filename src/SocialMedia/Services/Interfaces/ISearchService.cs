using SocialMedia.Common;
using System.Security.Claims;
using SocialMedia.DTOs.Profile;

namespace SocialMedia.Services.Interfaces
{
    public interface ISearchService
    {
        Task<ApiResponse<List<ProfileDto>>> SearchUsersAsync(ClaimsPrincipal userClaims, string query);
    }
}
