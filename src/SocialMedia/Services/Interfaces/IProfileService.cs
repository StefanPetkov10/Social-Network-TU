using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Profile;

namespace SocialMedia.Services.Interfaces
{
    public interface IProfileService
    {
        Task<ApiResponse<ProfileDto>> GetProfileAsync(ClaimsPrincipal user);
        Task<ApiResponse<ProfileDto>> GetProfileByIdAsync(Guid profileId);
        Task<ApiResponse<ProfileDto>> GetProfileByUsernameAsync(string username);

        Task<ApiResponse<object>> UpdateProfileAsync(ClaimsPrincipal user, UpdateProfileDto dto);
        Task<ApiResponse<string>> UpdateBioAsync(ClaimsPrincipal user, string bio);
        Task<ApiResponse<object>> ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordDto dto);
    }
}
