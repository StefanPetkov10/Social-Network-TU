using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Role;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class RoleService : IRoleService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;

        public RoleService(UserManager<ApplicationUser> userManager,
                            RoleManager<IdentityRole<Guid>> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<ApiResponse<object>> AssignRoleAsync(ClaimsPrincipal user, RoleAssignDto dto)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<object>> AssignRoleByEmailAsync(ClaimsPrincipal user, RoleAssignByEmailDto dto)
        {
            throw new NotImplementedException();
        }


        public async Task<ApiResponse<object>> GetAllRolesAsync(ClaimsPrincipal user)
        {
            var roles = _roleManager.Roles.Select(r => new { r.Id, r.Name }).ToList();
            return await Task.FromResult(ApiResponse<object>.SuccessResponse(roles, "Roles retrieved."));
        }

        public async Task<ApiResponse<object>> GetUserRolesAsync(ClaimsPrincipal user, Guid userId)
        {
            var targetUser = await _userManager.FindByIdAsync(userId.ToString());
            if (targetUser == null)
                return ApiResponse<object>.ErrorResponse("User not found.", Array.Empty<string>());

            var roles = await _userManager.GetRolesAsync(targetUser);
            return ApiResponse<object>.SuccessResponse(roles, "User roles.");
        }

        public async Task<ApiResponse<object>> RemoveRoleAsync(ClaimsPrincipal user, RoleRemoveDto dto)
        {
            throw new NotImplementedException();
        }
        public async Task<ApiResponse<object>> CreateRoleAsync(string roleName)
        {
            throw new NotImplementedException();
        }
    }
}
