using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class GroupMembershipService : IGroupMembershipService
    {
        public Task<ApiResponse<object>> JoinGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }
        public Task<ApiResponse<object>> ApproveJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<IEnumerable<MemberDto>>> GetGroupMembersAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> RejectJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> LeaveGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> ChangeMemberRoleAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId, GroupRole newRole)
        {
            throw new NotImplementedException();
        }


        public Task<ApiResponse<object>> RemoveMemberAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }
    }
}
