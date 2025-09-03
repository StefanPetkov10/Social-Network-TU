using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FollowController : ControllerBase
    {
        private readonly IFollowService _followService;

        public FollowController(IFollowService followService)
        {
            _followService = followService;
        }

        [HttpPost("follow/{followingId}")]
        public async Task<IActionResult> Follow(Guid followingId)
        {
            var response = await _followService.FollowAsync(User, followingId);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpDelete("unfollow/{followingId}")]
        public async Task<IActionResult> Unfollow(Guid followingId)
        {
            var response = await _followService.UnfollowAsync(User, followingId);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("is-following")]
        public async Task<IActionResult> IsFollowing(Guid followingId)
        {
            var response = await _followService.IsFollowingAsync(User, followingId);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("followers")]
        public async Task<IActionResult> Followers()
        {
            var response = await _followService.GetFollowersAsync(User);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("following")]
        public async Task<IActionResult> Following()
        {
            var response = await _followService.GetFollowingAsync(User);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("followers-count")]
        public async Task<IActionResult> FollowersCount()
        {
            var response = await _followService.GetFollowersCountAsync(User);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
    }
}
