using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Profile;

namespace SocialMedia.Services.Interfaces
{
    public interface IProfileService
    {
        Task<ApiResponse<ProfileDto>> GetProfileAsync(ClaimsPrincipal user);
        Task<ApiResponse<ProfileDto>> GetProfileByIdAsync(ClaimsPrincipal user, Guid profileId);
        Task<ApiResponse<object>> UpdateProfileAsync(ClaimsPrincipal user, UpdateProfileDto dto);
        Task<ApiResponse<object>> ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordDto dto);
    }
}
