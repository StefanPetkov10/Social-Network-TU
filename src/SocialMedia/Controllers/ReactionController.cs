using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Database.Models.Enums;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReactionController : ControllerBase
    {
        private readonly IReactionService _reactionService;

        public ReactionController(IReactionService reactionService)
        {
            _reactionService = reactionService;
        }

        [HttpPost("react")]
        public async Task<IActionResult> ReactToPost(Guid postId, [FromQuery] ReactionType type)
        {
            var response = await _reactionService.ReactToPostAsync(User, postId, type);
            if (!response.Success)
            {
                return BadRequest(response.Errors);
            }
            return Ok(response.Data);
        }
    }
}
