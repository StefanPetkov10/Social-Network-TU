using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;

namespace SocialMedia.Services.Interfaces
{
    public interface IGroupMembershipService
    {
        Task<ApiResponse<object>> JoinGroupAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<object>> LeaveGroupAsync(ClaimsPrincipal userClaims, Guid groupId);

        Task<ApiResponse<object>> ApproveJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
        Task<ApiResponse<object>> RejectJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
        Task<ApiResponse<object>> RemoveMemberAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
        Task<ApiResponse<object>> ChangeMemberRoleAsync(ClaimsPrincipal userClaims, Guid groupId, Guid targetProfileId, GroupRole newRole);
        Task<ApiResponse<IEnumerable<MemberDto>>> GetPendingJoinRequestsAsync(ClaimsPrincipal userClaims, Guid groupId);

        Task<ApiResponse<IEnumerable<MemberDto>>> GetGroupMembersAsync(
            ClaimsPrincipal userClaims,
            Guid groupId,
            DateTime? lastJoinedDate = null,
            Guid? lastProfileId = null,
            int take = 50);

        Task<ApiResponse<IEnumerable<MemberDto>>> GetFriendsInGroupAsync(
            ClaimsPrincipal userClaims,
            Guid groupId,
            int take = 3,
            int skip = 0);
        Task<ApiResponse<IEnumerable<MemberDto>>> GetOwnerAndAdminsAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<IEnumerable<MemberDto>>> GetMutualFriendsInGroupAsync(ClaimsPrincipal userClaims, Guid groupId);
    }
}