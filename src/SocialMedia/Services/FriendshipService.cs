using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Friendship;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class FriendshipService : BaseService, IFriendshipService
    {
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IMapper _mapper;

        public FriendshipService(IRepository<Friendship, Guid> friendshipRepository,
            IRepository<Database.Models.Profile, Guid> profileRepository, IMapper mapper,
            UserManager<ApplicationUser> userManager)
            : base(userManager)
        {
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse<bool>> SendFriendRequestAsync(ClaimsPrincipal userClaims, Guid targetProfileId)
        {
            try
            {
                var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
                if (invalidUserResponse != null)
                    return ApiResponse<bool>.ErrorResponse("Unauthorized.", new[] { "Invalid user claim." });

                var requester = await _profileRepository.GetByApplicationIdAsync(userId);
                var requesterId = requester?.Id;

                if (requesterId == null)
                    return NotFoundResponse<bool>("Your profile");

                if (requesterId == targetProfileId)
                    return ApiResponse<bool>.ErrorResponse("You cannot send a friend request to yourself.");

                var existing = await _friendshipRepository.FirstOrDefaultAsync(f =>
                f.RequesterId == requesterId && f.AddresseeId == targetProfileId ||
                f.RequesterId == targetProfileId && f.AddresseeId == requesterId);

                if (existing != null)
                {
                    if (existing.Status == FriendshipStatus.Accepted)
                        return ApiResponse<bool>.ErrorResponse("You are already friends.");
                    if (existing.Status == FriendshipStatus.Pending)
                        return ApiResponse<bool>.ErrorResponse("Friend request already pending.");
                }

                var friendship = new Friendship
                {
                    Id = Guid.NewGuid(),
                    RequesterId = (Guid)requesterId,
                    AddresseeId = targetProfileId,
                    Status = FriendshipStatus.Pending,
                    RequestedAt = DateTime.UtcNow
                };

                await _friendshipRepository.AddAsync(friendship);
                await _friendshipRepository.SaveChangesAsync();

                return ApiResponse<bool>.SuccessResponse(true, "Friend request sent successfully.");

            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse("An error occurred while sending the friend request.", new[] { ex.Message });
            }
        }

        public async Task<ApiResponse<bool>> AcceptFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return ApiResponse<bool>.ErrorResponse("Unauthorized.", new[] { "Invalid user claim." });

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null)
                return ApiResponse<bool>.ErrorResponse("Profile not found.", new[] { "User profile does not exist." });

            var request = await _friendshipRepository.GetByIdAsync(requestId);
            if (request == null)
                return ApiResponse<bool>.ErrorResponse("Friend request not found.");

            if (request.AddresseeId != userProfile.Id)
                return ApiResponse<bool>.ErrorResponse("You are not authorized to accept this friend request.");

            if (request.Status != FriendshipStatus.Pending || request.Status == FriendshipStatus.Accepted)
                return ApiResponse<bool>.ErrorResponse("This friend request cannot be accepted.", new[] { "This status is not suitable for accepted" });

            request.Status = FriendshipStatus.Accepted;
            request.AcceptedAt = DateTime.UtcNow;

            await _friendshipRepository.UpdateAsync(request);
            await _friendshipRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Friend request accepted successfully.");
        }

        public async Task<ApiResponse<IEnumerable<FriendDto>>> GetPendingFriendRequestsAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return ApiResponse<IEnumerable<FriendDto>>.ErrorResponse("Unauthorized.", new[] { "Invalid user claim." });

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null)
                return ApiResponse<IEnumerable<FriendDto>>.ErrorResponse("Profile not found.", new[] { "User profile does not exist." });

            var pendingRequests = await _friendshipRepository.GetAllAttached()
                .Where(f => f.AddresseeId == userProfile.Id
                    && f.Status == FriendshipStatus.Pending)
                .Include(f => f.Requester)
                    .ThenInclude(r => r.User)
                .Select(f => f.Requester)
                .ToListAsync();

            var friendDtos = _mapper.Map<IEnumerable<FriendDto>>(pendingRequests);

            return ApiResponse<IEnumerable<FriendDto>>.SuccessResponse(friendDtos, "Pending friend requests retrieved successfully.");
        }

        public async Task<ApiResponse<IEnumerable<FriendDto>>> GetFriendsListAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return ApiResponse<IEnumerable<FriendDto>>.ErrorResponse("Unauthorized.", new[] { "Invalid user claim." });

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null)
                return ApiResponse<IEnumerable<FriendDto>>.ErrorResponse("Profile not found.", new[] { "User profile does not exist." });

            var friendships = await _friendshipRepository
                .GetAllAttached()
                .Where(f => (f.RequesterId == userProfile.Id || f.AddresseeId == userProfile.Id)
                            && f.Status == FriendshipStatus.Accepted)
                .Include(f => f.Requester)
                    .ThenInclude(p => p.User)
                .Include(f => f.Addressee)
                    .ThenInclude(p => p.User)
                .ToListAsync();

            var friendEntities = friendships
                .Select(f => f.RequesterId == userProfile.Id ? f.Addressee : f.Requester)
                .ToList();

            var friendDtos = _mapper.Map<List<FriendDto>>(friendEntities);

            //var friendDtos = _mapper.Map<List<FriendDto>>(
            //friendships.Select(f => f.RequesterId == userProfile.Id ? f.Addressee : f.Requester)

            return ApiResponse<IEnumerable<FriendDto>>.SuccessResponse(friendDtos, "Friends list retrieved successfully.");
        }

        public Task<ApiResponse<bool>> DeclineFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<bool>> RemoveFriendAsync(ClaimsPrincipal userClaims, Guid friendProfileId)
        {
            throw new NotImplementedException();
        }


    }
}
