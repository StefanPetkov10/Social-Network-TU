using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GroupMembershipController : ControllerBase
    {
        private readonly IGroupMembershipService _groupMembershipService;

        public GroupMembershipController(IGroupMembershipService groupMembershipService)
        {
            _groupMembershipService = groupMembershipService;
        }

        [HttpPost("join/{groupId}")]
        public async Task<IActionResult> JoinGroup(Guid groupId)
        {
            var response = await _groupMembershipService.JoinGroupAsync(User, groupId);
            if (!response.Success)
            {
                return BadRequest(response.Errors);
            }
            return Ok(response);
        }
    }
}
