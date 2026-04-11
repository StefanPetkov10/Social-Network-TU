using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Follow;
using SocialMedia.Extensions;
using SocialMedia.Services.Interfaces;
using SocialMedia.Services.Caching;

namespace SocialMedia.Services
{
    public class FollowCacheModel
    {
        public List<FollowDto> Dtos { get; set; } = new();
        public DateTime? NextCursor { get; set; }
    }

    public class FollowService : BaseService, IFollowService
    {
        private readonly IRepository<Follow, Guid> _followRepository;
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IMapper _mapper;
        private readonly ICacheService _cacheService;
        private readonly INotificationService _notificationService;

        private readonly TimeSpan _cacheTtl = TimeSpan.FromHours(24);

        public FollowService(UserManager<ApplicationUser> userManager,
            IRepository<Follow, Guid> followRepository,
            IRepository<Friendship, Guid> friendshipRepository,
            IRepository<Database.Models.Profile, Guid> profileRepository,
            IMapper mapper, INotificationService notificationService,
            ICacheService cacheService) : base(userManager)
        {
            _followRepository = followRepository;
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
            _mapper = mapper;
            _notificationService = notificationService;
            _cacheService = cacheService;
        }

        public async Task<ApiResponse<bool>> FollowAsync(ClaimsPrincipal userClaims, Guid followingId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var follower = await _profileRepository.GetByApplicationIdAsync(appUserId);
            if (follower == null) return NotFoundResponse<bool>("Your profile");

            if (follower.Id == followingId) return ApiResponse<bool>.ErrorResponse("You cannot follow yourself.");

            var existing = await _followRepository
                .FirstOrDefaultAsync(f => f.FollowerId == follower.Id && f.FollowingId == followingId);

            if (existing != null) return ApiResponse<bool>.SuccessResponse(true, "Already following.");

            var follow = new Follow
            {
                Id = Guid.NewGuid(),
                FollowerId = follower.Id,
                FollowingId = followingId,
                CreatedAt = DateTime.UtcNow
            };

            await _followRepository.AddAsync(follow);
            await _followRepository.SaveChangesAsync();

            await _cacheService.RemoveAsync($"profile:id:{follower.Id}");
            await _cacheService.RemoveAsync($"profile:id:{followingId}");
            await _cacheService.RemoveByPrefixAsync($"following:{follower.Id}");
            await _cacheService.RemoveByPrefixAsync($"followers:{followingId}");

            await _notificationService.TriggerNotificationAsync(
                followingId, follower.Id, NotificationType.NewFollower, null);

            return ApiResponse<bool>.SuccessResponse(true, "Followed successfully.");
        }

        public async Task<ApiResponse<bool>> UnfollowAsync(ClaimsPrincipal userClaims, Guid followingId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var follower = await _profileRepository.GetByApplicationIdAsync(appUserId);
            if (follower == null) return NotFoundResponse<bool>("Your profile");

            var follow = await _followRepository
                .FirstOrDefaultAsync(f => f.FollowerId == follower.Id && f.FollowingId == followingId);

            if (follow == null) return ApiResponse<bool>.ErrorResponse("Not following this profile.");

            await _followRepository.DeleteAsync(follow);
            await _followRepository.SaveChangesAsync();

            await _cacheService.RemoveAsync($"profile:id:{follower.Id}");
            await _cacheService.RemoveAsync($"profile:id:{followingId}");
            await _cacheService.RemoveByPrefixAsync($"following:{follower.Id}");
            await _cacheService.RemoveByPrefixAsync($"followers:{followingId}");

            await _notificationService.RevertNotificationAsync(
                followingId, follower.Id, NotificationType.NewFollower, null);

            return ApiResponse<bool>.SuccessResponse(true, "Unfollowed successfully.");
        }

        public async Task<ApiResponse<bool>> RemoveFollowerAsync(ClaimsPrincipal userClaims, Guid followerId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepository.GetByApplicationIdAsync(appUserId);
            if (myProfile == null) return NotFoundResponse<bool>("Your profile");

            var follow = await _followRepository
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == myProfile.Id);

            if (follow == null) return ApiResponse<bool>.ErrorResponse("This user is not following you.");

            await _followRepository.DeleteAsync(follow);
            await _followRepository.SaveChangesAsync();

            await _cacheService.RemoveAsync($"profile:id:{followerId}");
            await _cacheService.RemoveAsync($"profile:id:{myProfile.Id}");
            await _cacheService.RemoveByPrefixAsync($"following:{followerId}");
            await _cacheService.RemoveByPrefixAsync($"followers:{myProfile.Id}");

            await _notificationService.RevertNotificationAsync(
                myProfile.Id, followerId, NotificationType.NewFollower, null);

            return ApiResponse<bool>.SuccessResponse(true, "Follower removed.");
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowersAsync(
            ClaimsPrincipal userClaims,
            Guid targetProfileId,
            DateTime? lastFollowerDate = null,
            int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var viewerProfileId = await GetViewerProfileIdAsync(userClaims);

            var targetProfile = await _profileRepository.GetByIdAsync(targetProfileId);
            if (targetProfile == null) return NotFoundResponse<IEnumerable<FollowDto>>("Target profile");

            string cacheKey = $"followers:{targetProfileId}:{take}";
            FollowCacheModel cacheData = null;

            if (lastFollowerDate == null)
            {
                cacheData = await _cacheService.GetAsync<FollowCacheModel>(cacheKey);
            }

            if (cacheData == null)
            {
                var query = _followRepository.QueryNoTracking()
                   .Where(f => f.FollowingId == targetProfile.Id);

                if (lastFollowerDate.HasValue)
                {
                    query = query.Where(f => f.CreatedAt < lastFollowerDate.Value);
                }

                var followers = await query
                    .OrderByDescending(f => f.CreatedAt)
                    .Take(take)
                    .Include(f => f.Follower)
                        .ThenInclude(p => p.User)
                    .ToListAsync();

                var profiles = followers.Select(f => f.Follower).ToList();
                var rawDtos = _mapper.Map<List<FollowDto>>(profiles); 

                cacheData = new FollowCacheModel
                {
                    Dtos = rawDtos,
                    NextCursor = followers.LastOrDefault()?.CreatedAt
                };

                if (lastFollowerDate == null && rawDtos.Any())
                {
                    await _cacheService.SetAsync(cacheKey, cacheData, _cacheTtl);
                }
            }

            if (!cacheData.Dtos.Any())
                return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(new List<FollowDto>(), "No followers found.");

            var finalDtos = await PopulateViewerRelationshipsAsync(cacheData.Dtos, viewerProfileId);

            return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(finalDtos, "Followers retrieved.", new { nextCursor = cacheData.NextCursor });
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowingAsync(
            ClaimsPrincipal userClaims,
            Guid targetProfileId,
            DateTime? lastFollowingDate = null,
            int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var viewerProfileId = await GetViewerProfileIdAsync(userClaims);
            var targetProfile = await _profileRepository.GetByIdAsync(targetProfileId);
            if (targetProfile == null) return NotFoundResponse<IEnumerable<FollowDto>>("Target profile");

            string cacheKey = $"following:{targetProfileId}:{take}";
            FollowCacheModel cacheData = null;

            if (lastFollowingDate == null)
            {
                cacheData = await _cacheService.GetAsync<FollowCacheModel>(cacheKey);
            }

            if (cacheData == null)
            {
                var query = _followRepository.QueryNoTracking()
                    .Where(f => f.FollowerId == targetProfile.Id);

                if (lastFollowingDate.HasValue)
                {
                    query = query.Where(f => f.CreatedAt < lastFollowingDate.Value);
                }

                var following = await query
                    .OrderByDescending(f => f.CreatedAt)
                    .Take(take)
                    .Include(f => f.Following)
                        .ThenInclude(p => p.User)
                    .ToListAsync();

                var profiles = following.Select(f => f.Following).ToList();
                var rawDtos = _mapper.Map<List<FollowDto>>(profiles);

                cacheData = new FollowCacheModel
                {
                    Dtos = rawDtos,
                    NextCursor = following.LastOrDefault()?.CreatedAt
                };

                if (lastFollowingDate == null && rawDtos.Any())
                {
                    await _cacheService.SetAsync(cacheKey, cacheData, _cacheTtl);
                }
            }

            if (!cacheData.Dtos.Any())
                return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(new List<FollowDto>(), "No following found.");

            var finalDtos = await PopulateViewerRelationshipsAsync(cacheData.Dtos, viewerProfileId);

            return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(finalDtos, "Following retrieved.", new { nextCursor = cacheData.NextCursor });
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowingAsync(ClaimsPrincipal userClaims, DateTime? lastFollowingDate = null, int take = 20)
        {
            var viewerProfileId = await GetViewerProfileIdAsync(userClaims);
            if (!viewerProfileId.HasValue) return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Profile not found.");

            return await GetFollowingAsync(userClaims, viewerProfileId.Value, lastFollowingDate, take);
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> SearchFollowersAsync(ClaimsPrincipal userClaims, Guid targetProfileId, string query, int take = 20)
        {
            var viewerProfileId = await GetViewerProfileIdAsync(userClaims);

            var targetProfile = await _profileRepository.GetByIdAsync(targetProfileId);
            if (targetProfile == null) return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Profile not found.");

            if (string.IsNullOrWhiteSpace(query))
                return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(new List<FollowDto>(), "Empty query.");

            var cleanQuery = EscapeLikePattern.EscapeLikePatternMethod(query.Trim().ToLower());

            var dbQuery = _followRepository.QueryNoTracking()
                .Where(f => f.FollowingId == targetProfile.Id);

            dbQuery = dbQuery.Where(f =>
                EF.Functions.ILike(f.Follower.FirstName + " " + f.Follower.LastName, $"%{cleanQuery}%") ||
                EF.Functions.ILike(f.Follower.User.UserName, $"%{cleanQuery}%") ||
                EF.Functions.TrigramsWordSimilarity(f.Follower.FirstName + " " + f.Follower.LastName, cleanQuery) > 0.3 ||
                EF.Functions.TrigramsWordSimilarity(f.Follower.User.UserName, cleanQuery) > 0.3
            );

            dbQuery = dbQuery
                .OrderByDescending(f => Math.Max(
                    EF.Functions.TrigramsWordSimilarity(f.Follower.FirstName + " " + f.Follower.LastName, cleanQuery),
                    EF.Functions.TrigramsWordSimilarity(f.Follower.User.UserName, cleanQuery)))
                .ThenByDescending(f => f.CreatedAt);

            var followers = await dbQuery
                .Take(take)
                .Include(f => f.Follower).ThenInclude(p => p.User)
                .ToListAsync();

            var profiles = followers.Select(f => f.Follower).ToList();
            var rawDtos = _mapper.Map<List<FollowDto>>(profiles);

            var finalDtos = await PopulateViewerRelationshipsAsync(rawDtos, viewerProfileId);

            return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(finalDtos, "Search completed.", new { totalCount = finalDtos.Count });
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> SearchFollowingAsync(ClaimsPrincipal userClaims, Guid targetProfileId, string query, int take = 20)
        {
            var viewerProfileId = await GetViewerProfileIdAsync(userClaims);

            var targetProfile = await _profileRepository.GetByIdAsync(targetProfileId);
            if (targetProfile == null) return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Profile not found.");

            if (string.IsNullOrWhiteSpace(query))
                return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(new List<FollowDto>(), "Empty query.");

            var cleanQuery = EscapeLikePattern.EscapeLikePatternMethod(query.Trim().ToLower());

            var dbQuery = _followRepository.QueryNoTracking()
                .Where(f => f.FollowerId == targetProfile.Id);

            dbQuery = dbQuery.Where(f =>
                EF.Functions.ILike(f.Following.FirstName + " " + f.Following.LastName, $"%{cleanQuery}%") ||
                EF.Functions.ILike(f.Following.User.UserName, $"%{cleanQuery}%") ||
                EF.Functions.TrigramsWordSimilarity(f.Following.FirstName + " " + f.Following.LastName, cleanQuery) > 0.3 ||
                EF.Functions.TrigramsWordSimilarity(f.Following.User.UserName, cleanQuery) > 0.3
            );

            dbQuery = dbQuery
                .OrderByDescending(f => Math.Max(
                    EF.Functions.TrigramsWordSimilarity(f.Following.FirstName + " " + f.Following.LastName, cleanQuery),
                    EF.Functions.TrigramsWordSimilarity(f.Following.User.UserName, cleanQuery)))
                .ThenByDescending(f => f.CreatedAt);

            var following = await dbQuery
                .Take(take)
                .Include(f => f.Following).ThenInclude(p => p.User)
                .ToListAsync();

            var profiles = following.Select(f => f.Following).ToList();
            var rawDtos = _mapper.Map<List<FollowDto>>(profiles);

            var finalDtos = await PopulateViewerRelationshipsAsync(rawDtos, viewerProfileId);

            return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(finalDtos, "Search completed.", new { totalCount = finalDtos.Count });
        }

        public async Task<ApiResponse<IEnumerable<FollowSuggestionDto>>> GetFollowSuggestionsAsync(ClaimsPrincipal userClaims, int skip = 0, int take = 10)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<FollowSuggestionDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (myProfile == null) return ApiResponse<IEnumerable<FollowSuggestionDto>>.ErrorResponse("Profile not found.");

            var myFollowingIds = await _followRepository.QueryNoTracking()
                .Where(f => f.FollowerId == myProfile.Id)
                .Select(f => f.FollowingId)
                .ToListAsync();

            var excludeIds = new HashSet<Guid>(myFollowingIds) { myProfile.Id };
            var suggestions = new List<FollowSuggestionDto>();

            if (myFollowingIds.Any())
            {
                var mutualCandidates = await _followRepository.QueryNoTracking()
                    .Where(f => myFollowingIds.Contains(f.FollowerId))
                    .Where(f => !excludeIds.Contains(f.FollowingId))
                    .GroupBy(f => f.FollowingId)
                    .Select(g => new { ProfileId = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                var candidateIds = mutualCandidates.Select(x => x.ProfileId).ToList();

                if (candidateIds.Any())
                {
                    var profiles = await _profileRepository.QueryNoTracking()
                        .Include(p => p.User)
                        .Where(p => candidateIds.Contains(p.Id))
                        .ToListAsync();

                    var friendIds = await _friendshipRepository.QueryNoTracking()
                       .Where(f => f.Status == FriendshipStatus.Accepted &&
                                   (f.RequesterId == myProfile.Id || f.AddresseeId == myProfile.Id) &&
                                   (candidateIds.Contains(f.RequesterId) || candidateIds.Contains(f.AddresseeId)))
                       .Select(f => f.RequesterId == myProfile.Id ? f.AddresseeId : f.RequesterId)
                       .ToListAsync();

                    suggestions = mutualCandidates.Join(profiles,
                        m => m.ProfileId,
                        p => p.Id,
                        (m, p) =>
                        {
                            var dto = _mapper.Map<FollowSuggestionDto>(p);
                            dto.Reason = $"{m.Count} followed by connections";
                            dto.MutualFollowersCount = m.Count;
                            dto.IsFriend = friendIds.Contains(p.Id);

                            return dto;
                        }).ToList();
                }
            }

            if (suggestions.Count < take)
            {
                int needed = take - suggestions.Count;
                var existingSuggestionIds = suggestions.Select(s => s.ProfileId).ToList();
                excludeIds.UnionWith(existingSuggestionIds);

                var trending = await _followRepository.QueryNoTracking()
                    .Where(f => !excludeIds.Contains(f.FollowingId))
                    .GroupBy(f => f.FollowingId)
                    .Select(g => new { ProfileId = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(needed)
                    .ToListAsync();

                var trendingIds = trending.Select(t => t.ProfileId).ToList();
                var trendingProfiles = await _profileRepository.QueryNoTracking()
                     .Where(p => trendingIds.Contains(p.Id))
                     .Include(p => p.User)
                     .ToListAsync();

                var trendingDtos = _mapper.Map<List<FollowSuggestionDto>>(trendingProfiles);

                foreach (var dto in trendingDtos)
                {
                    dto.Reason = "Popular on TU Social";
                }

                suggestions.AddRange(trendingDtos);
            }

            if (suggestions.Count < take)
            {
                int needed = take - suggestions.Count;

                var randomProfiles = await _profileRepository.QueryNoTracking()
                    .Where(p => !excludeIds.Contains(p.Id))
                    .OrderByDescending(p => p.CreatedDate)
                    .Take(needed)
                    .Include(p => p.User)
                    .ToListAsync();

                if (randomProfiles.Any())
                {
                    var randomDtos = _mapper.Map<List<FollowSuggestionDto>>(randomProfiles);
                    randomDtos.ForEach(d => d.Reason = "New on TU Social");

                    suggestions.AddRange(randomDtos);
                }
            }

            return ApiResponse<IEnumerable<FollowSuggestionDto>>.SuccessResponse(
                suggestions,
                "Suggestions retrieved.",
                new { nextSkip = skip + suggestions.Count }
            );
        }

        private async Task<Guid?> GetViewerProfileIdAsync(ClaimsPrincipal userClaims)
        {
            var viewerIdResponse = GetUserIdOrUnauthorized<object>(userClaims, out var userId);
            if (viewerIdResponse != null) return null;

            var viewer = await _profileRepository.GetByApplicationIdAsync(userId);
            return viewer?.Id;
        }

        private async Task<List<FollowDto>> PopulateViewerRelationshipsAsync(List<FollowDto> dtos, Guid? viewerProfileId)
        {
            if (!viewerProfileId.HasValue || !dtos.Any())
                return dtos;

            var profileIdsInList = dtos.Select(d => d.ProfileId).ToList();

            var iFollowThemIds = await _followRepository.QueryNoTracking()
                .Where(f => f.FollowerId == viewerProfileId.Value && profileIdsInList.Contains(f.FollowingId))
                .Select(f => f.FollowingId)
                .ToListAsync();

            var theyFollowMeIds = await _followRepository.QueryNoTracking()
                .Where(f => f.FollowingId == viewerProfileId.Value && profileIdsInList.Contains(f.FollowerId))
                .Select(f => f.FollowerId)
                .ToListAsync();

            var friendIds = await _friendshipRepository.QueryNoTracking()
                .Where(f => f.Status == FriendshipStatus.Accepted &&
                            (f.RequesterId == viewerProfileId.Value || f.AddresseeId == viewerProfileId.Value) &&
                            (profileIdsInList.Contains(f.RequesterId) || profileIdsInList.Contains(f.AddresseeId)))
                .Select(f => f.RequesterId == viewerProfileId.Value ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            foreach (var dto in dtos)
            {
                dto.IsFollowing = iFollowThemIds.Contains(dto.ProfileId);
                dto.IsFollower = theyFollowMeIds.Contains(dto.ProfileId);
                dto.IsFriend = friendIds.Contains(dto.ProfileId);
            }

            return dtos;
        }
    }
}