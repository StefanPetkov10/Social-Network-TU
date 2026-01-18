using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FriendshipController : ControllerBase
    {
        private readonly IFriendshipService _friendshipService;
        public FriendshipController(IFriendshipService friendshipService)
        {
            _friendshipService = friendshipService;
        }

        [HttpPost("send-request/{addresseeId:guid}")]
        public async Task<IActionResult> SendFriendRequest(Guid addresseeId)
        {
            var response = await _friendshipService.SendFriendRequestAsync(User, addresseeId);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpPost("accept-request/{requestId:guid}")]
        public async Task<IActionResult> AcceptRequest(Guid requestId)
        {
            var userClaims = User;
            var response = await _friendshipService.AcceptFriendRequestAsync(userClaims, requestId);

            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpGet("pending-requests")]
        public async Task<IActionResult> GetPendingRequests([FromQuery] DateTime? lastRequestDate, [FromQuery] int take = 10)
        {
            var userClaims = User;
            var response = await _friendshipService.GetPendingFriendRequestsAsync(userClaims, lastRequestDate, take);
            if (!response.Success)
                return BadRequest(response);
            return Ok(response);
        }

        [HttpGet("suggestions")]
        public async Task<IActionResult> GetFriendSuggestions([FromQuery] int skip, [FromQuery] int take)
        {
            var userClaims = User;
            var response = await _friendshipService.GetFriendSuggestionsAsync(userClaims, skip, take);
            if (!response.Success)
                return BadRequest(response);
            return Ok(response);
        }

        [HttpGet("friends/{profileId:guid}")]
        public async Task<IActionResult> GetFriends(Guid profileId, [FromQuery] DateTime? lastFriendshipDate, [FromQuery] int take = 20)
        {
            var response = await _friendshipService.GetFriendsListAsync(profileId, lastFriendshipDate, take);
            if (!response.Success)
                return BadRequest(response);
            return Ok(response);
        }

        [HttpDelete("cancel-request/{addresseeId:guid}")]
        public async Task<IActionResult> CancelRequest(Guid addresseeId)
        {
            var userClaims = User;
            var response = await _friendshipService.CancelFriendRequestAsync(userClaims, addresseeId);
            if (!response.Success)
                return BadRequest(response);
            return Ok(response);
        }


        [HttpDelete("decline-request/{requestId:guid}")]
        public async Task<IActionResult> DeclineRequest(Guid requestId)
        {
            var userClaims = User;
            var response = await _friendshipService.DeclineFriendRequestAsync(userClaims, requestId);
            if (!response.Success)
                return BadRequest(response);
            return Ok(response);
        }

        [HttpDelete("remove-friend/{friendProfileId:guid}")]
        public async Task<IActionResult> RemoveFriend(Guid friendProfileId)
        {
            var userClaims = User;
            var response = await _friendshipService.RemoveFriendAsync(userClaims, friendProfileId);
            if (!response.Success)
                return BadRequest(response);
            return Ok(response);
        }
    }
}