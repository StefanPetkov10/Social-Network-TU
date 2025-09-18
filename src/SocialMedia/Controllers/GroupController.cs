using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Common;
using SocialMedia.DTOs.Group;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GroupController : ControllerBase
    {
        private readonly IGroupService _groupService;

        public GroupController(IGroupService groupService)
        {
            _groupService = groupService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }

            var response = await _groupService.CreateGroupAsync(User, dto);
            return Ok(response);
        }

        [HttpGet("{groupId}")]
        public async Task<IActionResult> GetGroupById(Guid groupId)
        {
            var response = await _groupService.GetGroupByIdAsync(User, groupId);
            return Ok(response);
        }

        [HttpGet("feed")]
        public async Task<IActionResult> GetMyGroupsFeed([FromQuery] Guid? lastPostId = null, [FromQuery] int take = 20)
        {
            var response = await _groupService.GetMyGroupsFeedAsync(User, lastPostId, take);
            return Ok(response);
        }

        [HttpGet("my-groups")]
        public async Task<IActionResult> GetMyGroups()
        {
            var response = await _groupService.GetMyGroupsAsync(User);
            return Ok(response);
        }
    }
}
