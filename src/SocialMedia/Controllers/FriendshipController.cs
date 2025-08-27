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
        public async Task<IActionResult> GetPendingRequests()
        {
            var userClaims = User;
            var response = await _friendshipService.GetPendingFriendRequestsAsync(userClaims);
            if (!response.Success)
                return BadRequest(response);
            return Ok(response);
        }
    }
}
