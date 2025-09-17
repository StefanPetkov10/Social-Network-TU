using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Group;

namespace SocialMedia.Services.Interfaces
{
    public interface IGroupService
    {
        Task<ApiResponse<GroupDto>> CreateGroupAsync(ClaimsPrincipal userClaims, CreateGroupDto dto);
        Task<ApiResponse<GroupDto>> GetGroupByIdAsync(ClaimsPrincipal userClaims, Guid groupId);
        Task<ApiResponse<IEnumerable<GroupDto>>> GetAllGroupsAsync(ClaimsPrincipal userClaims, int take = 20, int skip = 0);
        Task<ApiResponse<object>> UpdateGroupAsync(ClaimsPrincipal userClaims, Guid groupId, UpdateGroupDto dto);
        Task<ApiResponse<object>> DeleteGroupAsync(ClaimsPrincipal userClaims, Guid groupId);
    }
}
