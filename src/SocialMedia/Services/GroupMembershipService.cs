using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;
using SocialMedia.Extensions;
using SocialMedia.Services.Interfaces;
using SocialMedia.Services.Caching;

namespace SocialMedia.Services
{
    public class GroupMembersCacheModel
    {
        public List<MemberDto> Dtos { get; set; } = new();
        public DateTime? LastJoinedDate { get; set; }
        public Guid? LastProfileId { get; set; }
        public int TotalCount { get; set; }
    }

    public class GroupMembershipService : BaseService, IGroupMembershipService
    {
        private readonly IRepository<Group, Guid> _groupRepository;
        private readonly IRepository<GroupMembership, Guid> _groupMemberRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly ICacheService _cacheService;

        private readonly TimeSpan _cacheTtl = TimeSpan.FromHours(24);

        public GroupMembershipService(UserManager<ApplicationUser> userManager,
            IRepository<Group, Guid> groupRepository,
            IRepository<Profile, Guid> profileRepository,
            IRepository<GroupMembership, Guid> groupMemberRepository,
            IRepository<Friendship, Guid> friendshipRepository,
            ICacheService cacheService) : base(userManager)
        {
            _groupRepository = groupRepository;
            _profileRepository = profileRepository;
            _groupMemberRepository = groupMemberRepository;
            _friendshipRepository = friendshipRepository;
            _cacheService = cacheService;
        }

        public async Task<ApiResponse<object>> JoinGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var (profile, group, existingMembership, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<object>.ErrorResponse(error);

            if (existingMembership != null)
            {
                switch (existingMembership.Status)
                {
                    case MembershipStatus.Approved:
                        return ApiResponse<object>.ErrorResponse("Already a member.", new[] { "You are already a member." });
                    case MembershipStatus.Pending:
                        return ApiResponse<object>.ErrorResponse("Pending.", new[] { "Request already pending." });
                    case MembershipStatus.Rejected:
                    case MembershipStatus.Left:
                        existingMembership.Status = group!.Privacy == GroupPrivacy.Public ? MembershipStatus.Approved : MembershipStatus.Pending;
                        existingMembership.RequestedOn = DateTime.UtcNow;
                        existingMembership.JoinedOn = DateTime.UtcNow;
                        await _groupMemberRepository.UpdateAsync(existingMembership);
                        await _groupMemberRepository.SaveChangesAsync();

                        await InvalidateGroupMembershipCachesAsync(profile!.Id, groupId);

                        return ApiResponse<object>.SuccessResponse("Rejoined successfully.");
                    default:
                        return ApiResponse<object>.ErrorResponse("Error.", new[] { "Invalid status." });
                }
            }

            var newMembership = new GroupMembership
            {
                GroupId = groupId,
                ProfileId = profile!.Id,
                Role = GroupRole.Member,
                Status = group!.Privacy == GroupPrivacy.Public ? MembershipStatus.Approved : MembershipStatus.Pending,
                RequestedOn = DateTime.UtcNow,
                JoinedOn = DateTime.UtcNow
            };

            await _groupMemberRepository.AddAsync(newMembership);
            await _groupMemberRepository.SaveChangesAsync();

            await InvalidateGroupMembershipCachesAsync(profile.Id, groupId);

            var msg = newMembership.Status == MembershipStatus.Approved ? "Joined successfully." : "Request sent.";
            return ApiResponse<object>.SuccessResponse(msg);
        }

        public async Task<ApiResponse<object>> LeaveGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var (profile, group, membership, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<object>.ErrorResponse(error);

            if (membership == null || membership.Status != MembershipStatus.Approved)
                return ApiResponse<object>.ErrorResponse("Not a member.");

            if (membership.Role == GroupRole.Owner)
                return ApiResponse<object>.ErrorResponse("Owner cannot leave. Assign new owner first or delete group.");

            membership.Status = MembershipStatus.Left;
            await _groupMemberRepository.UpdateAsync(membership);
            await _groupMemberRepository.SaveChangesAsync();

            await InvalidateGroupMembershipCachesAsync(profile!.Id, groupId);

            return ApiResponse<object>.SuccessResponse("You left the group.");
        }

        public async Task<ApiResponse<object>> ApproveJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            var (profile, group, membership, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<object>.ErrorResponse(error);

            var targetMembership = await _groupMemberRepository
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.ProfileId == profileId);
            if (targetMembership == null || targetMembership.Status != MembershipStatus.Pending)
                return ApiResponse<object>.ErrorResponse("No pending request from this user.");

            targetMembership.Status = MembershipStatus.Approved;
            targetMembership.JoinedOn = DateTime.UtcNow;

            await _groupMemberRepository.UpdateAsync(targetMembership);
            await _groupMemberRepository.SaveChangesAsync();

            await InvalidateGroupMembershipCachesAsync(targetMembership.ProfileId, groupId);

            return ApiResponse<object>.SuccessResponse("Member approved.");
        }

        public async Task<ApiResponse<object>> RejectJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            var (profile, group, membership, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<object>.ErrorResponse(error);

            var targetMembership = await _groupMemberRepository
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.ProfileId == profileId);
            if (targetMembership == null || targetMembership.Status != MembershipStatus.Pending)
                return ApiResponse<object>.ErrorResponse("No pending request from this user.");

            targetMembership.Status = MembershipStatus.Rejected;

            await _groupMemberRepository.UpdateAsync(targetMembership);
            await _groupMemberRepository.SaveChangesAsync();

            await InvalidateGroupMembershipCachesAsync(targetMembership.ProfileId, groupId);

            return ApiResponse<object>.SuccessResponse("Request rejected.");
        }

        public async Task<ApiResponse<object>> RemoveMemberAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            var (adminProfile, group, adminMembership, error) = await ValidateAccess(userClaims, groupId, requireAdmin: true);
            if (error != null) return ApiResponse<object>.ErrorResponse(error);

            var targetMembership = await _groupMemberRepository
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.ProfileId == profileId);
            if (targetMembership == null || targetMembership.Status != MembershipStatus.Approved)
                return ApiResponse<object>.ErrorResponse("User is not a member.");

            if (targetMembership.Role == GroupRole.Owner)
                return ApiResponse<object>.ErrorResponse("Cannot remove the owner of the group.");

            if (targetMembership.Role == GroupRole.Admin && adminMembership!.Role != GroupRole.Owner)
                return ApiResponse<object>.ErrorResponse("Admins cannot remove other admins.");

            targetMembership.Status = MembershipStatus.Left;
            await _groupMemberRepository.UpdateAsync(targetMembership);
            await _groupMemberRepository.SaveChangesAsync();

            await InvalidateGroupMembershipCachesAsync(targetMembership.ProfileId, groupId);

            return ApiResponse<object>.SuccessResponse("Member removed.");
        }

        public async Task<ApiResponse<object>> ChangeMemberRoleAsync(ClaimsPrincipal userClaims, Guid groupId, Guid targetProfileId, GroupRole newRole)
        {
            var (ownerProfile, group, ownerMembership, error) = await ValidateAccess(userClaims, groupId, requireAdmin: false);
            if (error != null) return ApiResponse<object>.ErrorResponse(error);

            if (ownerMembership!.Role != GroupRole.Owner)
                return ApiResponse<object>.ErrorResponse("Only the Owner can change roles.");

            var targetMembership = await _groupMemberRepository
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.ProfileId == targetProfileId);
            if (targetMembership == null) return ApiResponse<object>.ErrorResponse("Member not found.");

            if (newRole == GroupRole.Owner)
            {
                ownerMembership.Role = GroupRole.Admin;
                targetMembership.Role = GroupRole.Owner;
                await _groupMemberRepository.UpdateAsync(ownerMembership);
                await InvalidateGroupMembershipCachesAsync(ownerMembership.ProfileId, groupId);
            }
            else
            {
                targetMembership.Role = newRole;
            }

            await _groupMemberRepository.UpdateAsync(targetMembership);
            await _groupMemberRepository.SaveChangesAsync();

            await InvalidateGroupMembershipCachesAsync(targetMembership.ProfileId, groupId);

            return ApiResponse<object>.SuccessResponse("Role updated.");
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetPendingJoinRequestsAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var (profile, group, membership, error) = await ValidateAccess(userClaims, groupId, requireAdmin: true);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            var request = await _groupMemberRepository.QueryNoTracking()
                .Where(m => m.GroupId == groupId && m.Status == MembershipStatus.Pending)
                .Include(m => m.Profile)
                    .ThenInclude(p => p.User)
                .OrderBy(m => m.RequestedOn)
                .ToListAsync();

            var memberDtos = request.Select(m => new MemberDto
            {
                ProfileId = m.ProfileId,
                FullName = m.Profile.FullName,
                Username = m.Profile.User.UserName,
                AuthorAvatar = m.Profile.Photo,
                Role = m.Role,
                JoinedOn = DateTime.UtcNow,
                IsMe = false,
                IsFriend = false,
                MutualFriendsCount = 0
            }).ToList();

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(memberDtos);
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetOwnerAndAdminsAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var (profile, group, _, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            var admins = await _groupMemberRepository.QueryNoTracking()
                .Where(m => m.GroupId == groupId && (m.Role == GroupRole.Owner || m.Role == GroupRole.Admin) && m.Status == MembershipStatus.Approved)
                .Include(m => m.Profile)
                    .ThenInclude(p => p.User)
                .OrderBy(m => m.Role)
                .ToListAsync();

            var rawDtos = admins.Select(m => new MemberDto
            {
                ProfileId = m.ProfileId,
                FullName = m.Profile.FullName,
                Username = m.Profile.User.UserName,
                AuthorAvatar = m.Profile.Photo,
                Role = m.Role,
                JoinedOn = m.JoinedOn
            }).ToList();

            var dtos = await PopulateViewerRelationshipsAsync(rawDtos, profile!.Id, groupId);
            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(dtos);
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetFriendsInGroupAsync(ClaimsPrincipal userClaims, Guid groupId, int take = 3, int skip = 0)
        {
            var (profile, group, _, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            var myFriendIds = await GetUserFriendIdsAsync(profile!.Id);

            var friends = await _groupMemberRepository.QueryNoTracking()
                .Where(m => m.GroupId == groupId && m.Status == MembershipStatus.Approved && myFriendIds.Contains(m.ProfileId))
                .Include(m => m.Profile).ThenInclude(p => p.User)
                .OrderByDescending(m => m.Role).ThenByDescending(m => m.JoinedOn)
                .Skip(skip).Take(take)
                .ToListAsync();

            var rawDtos = friends.Select(m => new MemberDto
            {
                ProfileId = m.ProfileId,
                FullName = m.Profile.FullName,
                Username = m.Profile.User.UserName,
                AuthorAvatar = m.Profile.Photo,
                Role = m.Role,
                JoinedOn = m.JoinedOn
            }).ToList();

            var dtos = await PopulateViewerRelationshipsAsync(rawDtos, profile.Id, groupId);
            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(dtos);
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetGroupMembersAsync(
            ClaimsPrincipal userClaims, Guid groupId, DateTime? lastJoinedDate = null, Guid? lastProfileId = null, int take = 50)
        {
            var (profile, group, _, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            string cacheKey = $"group_members:{groupId}:{take}";
            GroupMembersCacheModel cacheData = null;

            if (lastJoinedDate == null && lastProfileId == null)
            {
                cacheData = await _cacheService.GetAsync<GroupMembersCacheModel>(cacheKey);
            }

            if (cacheData == null)
            {
                var totalCount = await _groupMemberRepository.QueryNoTracking()
                    .CountAsync(m => m.GroupId == groupId && m.Status == MembershipStatus.Approved);

                var query = _groupMemberRepository.QueryNoTracking()
                    .Where(m => m.GroupId == groupId && m.Status == MembershipStatus.Approved)
                    .Include(m => m.Profile).ThenInclude(p => p.User)
                    .AsQueryable();

                if (lastJoinedDate.HasValue && lastProfileId.HasValue)
                {
                    query = query.Where(m => m.JoinedOn < lastJoinedDate.Value ||
                                            (m.JoinedOn == lastJoinedDate.Value && m.ProfileId.CompareTo(lastProfileId.Value) < 0));
                }
                else if (lastJoinedDate.HasValue)
                {
                    query = query.Where(m => m.JoinedOn < lastJoinedDate.Value);
                }

                var membersData = await query
                    .OrderByDescending(m => m.JoinedOn)
                    .ThenByDescending(m => m.ProfileId)
                    .Take(take)
                    .ToListAsync();

                var rawDtos = membersData.Select(m => new MemberDto
                {
                    ProfileId = m.ProfileId,
                    FullName = m.Profile.FullName,
                    Username = m.Profile.User.UserName,
                    AuthorAvatar = m.Profile.Photo,
                    Role = m.Role,
                    JoinedOn = m.JoinedOn
                }).ToList();

                var lastItem = membersData.LastOrDefault();

                cacheData = new GroupMembersCacheModel
                {
                    Dtos = rawDtos,
                    TotalCount = totalCount,
                    LastJoinedDate = lastItem?.JoinedOn,
                    LastProfileId = lastItem?.ProfileId
                };

                if (lastJoinedDate == null && lastProfileId == null && rawDtos.Any())
                {
                    await _cacheService.SetAsync(cacheKey, cacheData, _cacheTtl);
                }
            }

            var finalDtos = await PopulateViewerRelationshipsAsync(cacheData.Dtos, profile!.Id, groupId);

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(finalDtos, "Members retrieved",
                    new { lastJoinedDate = cacheData.LastJoinedDate, lastProfileId = cacheData.LastProfileId, totalCount = cacheData.TotalCount }
            );
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> SearchGroupMembersAsync(ClaimsPrincipal userClaims, Guid groupId, string query, int take = 20)
        {
            var (profile, group, _, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            if (string.IsNullOrWhiteSpace(query))
                return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(new List<MemberDto>(), "Empty query.");

            var cleanQuery = EscapeLikePattern.EscapeLikePatternMethod(query.Trim().ToLower());

            var dbQuery = _groupMemberRepository.QueryNoTracking()
                .Where(m => m.GroupId == groupId && m.Status == MembershipStatus.Approved);

            dbQuery = dbQuery.Where(m =>
                EF.Functions.ILike(m.Profile.FirstName + " " + m.Profile.LastName, $"%{cleanQuery}%") ||
                EF.Functions.ILike(m.Profile.User.UserName, $"%{cleanQuery}%") ||
                EF.Functions.TrigramsWordSimilarity(m.Profile.FirstName + " " + m.Profile.LastName, cleanQuery) > 0.3 ||
                EF.Functions.TrigramsWordSimilarity(m.Profile.User.UserName, cleanQuery) > 0.3
            );

            dbQuery = dbQuery
                .OrderByDescending(m => Math.Max(
                    EF.Functions.TrigramsWordSimilarity(m.Profile.FirstName + " " + m.Profile.LastName, cleanQuery),
                    EF.Functions.TrigramsWordSimilarity(m.Profile.User.UserName, cleanQuery)))
                .ThenByDescending(m => m.JoinedOn);

            var membersData = await dbQuery
                .Take(take)
                .Include(m => m.Profile).ThenInclude(p => p.User)
                .ToListAsync();

            var rawDtos = membersData.Select(m => new MemberDto
            {
                ProfileId = m.ProfileId,
                FullName = m.Profile.FullName,
                Username = m.Profile.User.UserName,
                AuthorAvatar = m.Profile.Photo,
                Role = m.Role,
                JoinedOn = m.JoinedOn
            }).ToList();

            var dtos = await PopulateViewerRelationshipsAsync(rawDtos, profile!.Id, groupId);

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(dtos, "Search completed.", new { totalCount = dtos.Count });
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetMutualFriendsInGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var (profile, group, _, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            var myFriendIds = await GetUserFriendIdsAsync(profile!.Id);

            var topCandidates = await _groupMemberRepository.QueryNoTracking()
                .Where(m => m.GroupId == groupId
                            && m.Status == MembershipStatus.Approved
                            && m.ProfileId != profile.Id
                            && !myFriendIds.Contains(m.ProfileId))
                .Select(m => new
                {
                    Member = m,
                    Profile = m.Profile,
                    User = m.Profile.User,
                    MutualCount = _friendshipRepository.QueryNoTracking()
                        .Count(f => f.Status == FriendshipStatus.Accepted &&
                                    (
                                        (f.AddresseeId == m.ProfileId && myFriendIds.Contains(f.RequesterId)) ||
                                        (f.RequesterId == m.ProfileId && myFriendIds.Contains(f.AddresseeId))
                                    ))
                })
                .Where(x => x.MutualCount > 0)
                .OrderByDescending(x => x.MutualCount)
                .ToListAsync();

            var candidateIds = topCandidates.Select(x => x.Member.ProfileId).ToList();

            var friendships = await _friendshipRepository.QueryNoTracking()
                .Where(f => (f.RequesterId == profile.Id && candidateIds.Contains(f.AddresseeId)) ||
                            (f.AddresseeId == profile.Id && candidateIds.Contains(f.RequesterId)))
                .ToListAsync();

            var dtos = topCandidates.Select(x =>
            {
                var friendship = friendships.FirstOrDefault(f => f.RequesterId == x.Member.ProfileId || f.AddresseeId == x.Member.ProfileId);

                bool hasSentRequest = friendship?.Status == FriendshipStatus.Pending && friendship.RequesterId == profile.Id;
                bool hasReceivedRequest = friendship?.Status == FriendshipStatus.Pending && friendship.AddresseeId == profile.Id;

                return new MemberDto
                {
                    ProfileId = x.Member.ProfileId,
                    FullName = x.Profile.FullName,
                    Username = x.User.UserName,
                    AuthorAvatar = x.Profile.Photo,
                    Role = x.Member.Role,
                    JoinedOn = x.Member.JoinedOn,
                    IsMe = false,
                    IsFriend = false,
                    MutualFriendsCount = x.MutualCount,

                    HasSentRequest = hasSentRequest,
                    HasReceivedRequest = hasReceivedRequest,
                    PendingRequestId = (hasSentRequest || hasReceivedRequest) ? friendship?.Id : null
                };
            }).ToList();

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(dtos);
        }

        private async Task<HashSet<Guid>> GetUserFriendIdsAsync(Guid profileId)
        {
            var friendships = await _friendshipRepository.QueryNoTracking()
                .Where(f => (f.AddresseeId == profileId || f.RequesterId == profileId) && f.Status == FriendshipStatus.Accepted)
                .Select(f => f.AddresseeId == profileId ? f.RequesterId : f.AddresseeId)
                .ToListAsync();

            return friendships.ToHashSet();
        }

        private async Task<(Profile? Profile, Group? Group, GroupMembership? Membership, string? Error)> ValidateAccess(
            ClaimsPrincipal userClaims, Guid groupId, bool requireAdmin = false)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userClaims, out var userId);
            if (invalidUserResponse != null) return (null, null, null, "Unauthorized");

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null) return (null, null, null, "Profile not found");

            var group = await _groupRepository.GetByIdAsync(groupId);
            if (group == null) return (null, null, null, "Group not found");

            var membership = await _groupMemberRepository.FirstOrDefaultAsync(m => m.GroupId == groupId && m.ProfileId == profile.Id);

            if (requireAdmin)
            {
                if (membership == null || (membership.Role != GroupRole.Admin && membership.Role != GroupRole.Owner))
                    return (null, null, null, "Forbidden: Admins only");
            }

            return (profile, group, membership, null);
        }

        private async Task InvalidateGroupMembershipCachesAsync(Guid profileId, Guid groupId)
        {
            await _cacheService.RemoveByPrefixAsync($"user_groups:{profileId}");
            await _cacheService.RemoveAsync($"group:{groupId}");
            await _cacheService.RemoveByPrefixAsync($"group_members:{groupId}");
        }

        private async Task<List<MemberDto>> PopulateViewerRelationshipsAsync(List<MemberDto> dtos, Guid viewerProfileId, Guid groupId)
        {
            if (!dtos.Any()) return dtos;

            var displayedProfileIds = dtos.Select(m => m.ProfileId).ToList();
            var myFriendIds = await GetUserFriendIdsAsync(viewerProfileId);

            var friendships = await _friendshipRepository.QueryNoTracking()
                 .Where(f => (f.RequesterId == viewerProfileId && displayedProfileIds.Contains(f.AddresseeId)) ||
                             (f.AddresseeId == viewerProfileId && displayedProfileIds.Contains(f.RequesterId)))
                 .ToListAsync();

            var membersWithCount = await _groupMemberRepository.QueryNoTracking()
               .Where(m => displayedProfileIds.Contains(m.ProfileId) && m.GroupId == groupId)
               .Select(m => new
               {
                   m.ProfileId,
                   MutualCount = _friendshipRepository.QueryNoTracking()
                       .Count(f => f.Status == FriendshipStatus.Accepted &&
                                   (
                                       (f.AddresseeId == m.ProfileId && myFriendIds.Contains(f.RequesterId)) ||
                                       (f.RequesterId == m.ProfileId && myFriendIds.Contains(f.AddresseeId))
                                   ))
               })
               .ToListAsync();

            foreach (var m in dtos)
            {
                var friendship = friendships.FirstOrDefault(f => f.RequesterId == m.ProfileId || f.AddresseeId == m.ProfileId);
                var mutualInfo = membersWithCount.FirstOrDefault(x => x.ProfileId == m.ProfileId);

                m.IsMe = m.ProfileId == viewerProfileId;
                m.IsFriend = friendship?.Status == FriendshipStatus.Accepted;
                m.HasSentRequest = friendship?.Status == FriendshipStatus.Pending && friendship.RequesterId == viewerProfileId;
                m.HasReceivedRequest = friendship?.Status == FriendshipStatus.Pending && friendship.AddresseeId == viewerProfileId;
                m.PendingRequestId = (m.HasSentRequest || m.HasReceivedRequest) ? friendship?.Id : null;

                m.MutualFriendsCount = m.IsMe ? 0 : (mutualInfo?.MutualCount ?? 0);
            }

            return dtos;
        }
    }
}