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

        public async Task<ApiResponse<IEnumerable<FriendSuggestionDto>>> GetFriendSuggestionsAsync(
            ClaimsPrincipal userClaims,
            int skip = 0,
            int take = 20)
        {
            if (skip >= 100)
                return ApiResponse<IEnumerable<FriendSuggestionDto>>.SuccessResponse(new List<FriendSuggestionDto>(), "Limit reached.");

            if (skip + take > 100)
                take = 100 - skip;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<FriendSuggestionDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null) return ApiResponse<IEnumerable<FriendSuggestionDto>>.ErrorResponse("Profile not found.");

            var currentUserId = userProfile.Id;

            var existingConnections = await _friendshipRepository.QueryNoTracking()
                .Where(f => f.RequesterId == currentUserId || f.AddresseeId == currentUserId)
                .Select(f => f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            var excludeIds = new HashSet<Guid>(existingConnections) { currentUserId };

            var myFriendsIds = await _friendshipRepository.QueryNoTracking()
                .Where(f => (f.RequesterId == currentUserId || f.AddresseeId == currentUserId) && f.Status == FriendshipStatus.Accepted)
                .Select(f => f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            List<FriendSuggestionDto> allPotentialPool = new List<FriendSuggestionDto>();

            if (myFriendsIds.Any())
            {
                var rawSuggestions = await _friendshipRepository.QueryNoTracking()
                    .Where(f => f.Status == FriendshipStatus.Accepted &&
                               (myFriendsIds.Contains(f.RequesterId) || myFriendsIds.Contains(f.AddresseeId)))
                    .Select(f => new { CandidateId = myFriendsIds.Contains(f.RequesterId) ? f.AddresseeId : f.RequesterId })
                    .Where(x => !excludeIds.Contains(x.CandidateId))
                    .ToListAsync();

                allPotentialPool = rawSuggestions
                    .GroupBy(x => x.CandidateId)
                    .Select(g => new FriendSuggestionDto { ProfileId = g.Key, MutualFriendsCount = g.Count() })
                    .OrderByDescending(x => x.MutualFriendsCount)
                    .Take(100)
                    .ToList();
            }

            if (allPotentialPool.Count < 100)
            {
                int needed = 100 - allPotentialPool.Count;
                var currentIds = allPotentialPool.Select(s => s.ProfileId).ToList();
                var fullExclude = new HashSet<Guid>(excludeIds.Concat(currentIds));

                // Фаза 4 (Бъдеще): Когато интегрирам pgVector и OpenAI/Embeddings, ще заменя (или допълня)
                // тази стъпка. Вместо да връщам "случайни непознати", ще връщам "непознати със сходни интереси".
                var randomStrangers = await _profileRepository.QueryNoTracking()
                    .Where(p => !fullExclude.Contains(p.Id))
                    .OrderBy(p => p.Id)
                    .Take(needed)
                    .Select(p => new FriendSuggestionDto
                    {
                        ProfileId = p.Id,
                        FirstName = p.FirstName,
                        LastName = p.LastName,
                        AuthorAvatar = p.Photo,
                        MutualFriendsCount = 0
                    })
                    .ToListAsync();

                allPotentialPool.AddRange(randomStrangers);
            }

            var missingIds = allPotentialPool.Where(s => string.IsNullOrEmpty(s.FirstName)).Select(s => s.ProfileId).ToList();
            if (missingIds.Any())
            {
                var profiles = await _profileRepository.QueryNoTracking()
                    .Where(p => missingIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id);

                foreach (var s in allPotentialPool.Where(s => missingIds.Contains(s.ProfileId)))
                {
                    if (profiles.TryGetValue(s.ProfileId, out var p))
                    {
                        s.FirstName = p.FirstName;
                        s.LastName = p.LastName;
                        s.AuthorAvatar = p.Photo;
                    }
                }
            }

            var result = allPotentialPool.Skip(skip).Take(take).ToList();

            return ApiResponse<IEnumerable<FriendSuggestionDto>>.SuccessResponse(
                result,
                "Suggestions retrieved successfully.",
                new { nextSkip = skip + result.Count, totalLoaded = skip + result.Count }
            );
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

            var pendingRequests = await _friendshipRepository.QueryNoTracking()
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
                .QueryNoTracking()
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

        public async Task<ApiResponse<bool>> DeclineFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId)
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
                return ApiResponse<bool>.ErrorResponse("You are not authorized to decline this friend request.");

            if (request.Status != FriendshipStatus.Pending || request.Status == FriendshipStatus.Accepted)
                return ApiResponse<bool>.ErrorResponse("This friend request cannot be declined.", new[] { "This status is not suitable for declined" });

            await _friendshipRepository.DeleteAsync(request);
            await _friendshipRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Friend request declined successfully.");
        }

        public async Task<ApiResponse<bool>> RemoveFriendAsync(ClaimsPrincipal userClaims, Guid friendProfileId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<PostDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return ApiResponse<bool>.ErrorResponse("Unauthorized.", new[] { "Invalid user claim." });

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null)
                return ApiResponse<bool>.ErrorResponse("Profile not found.", new[] { "User profile does not exist." });

            if (userProfile.Id == friendProfileId)
                return ApiResponse<bool>.ErrorResponse("You cannot remove yourself from friends.");

            var friendship = await _friendshipRepository.FirstOrDefaultAsync(f =>
                                (f.RequesterId == userProfile.Id && f.AddresseeId == friendProfileId ||
                                       f.RequesterId == friendProfileId && f.AddresseeId == userProfile.Id)
                                           && f.Status == FriendshipStatus.Accepted);

            if (friendship == null)
                return ApiResponse<bool>.ErrorResponse("Friendship not found.", new[] { "You are not friends with this user." });

            await _friendshipRepository.DeleteAsync(friendship);
            await _friendshipRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Friend removed successfully.");
        }


    }
}
