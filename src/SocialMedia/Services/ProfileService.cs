using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Profile;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class ProfileService : IProfileService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepo;
        private readonly IMapper _mapper;

        public ProfileService(UserManager<ApplicationUser> userManager,
                              IRepository<Database.Models.Profile, Guid> profileRepo,
                              IMapper mapper)
        {
            _userManager = userManager;
            _profileRepo = profileRepo;
            _mapper = mapper;
        }

        public async Task<ApiResponse<UpdateProfileDto>> GetProfileAsync(ClaimsPrincipal userClaims)
        {
            var appUserId = new Guid(_userManager.GetUserId(userClaims)!);
            var profile = await _profileRepo.GetByApplicationIdAsync(appUserId);

            if (profile == null)
                return ApiResponse<UpdateProfileDto>.ErrorResponse(
                    "User not found.",
                    new[] { "Profile does not exist." }
                );

            var dto = _mapper.Map<UpdateProfileDto>(profile);

            return ApiResponse<UpdateProfileDto>.SuccessResponse(dto, "Profile retrieved successfully.");
        }

        public async Task<ApiResponse<object>> UpdateProfileAsync(ClaimsPrincipal userClaims, UpdateProfileDto dto)
        {
            var appUserId = _userManager.GetUserId(userClaims);
            if (string.IsNullOrEmpty(appUserId))
            {
                return ApiResponse<object>.ErrorResponse(
                    "Unauthorized.",
                    new[] { "Invalid user claim." }
                );
            }

            var profile = await _profileRepo.GetByApplicationIdAsync(new Guid(appUserId));
            if (profile == null)
            {
                return ApiResponse<object>.ErrorResponse(
                    "User not found.",
                    new[] { "Profile not found for the given user." }
                );
            }

            _mapper.Map(dto, profile);

            await _profileRepo.UpdateAsync(profile);
            await _profileRepo.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse(dto, "Profile updated successfully.");
        }

        public async Task<ApiResponse<object>> ChangePasswordAsync(ClaimsPrincipal userClaims, ChangePasswordDto dto)
        {
            var user = await _userManager.GetUserAsync(userClaims);
            if (user == null)
            {
                return ApiResponse<object>.ErrorResponse(
                    "User not found.",
                    new[] { "Invalid user." }
                );
            }

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
            {
                return ApiResponse<object>.ErrorResponse(
                    "Password change failed.",
                    result.Errors.Select(e => e.Description).ToArray()
                );
            }

            return ApiResponse<object>.SuccessResponse(null, "Password changed successfully.");
        }
    }
}
