using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
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

        public GroupMembershipService(UserManager<ApplicationUser> userManager,
            IRepository<Group, Guid> groupRepository,
                IRepository<Profile, Guid> profileRepository,
                IRepository<GroupMembership, Guid> groupMemberRepository) : base(userManager)
        {
            _groupRepository = groupRepository;
            _profileRepository = profileRepository;
            _groupMemberRepository = groupMemberRepository;
        }

        public async Task<ApiResponse<object>> JoinGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<object>("Profile");

            var group = await _groupRepository.GetByIdAsync(groupId);
            if (group == null)
                return NotFoundResponse<object>("Group");

            var existingMembership = await _groupMemberRepository
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.ProfileId == profile.Id);
            if (existingMembership != null)
            {
                switch (existingMembership.Status)
                {
                    case MembershipStatus.Approved:
                        return ApiResponse<object>.ErrorResponse("Already a member.", new[] { "You are already a member of this group." });
                    case MembershipStatus.Pending:
                        return ApiResponse<object>.ErrorResponse("Join request pending.", new[] { "Your join request is already pending approval." });
                    case MembershipStatus.Rejected:
                        return ApiResponse<object>.ErrorResponse("Join request rejected.", new[] { "Your previous join request was rejected." });
                    case MembershipStatus.Left:
                        existingMembership.Status = group.Privacy == GroupPrivacy.Public ? MembershipStatus.Approved : MembershipStatus.Pending;
                        existingMembership.RequestedOn = DateTime.UtcNow;
                        existingMembership.JoinedOn = DateTime.UtcNow;
                        await _groupMemberRepository.UpdateAsync(existingMembership);
                        return ApiResponse<object>.SuccessResponse("Rejoined group successfully.");
                    default:
                        return ApiResponse<object>.ErrorResponse("Invalid membership status.", new[] { "Unknown membership status." });
                }
            }
            else
            {
                var newMembership = new GroupMembership
                {
                    GroupId = groupId,
                    ProfileId = profile.Id,
                    Role = GroupRole.Member,
                    Status = group.Privacy == GroupPrivacy.Public ? MembershipStatus.Approved : MembershipStatus.Pending,
                    RequestedOn = DateTime.UtcNow,
                    JoinedOn = DateTime.UtcNow
                };
                await _groupMemberRepository.AddAsync(newMembership);
                await _groupMemberRepository.SaveChangesAsync();
                var message = newMembership.Status == MembershipStatus.Approved ? "Joined group successfully." : "Join request submitted and pending approval.";

                return ApiResponse<object>.SuccessResponse(message);
            }
        }
        public async Task<ApiResponse<object>> ApproveJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<IEnumerable<MemberDto>>> GetGroupMembersAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> RejectJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> LeaveGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> ChangeMemberRoleAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId, GroupRole newRole)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> RemoveMemberAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }
    }
}
