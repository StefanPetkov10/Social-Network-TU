using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.DTOs.Group;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]/{groupId}")]
    [ApiController]
    [Authorize]
    public class GroupMembershipController : ControllerBase
    {
        private readonly IGroupMembershipService _groupMembershipService;

        public GroupMembershipController(IGroupMembershipService groupMembershipService)
        {
            _groupMembershipService = groupMembershipService;
        }

        [HttpGet("members")]
        public async Task<IActionResult> GetMembers(
            Guid groupId,
            [FromQuery] DateTime? lastJoinedDate,
            [FromQuery] Guid? lastProfileId,
            [FromQuery] int take = 50)
        {
            var response = await _groupMembershipService.GetGroupMembersAsync(User, groupId, lastJoinedDate, lastProfileId, take);

            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpGet("friends")]
        public async Task<IActionResult> GetFriendsInGroup(
            [FromRoute] Guid groupId,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 3)
        {
            var response = await _groupMembershipService.GetFriendsInGroupAsync(User, groupId, take, skip);

            if (!response.Success)
                return BadRequest(response.Errors);

            return Ok(response);
        }

        [HttpGet("mutual-friends")]
        public async Task<IActionResult> GetMutualFriends([FromRoute] Guid groupId)
        {
            var response = await _groupMembershipService.GetMutualFriendsInGroupAsync(User, groupId);

            if (!response.Success)
                return BadRequest(response.Errors);

            return Ok(response);
        }

        [HttpGet("admins")]
        public async Task<IActionResult> GetAdmins([FromRoute] Guid groupId)
        {
            var response = await _groupMembershipService.GetOwnerAndAdminsAsync(User, groupId);

            if (!response.Success)
                return BadRequest(response.Errors);

            return Ok(response);
        }

        [HttpGet("requests")]
        public async Task<IActionResult> GetPendingRequests([FromRoute] Guid groupId)
        {
            var response = await _groupMembershipService.GetPendingJoinRequestsAsync(User, groupId);

            if (!response.Success)
                return BadRequest(response.Errors);

            return Ok(response);
        }

        [HttpPost("join")]
        public async Task<IActionResult> JoinGroup([FromRoute] Guid groupId)
        {
            var response = await _groupMembershipService.JoinGroupAsync(User, groupId);

            if (!response.Success)
                return BadRequest(response.Errors);

            return Ok(response);
        }

        [HttpPost("requests/{profileId}/approve")]
        public async Task<IActionResult> ApproveRequest([FromRoute] Guid groupId, [FromRoute] Guid profileId)
        {
            var response = await _groupMembershipService.ApproveJoinRequestAsync(User, groupId, profileId);

            if (!response.Success)
                return BadRequest(response.Errors);

            return Ok(response);
        }

        [HttpPost("requests/{profileId}/reject")]
        public async Task<IActionResult> RejectRequest([FromRoute] Guid groupId, [FromRoute] Guid profileId)
        {
            var response = await _groupMembershipService.RejectJoinRequestAsync(User, groupId, profileId);

            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpPut("members/{profileId}/role")]
        public async Task<IActionResult> ChangeRole(
            [FromRoute] Guid groupId,
            [FromRoute] Guid profileId,
            [FromBody] ChangeRoleDto dto)
        {
            var response = await _groupMembershipService.ChangeMemberRoleAsync(User, groupId, profileId, dto.NewRole);

            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpDelete("leave")]
        public async Task<IActionResult> LeaveGroup([FromRoute] Guid groupId)
        {
            var response = await _groupMembershipService.LeaveGroupAsync(User, groupId);

            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpDelete("members/{profileId}")]
        public async Task<IActionResult> RemoveMember([FromRoute] Guid groupId, [FromRoute] Guid profileId)
        {
            var response = await _groupMembershipService.RemoveMemberAsync(User, groupId, profileId);

            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }
    }
}