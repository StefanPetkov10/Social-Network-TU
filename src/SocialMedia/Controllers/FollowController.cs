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

        [HttpGet("followers/{id}")]
        public async Task<IActionResult> GetFollowers(Guid id, [FromQuery] DateTime? lastFollowerDate, [FromQuery] int take)
        {
            var response = await _followService.GetFollowersAsync(User, id, lastFollowerDate, take);
            //return response.Success ? Ok(response) : BadRequest(response);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("following/{id}")]
        public async Task<IActionResult> GetFollowing(Guid id, [FromQuery] DateTime? lastFollowingDate, [FromQuery] int take)
        {
            var response = await _followService.GetFollowingAsync(User, id, lastFollowingDate, take);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpDelete("remove-follower/{followerId}")]
        public async Task<IActionResult> RemoveFollower(Guid followerId)
        {
            var response = await _followService.RemoveFollowerAsync(User, followerId);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("suggestions")]
        public async Task<IActionResult> FollowSuggestions([FromQuery] int skip, [FromQuery] int take)
        {
            var response = await _followService.GetFollowSuggestionsAsync(User, skip, take);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
    }
}
