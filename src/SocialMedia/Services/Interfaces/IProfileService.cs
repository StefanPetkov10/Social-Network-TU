using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Profile;

namespace SocialMedia.Services.Interfaces
{
    public interface IProfileService
    {
        Task<ApiResponse<UpdateProfileDto>> GetProfileAsync(ClaimsPrincipal user);
        Task<ApiResponse<object>> UpdateProfileAsync(ClaimsPrincipal user, UpdateProfileDto dto);
        Task<ApiResponse<object>> ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordDto dto);
    }
}
