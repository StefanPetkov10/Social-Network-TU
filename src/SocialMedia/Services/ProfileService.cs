using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Profile;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class ProfileService : BaseService, IProfileService
    {
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepo;
        private readonly IRepository<Follow, Guid> _followRepo;
        private readonly IRepository<Friendship, Guid> _friendshipRepo;
        private readonly IMapper _mapper;

        public ProfileService(
            UserManager<ApplicationUser> userManager,
            IRepository<Database.Models.Profile, Guid> profileRepo,
            IRepository<Follow, Guid> followRepo, IRepository<Friendship, Guid> friendshipRepo,
            IMapper mapper
        ) : base(userManager)
        {
            _profileRepo = profileRepo;
            _followRepo = followRepo;
            _friendshipRepo = friendshipRepo;
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

            var user = await _userManager.FindByIdAsync(appUserId.ToString());

            var dto = _mapper.Map<ProfileDto>(profile);
            dto.UserName = user?.UserName ?? "Unknown";

            dto.FollowersCount = await _followRepo.QueryNoTracking().CountAsync(f => f.FollowingId == profile.Id);
            dto.FollowingCount = await _followRepo.QueryNoTracking().CountAsync(f => f.FollowerId == profile.Id);
            dto.FriendsCount = await _friendshipRepo.QueryNoTracking().CountAsync(fr =>
                (fr.RequesterId == profile.Id || fr.AddresseeId == profile.Id) && fr.Status == FriendshipStatus.Accepted);

            return ApiResponse<ProfileDto>.SuccessResponse(dto, "Profile retrieved successfully.");
        }

        public async Task<ApiResponse<ProfileDto>> GetProfileByIdAsync(ClaimsPrincipal userClaims, Guid profileId)
        {
            var profile = await _profileRepo.GetByIdAsync(profileId);
            if (profile == null)
                return NotFoundResponse<ProfileDto>("Profile");

            var dto = _mapper.Map<ProfileDto>(profile);

            dto.UserName = profile.ApplicationId != null
                ? (await _userManager.FindByIdAsync(profile.ApplicationId.ToString()))?.UserName ?? string.Empty
                : string.Empty;
            dto.FollowersCount = await _followRepo.QueryNoTracking().CountAsync(f => f.FollowingId == profile.Id);
            dto.FollowingCount = await _followRepo.QueryNoTracking().CountAsync(f => f.FollowerId == profile.Id);
            dto.FriendsCount = await _friendshipRepo.QueryNoTracking().CountAsync(fr =>
                (fr.RequesterId == profile.Id || fr.AddresseeId == profile.Id) && fr.Status == FriendshipStatus.Accepted);

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

            var user = await _userManager.FindByIdAsync(appUserId.ToString());
            if (user == null)
                return NotFoundResponse<object>("User");

            if (user.UserName.ToUpper() != dto.UserName.ToUpper())
            {
                var existingUser = await _userManager.FindByNameAsync(dto.UserName);
                if (existingUser != null)
                {
                    return ApiResponse<object>.ErrorResponse("This Username is already taken.");
                }

                user.UserName = dto.UserName;
                user.NormalizedUserName = dto.UserName.ToUpper();

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                    return ApiResponse<object>.ErrorResponse("Update Profile failed.");
            }

            if (string.IsNullOrEmpty(dto.PhotoBase64))
            {
                string oldPhoto = profile.Photo;
                _mapper.Map(dto, profile);
                profile.Photo = oldPhoto;
            }
            else
            {
                _mapper.Map(dto, profile);
            }

            await _profileRepo.UpdateAsync(profile);
            await _profileRepo.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse(null, "Profile updated successfully.");
        }

        public async Task<ApiResponse<string>> UpdateBioAsync(ClaimsPrincipal userClaims, string bio)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<string>(userClaims, out var appUserId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepo.GetByApplicationIdAsync(appUserId);
            if (profile == null)
                return NotFoundResponse<string>("Profile");

            profile.Bio = bio;

            await _profileRepo.UpdateAsync(profile);
            await _profileRepo.SaveChangesAsync();

            return ApiResponse<string>.SuccessResponse(bio, "Bio updated successfully.");
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
