using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Follow;
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

            return ApiResponse<bool>.SuccessResponse(true, "Unfollowed successfully.");
        }
        public Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowersAsync(Guid profileId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<int>> GetFollowersCountAsync(Guid profileId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowingAsync(Guid profileId)
        {
            throw new NotImplementedException();
        }


        public Task<ApiResponse<int>> GetFollowingCountAsync(Guid profileId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<bool>> IsFollowingAsync(ClaimsPrincipal userClaims, Guid followingId)
        {
            throw new NotImplementedException();
        }


    }
}
