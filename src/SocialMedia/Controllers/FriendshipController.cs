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

    }
}
