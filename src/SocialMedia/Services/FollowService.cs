using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Follow;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class FollowService : BaseService, IFollowService
    {
        private readonly IRepository<Follow, Guid> _followRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IMapper _mapper;

        public FollowService(UserManager<ApplicationUser> userManager,
            IRepository<Follow, Guid> followRepository,
            IRepository<Database.Models.Profile, Guid> profileRepository,
            IMapper mapper) : base(userManager)
        {
            _followRepository = followRepository;
            _profileRepository = profileRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse<bool>> FollowAsync(ClaimsPrincipal userClaims, Guid followingId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var follower = await _profileRepository.GetByApplicationIdAsync(appUserId);
            if (follower == null)
                return NotFoundResponse<bool>("Your profile");

            if (follower.Id == followingId)
                return ApiResponse<bool>.ErrorResponse("You cannot follow yourself.");

            var following = await _profileRepository.GetByIdAsync(followingId);

            if (follower == null || following == null)
                return ApiResponse<bool>.ErrorResponse("Invalid profiles.");

            var existing = await _followRepository
                .FirstOrDefaultAsync(f => f.FollowerId == follower.Id && f.FollowingId == followingId);

            if (existing != null)
                return ApiResponse<bool>.ErrorResponse("Already following.");

            var follow = new Follow
            {
                Id = Guid.NewGuid(),
                FollowerId = follower.Id,
                FollowingId = followingId
            };

            await _followRepository.AddAsync(follow);
            await _followRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Followed successfully.");
        }

        public async Task<ApiResponse<bool>> UnfollowAsync(ClaimsPrincipal userClaims, Guid followingId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var follower = await _profileRepository.GetByApplicationIdAsync(appUserId);
            if (follower == null)
                return NotFoundResponse<bool>("Your profile");

            if (follower.Id == followingId)
                return ApiResponse<bool>.ErrorResponse("You cannot unfollow yourself.");

            var follow = await _followRepository
                .FirstOrDefaultAsync(f => f.FollowerId == follower.Id && f.FollowingId == followingId);

            if (follow == null)
                return ApiResponse<bool>.ErrorResponse("Not following this profile.");

            await _followRepository.DeleteAsync(follow);
            await _followRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Unfollowed successfully.");
        }
        public async Task<ApiResponse<bool>> IsFollowingAsync(ClaimsPrincipal userClaims, Guid followingId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var follower = await _profileRepository.GetByApplicationIdAsync(appUserId);
            if (follower == null)
                return NotFoundResponse<bool>("Your profile");

            var followerId = follower.Id;
            var exists = await _followRepository
               .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);

            return ApiResponse<bool>.SuccessResponse(exists);
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowersAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Unauthorized.", new[] { "Invalid user claim." });

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null)
                return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Profile not found.", new[] { "User profile does not exist." });

            var followers = await _followRepository.GetAllAttached()
                .Where(f => f.FollowingId == userProfile.Id)
                .Include(f => f.Follower)
                    .ThenInclude(u => u.User)
                .Select(f => f.Follower)
                .ToListAsync();

            var followerDto = _mapper.Map<IEnumerable<FollowDto>>(followers);

            return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(followerDto, "Followers list retrieved successfully");
        }

        public Task<ApiResponse<int>> GetFollowersCountAsync(ClaimsPrincipal userClaims)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowingAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Unauthorized.", new[] { "Invalid user claim." });

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null)
                return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Profile not found.", new[] { "User profile does not exist." });

            var followers = await _followRepository.GetAllAttached()
                .Where(f => f.FollowerId == userProfile.Id)
                .Include(f => f.Following)
                    .ThenInclude(u => u.User)
                .Select(f => f.Following)
                .ToListAsync();

            var followerDto = _mapper.Map<IEnumerable<FollowDto>>(followers);

            return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(followerDto, "Following list retrieved successfully");
        }


        public Task<ApiResponse<int>> GetFollowingCountAsync(ClaimsPrincipal userClaims)
        {
            throw new NotImplementedException();
        }



    }
}
