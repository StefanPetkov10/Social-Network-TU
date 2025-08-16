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
    public class ProfileService : BaseService, IProfileService
    {
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepo;
        private readonly IMapper _mapper;

        public ProfileService(
            UserManager<ApplicationUser> userManager,
            IRepository<Database.Models.Profile, Guid> profileRepo,
            IMapper mapper
        ) : base(userManager)
        {
            _profileRepo = profileRepo;
            _mapper = mapper;
        }

        public async Task<ApiResponse<ProfileDto>> GetProfileAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<ProfileDto>(userClaims, out var appUserId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepo.GetByApplicationIdAsync(appUserId);
            if (profile == null)
                return NotFoundResponse<ProfileDto>("Profile");

            var dto = _mapper.Map<ProfileDto>(profile);
            dto.UserName = userClaims.Identity.Name ?? string.Empty;
            return ApiResponse<ProfileDto>.SuccessResponse(dto, "Profile retrieved successfully.");
        }

        public async Task<ApiResponse<object>> UpdateProfileAsync(ClaimsPrincipal userClaims, UpdateProfileDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userClaims, out var appUserId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepo.GetByApplicationIdAsync(appUserId);
            if (profile == null)
                return NotFoundResponse<object>("Profile");

            _mapper.Map(dto, profile);
            await _profileRepo.UpdateAsync(profile);
            await _profileRepo.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse(dto, "Profile updated successfully.");
        }

        public async Task<ApiResponse<object>> ChangePasswordAsync(ClaimsPrincipal userClaims, ChangePasswordDto dto)
        {
            var user = await _userManager.GetUserAsync(userClaims);
            if (user == null)
                return NotFoundResponse<object>("User");

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
                return IdentityErrorResponse<object>(result, "Password change failed.");

            return ApiResponse<object>.SuccessResponse(null, "Password changed successfully.");
        }
    }
}
