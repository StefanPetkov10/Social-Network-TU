using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class GroupService : IGroupService
    {
        public Task<ApiResponse<object>> ApproveJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> ChangeMemberRoleAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId, GroupRole newRole)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<GroupDto>> CreateGroupAsync(ClaimsPrincipal userClaims, CreateGroupDto dto)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<PostDto>> CreateGroupPostAsync(ClaimsPrincipal userClaims, Guid groupId, CreatePostDto dto)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> DeleteGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> DeleteGroupPostAsync(ClaimsPrincipal userClaims, Guid groupId, Guid postId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<IEnumerable<GroupDto>>> GetAllGroupsAsync(ClaimsPrincipal userClaims, int take = 20, int skip = 0)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<GroupDto>> GetGroupByIdAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<IEnumerable<PostDto>>> GetGroupFeedAsync(ClaimsPrincipal userClaims, Guid groupId, Guid? lastPostId = null, int take = 20)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<IEnumerable<MemberDto>>> GetGroupMembersAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> JoinGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> LeaveGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> RejectJoinRequestAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> RemoveMemberAsync(ClaimsPrincipal userClaims, Guid groupId, Guid profileId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> UpdateGroupAsync(ClaimsPrincipal userClaims, Guid groupId, UpdateGroupDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
