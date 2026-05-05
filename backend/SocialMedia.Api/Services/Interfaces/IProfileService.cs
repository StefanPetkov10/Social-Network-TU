using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Profile;

namespace SocialMedia.Services.Interfaces
{
    public interface IProfileService
    {
        Task<ApiResponse<ProfileDto>> GetProfileAsync(ClaimsPrincipal userClaims);
        Task<ApiResponse<ProfileDto>> GetProfileByUsernameAsync(ClaimsPrincipal userClaims, string username);
        Task<ApiResponse<ProfileDto>> GetProfileByIdAsync(ClaimsPrincipal userClaims, Guid profileId);

        Task<ApiResponse<object>> UpdateProfileAsync(ClaimsPrincipal userClaims, UpdateProfileDto dto);
        Task<ApiResponse<string>> UpdateBioAsync(ClaimsPrincipal userClaims, string bio);
        Task<ApiResponse<object>> ChangePasswordAsync(ClaimsPrincipal userClaims, ChangePasswordDto dto);
    }
}