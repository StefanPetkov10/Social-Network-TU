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
            //var userId = _userManager.GetUserId(userClaims);
            //var user = await _profileRepo
            //.GetByIdAsync(new Guid(userId));

            var userId = new Guid(_userManager.GetUserId(userClaims));
            var profile = await _profileRepo.GetByIdAsync(userId);

            if (profile == null)
                return new ApiResponse<UpdateProfileDto> { Success = false, Message = "User not found." };

            var dto = _mapper.Map<UpdateProfileDto>(profile);
            return new ApiResponse<UpdateProfileDto> { Success = true, Data = dto };

        }

        public async Task<ApiResponse<object>> UpdateProfileAsync(ClaimsPrincipal userClaims, UpdateProfileDto dto)
        {
            var user = await _userManager.GetUserAsync(userClaims);
            if (user?.Profile == null)
                return new ApiResponse<object> { Success = false, Message = "User not found." };

            _mapper.Map(dto, user.Profile);

            var result = await _profileRepo.UpdateAsync(user.Profile);
            if (!result)
                return new ApiResponse<object> { Success = false, Message = "Failed to update profile." };

            return new ApiResponse<object> { Success = true, Message = "Profile updated." };
        }

        public async Task<ApiResponse<object>> ChangePasswordAsync(ClaimsPrincipal userClaims, ChangePasswordDto dto)
        {
            var user = await _userManager.GetUserAsync(userClaims);
            if (user == null)
                return new ApiResponse<object> { Success = false, Message = "User not found." };

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
                return new ApiResponse<object> { Success = false, Errors = result.Errors.Select(e => e.Description).ToArray() };

            return new ApiResponse<object> { Success = true, Message = "Password changed." };
        }
    }
}
