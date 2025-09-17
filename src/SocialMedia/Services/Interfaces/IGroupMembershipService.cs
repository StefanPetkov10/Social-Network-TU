using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;

namespace SocialMedia.Services.Interfaces
{
    public interface IGroupMembershipService
    {
        Task<ApiResponse<object>> JoinGroupAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<object>> ApproveJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
        Task<ApiResponse<IEnumerable<MemberDto>>> GetGroupMembersAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<object>> RejectJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
        Task<ApiResponse<object>> LeaveGroupAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<object>> ChangeMemberRoleAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId, GroupRole newRole);
        Task<ApiResponse<object>> RemoveMemberAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
    }
}
