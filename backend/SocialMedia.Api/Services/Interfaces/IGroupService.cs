using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Group;
using SocialMedia.DTOs.Post;

namespace SocialMedia.Services.Interfaces
{
    public interface IGroupService
    {
        Task<ApiResponse<GroupDto>> CreateGroupAsync(ClaimsPrincipal userClaims, CreateGroupDto dto);
        Task<ApiResponse<GroupDto>> GetGroupByNameAsync(ClaimsPrincipal userClaims, string name);
        Task<ApiResponse<GroupDto>> GetGroupByIdAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<IEnumerable<PostDto>>> GetMyGroupsFeedAsync(ClaimsPrincipal userClaims, Guid? lastPostId = null, int take = 20);
        Task<ApiResponse<IEnumerable<PostDto>>> GetGroupsPostsAsync(ClaimsPrincipal userClaims, Guid groupId, Guid? lastPostId = null, int take = 20);
        Task<ApiResponse<IEnumerable<GroupDto>>> GetMyGroupsAsync(ClaimsPrincipal userClaims);
        Task<ApiResponse<IEnumerable<GroupDto>>> GetGroupsDiscoverAsync(ClaimsPrincipal userClaims, Guid? lastGroupId = null, int take = 20);
        Task<ApiResponse<object>> UpdateGroupAsync(ClaimsPrincipal userClaims, Guid groupId, UpdateGroupDto dto);
        Task<ApiResponse<object>> DeleteGroupAsync(ClaimsPrincipal userClaims, Guid groupId);
    }
}
