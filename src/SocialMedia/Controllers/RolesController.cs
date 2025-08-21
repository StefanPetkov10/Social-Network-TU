using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Common;
using SocialMedia.DTOs.Role;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet("user/{userId:guid}")]
        public async Task<IActionResult> GetUserRoles(Guid userId) =>
           Ok(await _roleService.GetUserRolesAsync(User, userId));

        [HttpGet("all")]
        public async Task<IActionResult> AllRoles() =>
            Ok(await _roleService.GetAllRolesAsync(User));

        [HttpPost("assign")]
        public async Task<IActionResult> AssignRole([FromBody] RoleAssignDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }
            var response = await _roleService.AssignRoleAsync(User, dto);
            return Ok(response);
        }

        [HttpPost("assign-by-email")]
        public async Task<IActionResult> AssignRoleByEmail([FromBody] RoleAssignByEmailDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }
            var response = await _roleService.AssignRoleByEmailAsync(User, dto);
            return Ok(response);
        }
    }
}
