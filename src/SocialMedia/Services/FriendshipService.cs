using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
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

        public Task<ApiResponse<bool>> AcceptFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<bool>> DeclineFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId)
        {
            throw new NotImplementedException();
        }


        public Task<ApiResponse<bool>> RemoveFriendAsync(ClaimsPrincipal userClaims, Guid friendProfileId)
        {
            throw new NotImplementedException();
        }

        Task<ApiResponse<IEnumerable<Database.Models.Profile>>> IFriendshipService.GetFriendsListAsync(ClaimsPrincipal userClaims)
        {
            throw new NotImplementedException();
        }

        Task<ApiResponse<IEnumerable<Database.Models.Profile>>> IFriendshipService.GetPendingFriendRequestsAsync(ClaimsPrincipal userClaims)
        {
            throw new NotImplementedException();
        }
    }
}
