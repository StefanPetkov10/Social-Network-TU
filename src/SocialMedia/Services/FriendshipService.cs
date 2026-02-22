using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Friendship;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class FriendshipService : BaseService, IFriendshipService
    {
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IRepository<Follow, Guid> _followRepository;
        private readonly IMapper _mapper;

        public FriendshipService(
            IRepository<Friendship, Guid> friendshipRepository,
            IRepository<Database.Models.Profile, Guid> profileRepository,
            IRepository<Follow, Guid> followRepository,
            IMapper mapper,
            UserManager<ApplicationUser> userManager)
            : base(userManager)
        {
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
            _followRepository = followRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse<bool>> SendFriendRequestAsync(ClaimsPrincipal userClaims, Guid targetProfileId)
        {
            try
            {
                var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var userId);
                if (invalidUserResponse != null) return invalidUserResponse;

                var requester = await _profileRepository.GetByApplicationIdAsync(userId);
                if (requester == null) return NotFoundResponse<bool>("Your profile");

                var requesterId = requester.Id;

                if (requesterId == targetProfileId)
                    return ApiResponse<bool>.ErrorResponse("You cannot send a friend request to yourself.");

                var existing = await _friendshipRepository.FirstOrDefaultAsync(f =>
                    (f.RequesterId == requesterId && f.AddresseeId == targetProfileId) ||
                    (f.RequesterId == targetProfileId && f.AddresseeId == requesterId));

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
                    RequesterId = requesterId,
                    AddresseeId = targetProfileId,
                    Status = FriendshipStatus.Pending,
                    RequestedAt = DateTime.UtcNow
                };
                await _friendshipRepository.AddAsync(friendship);

                var alreadyFollowing = await _followRepository
                    .AnyAsync(f => f.FollowerId == requesterId && f.FollowingId == targetProfileId);

                if (!alreadyFollowing)
                {
                    var autoFollow = new Follow
                    {
                        Id = Guid.NewGuid(),
                        FollowerId = requesterId,
                        FollowingId = targetProfileId
                    };
                    await _followRepository.AddAsync(autoFollow);
                }

                await _friendshipRepository.SaveChangesAsync();

                return ApiResponse<bool>.SuccessResponse(true, "Friend request sent and user followed.");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse("An error occurred.", new[] { ex.Message });
            }
        }

        public async Task<ApiResponse<bool>> CancelFriendRequestAsync(ClaimsPrincipal userClaims, Guid targetProfileId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var requester = await _profileRepository.GetByApplicationIdAsync(userId);
            if (requester == null) return NotFoundResponse<bool>("Your profile");

            if (requester.Id == targetProfileId)
                return ApiResponse<bool>.ErrorResponse("You cannot cancel a friend request to yourself.");

            var existingRequest = await _friendshipRepository.FirstOrDefaultAsync(f =>
                f.RequesterId == requester.Id &&
                f.AddresseeId == targetProfileId &&
                f.Status == FriendshipStatus.Pending);
            if (existingRequest == null)
                return ApiResponse<bool>.ErrorResponse("No pending friend request found to cancel.");

            var existingFollow = await _followRepository.FirstOrDefaultAsync(f =>
                f.FollowerId == requester.Id &&
                f.FollowingId == targetProfileId);
            if (existingFollow != null)
            {
                await _followRepository.DeleteAsync(existingFollow);
            }

            await _friendshipRepository.DeleteAsync(existingRequest);
            await _friendshipRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Friend request canceled.");
        }

        public async Task<ApiResponse<bool>> AcceptFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null) return ApiResponse<bool>.ErrorResponse("Profile not found.");

            var request = await _friendshipRepository.GetByIdAsync(requestId);
            if (request == null) return ApiResponse<bool>.ErrorResponse("Friend request not found.");

            if (request.AddresseeId != userProfile.Id)
                return ApiResponse<bool>.ErrorResponse("You are not authorized to accept this friend request.");

            if (request.Status != FriendshipStatus.Pending)
                return ApiResponse<bool>.ErrorResponse("This request cannot be accepted.");

            request.Status = FriendshipStatus.Accepted;
            request.AcceptedAt = DateTime.UtcNow;
            await _friendshipRepository.UpdateAsync(request);

            var requesterId = request.RequesterId;
            var meId = userProfile.Id;

            var doIFollowBack = await _followRepository
                .AnyAsync(f => f.FollowerId == meId && f.FollowingId == requesterId);

            if (!doIFollowBack)
            {
                var followBack = new Follow
                {
                    Id = Guid.NewGuid(),
                    FollowerId = meId,
                    FollowingId = requesterId
                };
                await _followRepository.AddAsync(followBack);
            }

            await _friendshipRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "You are now friends and following each other.");
        }

        public async Task<ApiResponse<bool>> DeclineFriendRequestAsync(ClaimsPrincipal userClaims, Guid requestId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null) return ApiResponse<bool>.ErrorResponse("Profile not found.");

            var request = await _friendshipRepository.GetByIdAsync(requestId);
            if (request == null) return ApiResponse<bool>.ErrorResponse("Friend request not found.");

            if (request.AddresseeId != userProfile.Id)
                return ApiResponse<bool>.ErrorResponse("Not authorized.");

            await _friendshipRepository.DeleteAsync(request);
            await _friendshipRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Friend request declined.");
        }

        public async Task<ApiResponse<bool>> RemoveFriendAsync(ClaimsPrincipal userClaims, Guid friendProfileId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (myProfile == null) return ApiResponse<bool>.ErrorResponse("Profile not found.");

            if (myProfile.Id == friendProfileId)
                return ApiResponse<bool>.ErrorResponse("Cannot remove yourself.");

            var friendship = await _friendshipRepository.FirstOrDefaultAsync(f =>
                            (f.RequesterId == myProfile.Id && f.AddresseeId == friendProfileId) ||
                            (f.RequesterId == friendProfileId && f.AddresseeId == myProfile.Id));

            if (friendship == null)
                return ApiResponse<bool>.ErrorResponse("Friendship not found.");

            await _friendshipRepository.DeleteAsync(friendship);

            var myFollow = await _followRepository.FirstOrDefaultAsync(f =>
                f.FollowerId == myProfile.Id && f.FollowingId == friendProfileId);
            if (myFollow != null) await _followRepository.DeleteAsync(myFollow);

            //this can be removed for the logic of "unfriend but still follow me"
            var theirFollow = await _followRepository.FirstOrDefaultAsync(f =>
                f.FollowerId == friendProfileId && f.FollowingId == myProfile.Id);
            if (theirFollow != null) await _followRepository.DeleteAsync(theirFollow);

            await _friendshipRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Friend removed and mutual following stopped.");
        }

        // Фаза 4 (Бъдеще): Когато интегрирам pgVector и OpenAI/Embeddings, ще заменя (или допълня)
        // тази стъпка. Вместо да връщам "случайни непознати", ще връщам "непознати със сходни интереси".
        public async Task<ApiResponse<IEnumerable<FriendSuggestionDto>>> GetFriendSuggestionsAsync(ClaimsPrincipal userClaims, int skip = 0, int take = 20)
        {
            if (skip >= 100) return ApiResponse<IEnumerable<FriendSuggestionDto>>.SuccessResponse(new List<FriendSuggestionDto>(), "Limit reached.");
            if (skip + take > 100) take = 100 - skip;

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
                    .Select(g => new FriendSuggestionDto
                    {
                        ProfileId = g.Key,
                        MutualFriendsCount = g.Count(),
                        FriendshipStatus = -1,
                        IsFriendRequestSender = false
                    })
                    .OrderByDescending(x => x.MutualFriendsCount)
                    .Take(100)
                    .ToList();
            }

            if (allPotentialPool.Count < 100)
            {
                int needed = 100 - allPotentialPool.Count;
                var currentIds = allPotentialPool.Select(s => s.ProfileId).ToList();
                var fullExclude = new HashSet<Guid>(excludeIds.Concat(currentIds));

                var randomStrangers = await _profileRepository.QueryNoTracking()
                    .Where(p => !fullExclude.Contains(p.Id))
                    .OrderBy(p => p.Id)
                    .Take(needed)
                    .Select(p => new FriendSuggestionDto
                    {
                        ProfileId = p.Id,
                        DisplayFullName = p.FullName,
                        AuthorAvatar = p.Photo,
                        MutualFriendsCount = 0,
                        FriendshipStatus = -1,
                        IsFriendRequestSender = false
                    })
                    .ToListAsync();

                allPotentialPool.AddRange(randomStrangers);
            }

            var missingIds = allPotentialPool.Where(s => string.IsNullOrEmpty(s.DisplayFullName)).Select(s => s.ProfileId).ToList();
            if (missingIds.Any())
            {
                var profiles = await _profileRepository.QueryNoTracking()
                    .Where(p => missingIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id);

                foreach (var s in allPotentialPool.Where(s => missingIds.Contains(s.ProfileId)))
                {
                    if (profiles.TryGetValue(s.ProfileId, out var p))
                    {
                        s.DisplayFullName = p.FullName;
                        s.AuthorAvatar = p.Photo;
                        s.FriendshipStatus = -1;
                        s.IsFriendRequestSender = false;
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

        public async Task<ApiResponse<IEnumerable<PendingFriendDto>>> GetPendingFriendRequestsAsync(
            ClaimsPrincipal userClaims,
            DateTime? lastRequestDate = null,
            int take = 20)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PendingFriendDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var userProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (userProfile == null) return ApiResponse<IEnumerable<PendingFriendDto>>.ErrorResponse("Profile not found.");

            var query = _friendshipRepository.QueryNoTracking()
                .Where(f => f.AddresseeId == userProfile.Id && f.Status == FriendshipStatus.Pending);

            if (lastRequestDate.HasValue)
            {
                query = query.Where(f => f.RequestedAt < lastRequestDate.Value);
            }

            var pendingRequests = await query
                .OrderByDescending(f => f.RequestedAt)
                .Take(take)
                .Include(f => f.Requester).ThenInclude(r => r.User)
                .ToListAsync();

            var friendDtos = _mapper.Map<IEnumerable<PendingFriendDto>>(pendingRequests);
            var nextCursor = pendingRequests.LastOrDefault()?.RequestedAt;

            return ApiResponse<IEnumerable<PendingFriendDto>>.SuccessResponse(
                friendDtos, "Pending requests retrieved.", new { nextCursor });
        }

        public async Task<ApiResponse<IEnumerable<FriendDto>>> GetFriendsListAsync(
            ClaimsPrincipal userClaims,
            Guid profileId,
            Guid? lastFriendId = null,
            DateTime? lastFriendshipDate = null,
            int take = 20)
        {
            var viewerProfileId = await GetViewerProfileIdAsync(userClaims);

            var listOwnerProfile = await _profileRepository.GetByIdAsync(profileId);
            if (listOwnerProfile == null) return ApiResponse<IEnumerable<FriendDto>>.ErrorResponse("Profile not found.");

            var totalCount = await _friendshipRepository.QueryNoTracking()
                .CountAsync(f => (f.RequesterId == listOwnerProfile.Id || f.AddresseeId == listOwnerProfile.Id)
                                 && f.Status == FriendshipStatus.Accepted);

            var query = _friendshipRepository.QueryNoTracking()
                .Where(f => (f.RequesterId == listOwnerProfile.Id || f.AddresseeId == listOwnerProfile.Id)
                            && f.Status == FriendshipStatus.Accepted);

            if (lastFriendshipDate.HasValue && lastFriendId.HasValue)
            {
                query = query.Where(f => f.AcceptedAt < lastFriendshipDate.Value ||
                                         (f.AcceptedAt == lastFriendshipDate.Value && f.Id.CompareTo(lastFriendId.Value) < 0));
            }
            else if (lastFriendshipDate.HasValue)
            {
                query = query.Where(f => f.AcceptedAt < lastFriendshipDate.Value);
            }

            query = query
                .OrderByDescending(f => f.AcceptedAt)
                .ThenByDescending(f => f.Id);

            var friendships = await query
                .Take(take)
                .Include(f => f.Requester).ThenInclude(p => p.User)
                .Include(f => f.Addressee).ThenInclude(p => p.User)
                .ToListAsync();

            var friendProfiles = friendships
                .Select(f => f.RequesterId == listOwnerProfile.Id ? f.Addressee : f.Requester)
                .ToList();

            var friendDtos = await MapProfilesToFriendDtosAsync(friendProfiles, viewerProfileId);

            var lastItem = friendships.LastOrDefault();

            return ApiResponse<IEnumerable<FriendDto>>.SuccessResponse(
                friendDtos,
                "Friends list retrieved.",
                new
                {
                    lastFriendshipDate = lastItem?.AcceptedAt,
                    lastFriendId = lastItem?.Id,
                    totalCount = totalCount
                });
        }

        public async Task<ApiResponse<IEnumerable<FriendDto>>> SearchFriendsAsync(
            ClaimsPrincipal userClaims,
            Guid profileId,
            string query,
            int take = 20)
        {
            var viewerProfileId = await GetViewerProfileIdAsync(userClaims);

            var listOwnerProfile = await _profileRepository.GetByIdAsync(profileId);
            if (listOwnerProfile == null) return ApiResponse<IEnumerable<FriendDto>>.ErrorResponse("Profile not found.");

            if (string.IsNullOrWhiteSpace(query))
            {
                return ApiResponse<IEnumerable<FriendDto>>.SuccessResponse(new List<FriendDto>(), "Empty query.");
            }

            var cleanQuery = query.Trim().ToLower();

            var dbQuery = _friendshipRepository.QueryNoTracking()
                .Where(f => (f.RequesterId == listOwnerProfile.Id || f.AddresseeId == listOwnerProfile.Id)
                             && f.Status == FriendshipStatus.Accepted);

            dbQuery = dbQuery.Where(f =>
                    (f.RequesterId == listOwnerProfile.Id && (
                        EF.Functions.ILike(f.Addressee.FirstName + " " + f.Addressee.LastName, $"%{cleanQuery}%") ||
                        EF.Functions.ILike(f.Addressee.User.UserName, $"%{cleanQuery}%") ||
                        EF.Functions.TrigramsWordSimilarity(f.Addressee.FirstName + " " + f.Addressee.LastName, cleanQuery) > 0.3 ||
                        EF.Functions.TrigramsWordSimilarity(f.Addressee.User.UserName, cleanQuery) > 0.3
                    )) ||
                    (f.AddresseeId == listOwnerProfile.Id && (
                        EF.Functions.ILike(f.Requester.FirstName + " " + f.Requester.LastName, $"%{cleanQuery}%") ||
                        EF.Functions.ILike(f.Requester.User.UserName, $"%{cleanQuery}%") ||
                        EF.Functions.TrigramsWordSimilarity(f.Requester.FirstName + " " + f.Requester.LastName, cleanQuery) > 0.3 ||
                        EF.Functions.TrigramsWordSimilarity(f.Requester.User.UserName, cleanQuery) > 0.3
                    ))
                );

            dbQuery = dbQuery.OrderByDescending(f => f.RequesterId == listOwnerProfile.Id
                    ? Math.Max(EF.Functions.TrigramsWordSimilarity(f.Addressee.FirstName + " " + f.Addressee.LastName, cleanQuery),
                               EF.Functions.TrigramsWordSimilarity(f.Addressee.User.UserName, cleanQuery))
                    : Math.Max(EF.Functions.TrigramsWordSimilarity(f.Requester.FirstName + " " + f.Requester.LastName, cleanQuery),
                               EF.Functions.TrigramsWordSimilarity(f.Requester.User.UserName, cleanQuery))
                ).ThenByDescending(f => f.AcceptedAt).ThenByDescending(f => f.Id);

            var friendships = await dbQuery
                .Take(take)
                .Include(f => f.Requester).ThenInclude(p => p.User)
                .Include(f => f.Addressee).ThenInclude(p => p.User)
                .ToListAsync();

            var friendProfiles = friendships
                .Select(f => f.RequesterId == listOwnerProfile.Id ? f.Addressee : f.Requester)
                .ToList();

            var friendDtos = await MapProfilesToFriendDtosAsync(friendProfiles, viewerProfileId);

            return ApiResponse<IEnumerable<FriendDto>>.SuccessResponse(
                friendDtos,
                "Friends search completed.",
                new
                {
                    totalCount = friendDtos.Count
                });
        }


        private async Task<Guid?> GetViewerProfileIdAsync(ClaimsPrincipal userClaims)
        {
            var viewerIdResponse = GetUserIdOrUnauthorized<object>(userClaims, out var userId);
            if (viewerIdResponse != null) return null;

            var viewer = await _profileRepository.GetByApplicationIdAsync(userId);
            return viewer?.Id;
        }

        private async Task<List<FriendDto>> MapProfilesToFriendDtosAsync(
            List<Database.Models.Profile> friendProfiles,
            Guid? viewerProfileId)
        {
            var friendProfileIds = friendProfiles.Select(p => p.Id).ToList();

            List<Friendship> viewerRelationships = new List<Friendship>();
            HashSet<Guid> viewerFriendIds = new HashSet<Guid>();

            if (viewerProfileId.HasValue && friendProfileIds.Any())
            {
                viewerRelationships = await _friendshipRepository.QueryNoTracking()
                    .Where(f => (f.RequesterId == viewerProfileId.Value && friendProfileIds.Contains(f.AddresseeId)) ||
                                (f.AddresseeId == viewerProfileId.Value && friendProfileIds.Contains(f.RequesterId)))
                    .ToListAsync();

                var viewerFriendsList = await _friendshipRepository.QueryNoTracking()
                    .Where(f => (f.RequesterId == viewerProfileId.Value || f.AddresseeId == viewerProfileId.Value)
                                && f.Status == FriendshipStatus.Accepted)
                    .Select(f => f.RequesterId == viewerProfileId.Value ? f.AddresseeId : f.RequesterId)
                    .ToListAsync();

                viewerFriendIds = new HashSet<Guid>(viewerFriendsList);
            }

            var friendDtos = new List<FriendDto>();

            foreach (var p in friendProfiles)
            {
                bool isMe = viewerProfileId.HasValue && p.Id == viewerProfileId.Value;
                var rel = viewerRelationships.FirstOrDefault(r => r.RequesterId == p.Id || r.AddresseeId == p.Id);

                bool isFriend = rel?.Status == FriendshipStatus.Accepted;
                bool hasSent = rel?.Status == FriendshipStatus.Pending && rel.RequesterId == viewerProfileId;
                bool hasReceived = rel?.Status == FriendshipStatus.Pending && rel.AddresseeId == viewerProfileId;

                int mutualCount = 0;
                if (viewerProfileId.HasValue && !isMe)
                {
                    mutualCount = await _friendshipRepository.QueryNoTracking()
                        .CountAsync(f => f.Status == FriendshipStatus.Accepted &&
                                    (f.RequesterId == p.Id || f.AddresseeId == p.Id) &&
                                    (f.RequesterId == p.Id ? viewerFriendIds.Contains(f.AddresseeId) : viewerFriendIds.Contains(f.RequesterId)));
                }

                friendDtos.Add(new FriendDto
                {
                    ProfileId = p.Id,
                    DisplayFullName = p.FullName ?? "Unknown",
                    Username = p.User.UserName!,
                    AuthorAvatar = p.Photo,
                    IsMe = isMe,
                    IsFriend = isFriend,
                    HasSentRequest = hasSent,
                    HasReceivedRequest = hasReceived,
                    PendingRequestId = (hasSent || hasReceived) ? rel?.Id : null,
                    MutualFriendsCount = isMe ? 0 : mutualCount
                });
            }

            return friendDtos;
        }
    }
}