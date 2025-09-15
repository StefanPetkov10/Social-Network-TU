using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;
using SocialMedia.DTOs.Post;

namespace SocialMedia.Services.Interfaces
{
    public interface IGroupService
    {
        // GROUPS
        Task<ApiResponse<GroupDto>> CreateGroupAsync(ClaimsPrincipal userClaims, CreateGroupDto dto);
        Task<ApiResponse<GroupDto>> GetGroupByIdAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<IEnumerable<GroupDto>>> GetAllGroupsAsync(ClaimsPrincipal userClaims, int take = 20, int skip = 0);
        Task<ApiResponse<object>> UpdateGroupAsync(ClaimsPrincipal userClaims, Guid groupId, UpdateGroupDto dto);
        Task<ApiResponse<object>> DeleteGroupAsync(ClaimsPrincipal userClaims, Guid groupId);

        // MEMBERSHIP
        Task<ApiResponse<object>> JoinGroupAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<object>> LeaveGroupAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<object>> ApproveJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
        Task<ApiResponse<object>> RejectJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
        Task<ApiResponse<object>> RemoveMemberAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId);
        Task<ApiResponse<object>> ChangeMemberRoleAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId, GroupRole newRole);
        Task<ApiResponse<IEnumerable<MemberDto>>> GetGroupMembersAsync(ClaimsPrincipal userClaims, Guid groupId);

        // POSTS
        Task<ApiResponse<PostDto>> CreateGroupPostAsync(ClaimsPrincipal userClaims, Guid groupId, CreatePostDto dto);
        Task<ApiResponse<IEnumerable<PostDto>>> GetGroupFeedAsync(ClaimsPrincipal userClaims, Guid groupId, Guid? lastPostId = null, int take = 20);
        Task<ApiResponse<object>> DeleteGroupPostAsync(ClaimsPrincipal userClaims, Guid groupId, Guid postId);
    }
}
