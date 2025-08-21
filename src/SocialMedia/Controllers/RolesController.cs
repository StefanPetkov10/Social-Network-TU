using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    }
}
