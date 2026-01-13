using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class GroupMembershipService : BaseService, IGroupMembershipService
    {
        private readonly IRepository<Group, Guid> _groupRepository;
        private readonly IRepository<GroupMembership, Guid> _groupMemberRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;
        private readonly IRepository<Friendship, Guid> _friendshipRepository;

        public GroupMembershipService(UserManager<ApplicationUser> userManager,
            IRepository<Group, Guid> groupRepository,
                IRepository<Profile, Guid> profileRepository,
                IRepository<GroupMembership, Guid> groupMemberRepository,
                IRepository<Friendship, Guid> friendshipRepository) : base(userManager)
        {
            _groupRepository = groupRepository;
            _profileRepository = profileRepository;
            _groupMemberRepository = groupMemberRepository;
            _friendshipRepository = friendshipRepository;
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
                        existingMembership.Status = group!.Privacy == GroupPrivacy.Public ? MembershipStatus.Approved : MembershipStatus.Pending;
                        existingMembership.RequestedOn = DateTime.UtcNow;
                        existingMembership.JoinedOn = DateTime.UtcNow;
                        await _groupMemberRepository.UpdateAsync(existingMembership);
                        await _groupMemberRepository.SaveChangesAsync();
                        return ApiResponse<object>.SuccessResponse("Rejoined successfully.");
                    case MembershipStatus.Left:
                        existingMembership.Status = group!.Privacy == GroupPrivacy.Public ? MembershipStatus.Approved : MembershipStatus.Pending;
                        existingMembership.RequestedOn = DateTime.UtcNow;
                        existingMembership.JoinedOn = DateTime.UtcNow;
                        await _groupMemberRepository.UpdateAsync(existingMembership);
                        await _groupMemberRepository.SaveChangesAsync();
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

            var msg = newMembership.Status == MembershipStatus.Approved ? "Joined successfully." : "Request sent.";
            return ApiResponse<object>.SuccessResponse(msg);
        }

        public async Task<ApiResponse<object>> LeaveGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var (profile, group, membership, error) = await ValidateAccess(userClaims, groupId);
            if (error != null)
            {
                return ApiResponse<object>.ErrorResponse(error);
            }

            if (membership == null || membership.Status != MembershipStatus.Approved)
                return ApiResponse<object>.ErrorResponse("Not a member.");

            if (membership.Role == GroupRole.Owner)
                return ApiResponse<object>.ErrorResponse("Owner cannot leave. Assign new owner first or delete group.");

            membership.Status = MembershipStatus.Left;
            await _groupMemberRepository.UpdateAsync(membership);
            await _groupMemberRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse("You left the group.");
        }

        public async Task<ApiResponse<object>> ApproveJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            var (profile, group, membership, error) = await ValidateAccess(userClaims, groupId);
            if (error != null)
            {
                return ApiResponse<object>.ErrorResponse(error);
            }

            var targetMembership = await _groupMemberRepository
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.ProfileId == profileId);
            if (targetMembership == null || targetMembership.Status != MembershipStatus.Pending)
                return ApiResponse<object>.ErrorResponse("No pending request from this user.");

            targetMembership.Status = MembershipStatus.Approved;
            targetMembership.JoinedOn = DateTime.UtcNow;

            await _groupMemberRepository.UpdateAsync(targetMembership);
            await _groupMemberRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse("Member approved.");
        }

        public async Task<ApiResponse<object>> RejectJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            var (profile, group, membership, error) = await ValidateAccess(userClaims, groupId);
            if (error != null)
            {
                return ApiResponse<object>.ErrorResponse(error);
            }

            var targetMembership = await _groupMemberRepository
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.ProfileId == profileId);
            if (targetMembership == null || targetMembership.Status != MembershipStatus.Pending)
                return ApiResponse<object>.ErrorResponse("No pending request from this user.");

            targetMembership.Status = MembershipStatus.Rejected;

            await _groupMemberRepository.UpdateAsync(targetMembership);
            await _groupMemberRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse("Request rejected.");
        }

        public async Task<ApiResponse<object>> RemoveMemberAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            var (adminProfile, group, adminMembership, error) = await ValidateAccess(userClaims, groupId, requireAdmin: true);
            if (error != null)
            {
                return ApiResponse<object>.ErrorResponse(error);
            }

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
            }
            else
            {
                targetMembership.Role = newRole;
            }

            await _groupMemberRepository.UpdateAsync(targetMembership);
            await _groupMemberRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse("Role updated.");
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetPendingJoinRequestsAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var (profile, group, membership, error) = await ValidateAccess(userClaims, groupId, requireAdmin: true);
            if (error != null)
            {
                return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);
            }

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
                Photo = m.Profile.Photo,
                Role = m.Role,
                JoinedOn = DateTime.UtcNow,
                IsMe = false,
                IsFriend = false,
                MutualFriendsCount = 0
            });

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(memberDtos);
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetOwnerAndAdminsAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var (profile, group, _, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            var myFriendIds = await GetUserFriendIdsAsync(profile!.Id);

            var admins = await _groupMemberRepository.QueryNoTracking()
                .Where(m => m.GroupId == groupId && (m.Role == GroupRole.Owner || m.Role == GroupRole.Admin) && m.Status == MembershipStatus.Approved)
                .Include(m => m.Profile)
                .ThenInclude(p => p.User)
                .OrderBy(m => m.Role)
                .ToListAsync();

            var dtos = admins.Select(m => new MemberDto
            {
                ProfileId = m.ProfileId,
                FullName = m.Profile.FullName,
                Username = m.Profile.User.UserName,
                Photo = m.Profile.Photo,
                Role = m.Role,
                JoinedOn = m.JoinedOn,
                IsMe = m.ProfileId == profile.Id,
                IsFriend = myFriendIds.Contains(m.ProfileId),
                MutualFriendsCount = 0
            });

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(dtos);
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetFriendsInGroupAsync(ClaimsPrincipal userClaims, Guid groupId, int take = 3, int skip = 0)
        {
            var (profile, group, _, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            var myFriendIds = await GetUserFriendIdsAsync(profile!.Id);

            var query = _groupMemberRepository.QueryNoTracking()
                .Where(m => m.GroupId == groupId && m.Status == MembershipStatus.Approved && myFriendIds.Contains(m.ProfileId))
                .Include(m => m.Profile)
                .ThenInclude(p => p.User)
                .OrderByDescending(m => m.Role)
                .ThenByDescending(m => m.JoinedOn);

            var friends = await query.Skip(skip).Take(take).ToListAsync();

            var dtos = friends.Select(m => new MemberDto
            {
                ProfileId = m.ProfileId,
                FullName = m.Profile.FullName,
                Username = m.Profile.User.UserName,
                Photo = m.Profile.Photo,
                Role = m.Role,
                JoinedOn = m.JoinedOn,
                IsMe = false,
                IsFriend = true,
                MutualFriendsCount = 0
            });

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(dtos);
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
                .OrderByDescending(x => x.MutualCount)
                .Take(5)
                .ToListAsync();

            var dtos = topCandidates.Select(x => new MemberDto
            {
                ProfileId = x.Member.ProfileId,
                FullName = x.Profile.FullName,
                Username = x.User.UserName,
                Photo = x.Profile.Photo,
                Role = x.Member.Role,
                JoinedOn = x.Member.JoinedOn,
                IsMe = false,
                IsFriend = false,
                MutualFriendsCount = x.MutualCount
            });

            if (!dtos.Any())
                return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(Enumerable.Empty<MemberDto>(), "No mutual friends found.");

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(dtos);
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetGroupMembersAsync(ClaimsPrincipal userClaims, Guid groupId, DateTime? lastJoinedDate = null, int take = 20)
        {
            var (profile, group, _, error) = await ValidateAccess(userClaims, groupId);
            if (error != null) return ApiResponse<IEnumerable<MemberDto>>.ErrorResponse(error);

            var myFriendIds = await GetUserFriendIdsAsync(profile!.Id);

            var query = _groupMemberRepository.QueryNoTracking()
                .Where(m => m.GroupId == groupId && m.Status == MembershipStatus.Approved)
                .Include(m => m.Profile)
                .ThenInclude(p => p.User)
                .OrderByDescending(m => m.JoinedOn)
                .AsQueryable();

            /*if (!string.IsNullOrEmpty(search)) - LOWER(column) LIKE '%search%'
            {
                search = search.ToLower();
                query = query.Where(m => m.Profile.FirstName.ToLower().Contains(search) ||
                                         m.Profile.LastName.ToLower().Contains(search) ||
                                         m.Profile.User.UserName.ToLower().Contains(search));
            }*/

            if (lastJoinedDate.HasValue)
            {
                query = query.Where(m => m.JoinedOn < lastJoinedDate);
            }

            var members = await query.Take(take).ToListAsync();

            var dtos = members.Select(m => new MemberDto
            {
                ProfileId = m.ProfileId,
                FullName = m.Profile.FullName,
                Username = m.Profile.User.UserName,
                Photo = m.Profile.Photo,
                Role = m.Role,
                JoinedOn = m.JoinedOn,
                IsMe = m.ProfileId == profile.Id,
                IsFriend = myFriendIds.Contains(m.ProfileId),
                MutualFriendsCount = 0
            });

            var lastDate = members.LastOrDefault()?.JoinedOn;

            return ApiResponse<IEnumerable<MemberDto>>.SuccessResponse(dtos, "Members retrieved",
                    new { lastJoinedDate = lastDate }
            );
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
    }
}
