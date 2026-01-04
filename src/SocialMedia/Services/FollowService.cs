using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Follow;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class FollowService : BaseService, IFollowService
    {
        private readonly IRepository<Follow, Guid> _followRepository;
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IMapper _mapper;

        public FollowService(UserManager<ApplicationUser> userManager,
            IRepository<Follow, Guid> followRepository, IRepository<Friendship, Guid> friendshipRepository,
            IRepository<Database.Models.Profile, Guid> profileRepository,
            IMapper mapper) : base(userManager)
        {
            _followRepository = followRepository;
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
            _mapper = mapper;
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

            return ApiResponse<bool>.SuccessResponse(true, "Unfollowed successfully.");
        }

        public async Task<ApiResponse<bool>> IsFollowingAsync(ClaimsPrincipal userClaims, Guid followingId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null) return invalidUserResponse;
            var follower = await _profileRepository.GetByApplicationIdAsync(appUserId);
            if (follower == null) return NotFoundResponse<bool>("Your profile");

            var exists = await _followRepository
               .AnyAsync(f => f.FollowerId == follower.Id && f.FollowingId == followingId);

            return ApiResponse<bool>.SuccessResponse(exists);
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowersAsync(ClaimsPrincipal userClaims, DateTime? lastFollowerDate = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<FollowDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (myProfile == null) return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Profile not found.");

            var query = _followRepository.QueryNoTracking()
               .Where(f => f.FollowingId == myProfile.Id);

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

            if (!followers.Any())
                return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(new List<FollowDto>(), "No followers found.");

            var profiles = followers.Select(f => f.Follower);

            var dtos = _mapper.Map<List<FollowDto>>(profiles);

            var followerProfileIds = dtos.Select(d => d.ProfileId).ToList();

            var iFollowThemIds = await _followRepository.QueryNoTracking()
                .Where(f => f.FollowerId == myProfile.Id && followerProfileIds.Contains(f.FollowingId))
                .Select(f => f.FollowingId)
                .ToListAsync();

            var friendIds = await _friendshipRepository.QueryNoTracking()
                .Where(f => f.Status == FriendshipStatus.Accepted &&
                            (f.RequesterId == myProfile.Id || f.AddresseeId == myProfile.Id) &&
                            (followerProfileIds.Contains(f.RequesterId) || followerProfileIds.Contains(f.AddresseeId)))
                .Select(f => f.RequesterId == myProfile.Id ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            foreach (var dto in dtos)
            {
                dto.IsFollower = true;
                dto.IsFollowing = iFollowThemIds.Contains(dto.ProfileId);
                dto.IsFriend = friendIds.Contains(dto.ProfileId);
            }

            var nextCursor = followers.LastOrDefault()?.CreatedAt;

            return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(
                dtos,
                "Followers retrieved.",
                new { nextCursor }
            );
        }

        public async Task<ApiResponse<IEnumerable<FollowDto>>> GetFollowingAsync(ClaimsPrincipal userClaims, DateTime? lastFollowingDate = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<FollowDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (myProfile == null) return ApiResponse<IEnumerable<FollowDto>>.ErrorResponse("Profile not found.");

            var query = _followRepository.QueryNoTracking()
                .Where(f => f.FollowerId == myProfile.Id);

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

            if (!following.Any())
                return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(new List<FollowDto>(), "No following found.");


            var profiles = following.Select(f => f.Following);


            var dtos = _mapper.Map<List<FollowDto>>(profiles);


            var targetIds = dtos.Select(d => d.ProfileId).ToList();

            var theyFollowMeIds = await _followRepository.QueryNoTracking()
                .Where(f => f.FollowingId == myProfile.Id && targetIds.Contains(f.FollowerId))
                .Select(f => f.FollowerId)
                .ToListAsync();

            var friendIds = await _friendshipRepository.QueryNoTracking()
                .Where(f => f.Status == FriendshipStatus.Accepted &&
                            (f.RequesterId == myProfile.Id || f.AddresseeId == myProfile.Id) &&
                            (targetIds.Contains(f.RequesterId) || targetIds.Contains(f.AddresseeId)))
                .Select(f => f.RequesterId == myProfile.Id ? f.AddresseeId : f.RequesterId)
                .ToListAsync();


            foreach (var dto in dtos)
            {
                dto.IsFollowing = true;
                dto.IsFollower = theyFollowMeIds.Contains(dto.ProfileId);
                dto.IsFriend = friendIds.Contains(dto.ProfileId);
            }

            var nextCursor = following.LastOrDefault()?.CreatedAt;

            return ApiResponse<IEnumerable<FollowDto>>.SuccessResponse(
                dtos,
                "Following retrieved.",
                new { nextCursor }
            );
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
                        .Where(p => candidateIds.Contains(p.Id))
                        .Include(p => p.User)
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

            //this is for test when there is not enough data in the database
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
    }
}