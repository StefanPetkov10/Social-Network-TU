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

            var dto = await MapProfileToDto(profile);
            return ApiResponse<ProfileDto>.SuccessResponse(dto, "Profile retrieved successfully.");
        }

        public async Task<ApiResponse<ProfileDto>> GetProfileByUsernameAsync(ClaimsPrincipal userClaims, string username)
        {
            var profile = await _profileRepo.QueryNoTracking()
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.User.UserName != null && p.User.UserName.ToUpper() == username.ToUpper());

            if (profile == null)
                return NotFoundResponse<ProfileDto>("Profile");

            var dto = await MapProfileToDto(profile);

            await PopulateRelationshipData(userClaims, dto, profile.Id);

            return ApiResponse<ProfileDto>.SuccessResponse(dto, "Profile retrieved successfully.");
        }

        public async Task<ApiResponse<ProfileDto>> GetProfileByIdAsync(ClaimsPrincipal userClaims, Guid profileId)
        {
            var profile = await _profileRepo.GetByIdAsync(profileId);
            if (profile == null)
                return NotFoundResponse<ProfileDto>("Profile");

            var dto = await MapProfileToDto(profile);

            await PopulateRelationshipData(userClaims, dto, profile.Id);

            return ApiResponse<ProfileDto>.SuccessResponse(dto, "Profile retrieved successfully.");
        }

        private async Task<ProfileDto> MapProfileToDto(Database.Models.Profile profile)
        {
            var dto = _mapper.Map<ProfileDto>(profile);
            dto.AuthorAvatar = profile.Photo;

            if (profile.User == null && profile.ApplicationId != null)
            {
                var user = await _userManager.FindByIdAsync(profile.ApplicationId.ToString());
                dto.UserName = user?.UserName ?? "Unknown";
            }
            else if (profile.User != null)
            {
                dto.UserName = profile.User.UserName;
            }

            dto.FollowersCount = await _followRepo.QueryNoTracking().CountAsync(f => f.FollowingId == profile.Id);
            dto.FollowingCount = await _followRepo.QueryNoTracking().CountAsync(f => f.FollowerId == profile.Id);
            dto.FriendsCount = await _friendshipRepo.QueryNoTracking().CountAsync(fr =>
                (fr.RequesterId == profile.Id || fr.AddresseeId == profile.Id) && fr.Status == FriendshipStatus.Accepted);

            return dto;
        }

        private async Task PopulateRelationshipData(ClaimsPrincipal userClaims, ProfileDto dto, Guid targetProfileId)
        {
            /* var userIdStr = _userManager.GetUserId(userClaims);
             if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var appUserId))
             {
                 return; 
             }*/
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userClaims, out var appUserId);
            if (invalidUserResponse != null)
                return;

            var myProfile = await _profileRepo.GetByApplicationIdAsync(appUserId);
            if (myProfile == null || myProfile.Id == targetProfileId) return;

            // 1. Проверка Follow
            dto.IsFollowed = await _followRepo.QueryNoTracking()
                .AnyAsync(f => f.FollowerId == myProfile.Id && f.FollowingId == targetProfileId);

            // 2. Проверка Friendship
            var friendship = await _friendshipRepo.QueryNoTracking()
                .FirstOrDefaultAsync(f =>
                    (f.RequesterId == myProfile.Id && f.AddresseeId == targetProfileId) ||
                    (f.RequesterId == targetProfileId && f.AddresseeId == myProfile.Id));

            if (friendship != null)
            {
                dto.FriendshipStatus = (int)friendship.Status;
                dto.FriendshipRequestId = friendship.Id;

                dto.IsFriendRequestSender = friendship.RequesterId == myProfile.Id;
            }
            else
            {
                dto.FriendshipStatus = -1;
                dto.IsFriendRequestSender = false;
            }
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