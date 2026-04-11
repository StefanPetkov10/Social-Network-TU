using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Role;

namespace SocialMedia.Services.Interfaces
{
    public interface IRoleService
    {
        Task<ApiResponse<object>> AssignRoleAsync(ClaimsPrincipal user, RoleAssignDto dto);
        Task<ApiResponse<object>> AssignRoleByEmailAsync(ClaimsPrincipal user, RoleAssignByEmailDto dto);
        Task<ApiResponse<object>> RemoveRoleAsync(ClaimsPrincipal user, RoleRemoveDto dto);
        Task<ApiResponse<object>> GetUserRolesAsync(ClaimsPrincipal user, Guid userId);
        Task<ApiResponse<object>> GetAllRolesAsync(ClaimsPrincipal user);
        Task<ApiResponse<object>> CreateRoleAsync(string roleName);
    }
}
