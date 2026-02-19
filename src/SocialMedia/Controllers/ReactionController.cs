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

        [HttpPost("reactPost")]
        public async Task<IActionResult> ReactToPost(Guid postId, [FromQuery] ReactionType type)
        {
            var response = await _reactionService.ReactToPostAsync(User, postId, type);
            if (!response.Success)
            {
                return BadRequest(response.Errors);
            }
            return Ok(response);
        }

        [HttpPost("reactComment")]
        public async Task<IActionResult> ReactToComment(Guid commentId, [FromQuery] ReactionType type)
        {
            var response = await _reactionService.ReactToCommentAsync(User, commentId, type);
            if (!response.Success)
            {
                return BadRequest(response.Errors);
            }
            return Ok(response);
        }

        [HttpGet("{entityId}/reactors")]
        public async Task<IActionResult> GetReactors(
            Guid entityId,
            [FromQuery] string entityType,
            [FromQuery] ReactionType? type = null,
            [FromQuery] Guid? lastReactionId = null)
        {
            var response = await _reactionService.GetReactorsAsync(User, entityId, entityType, type, lastReactionId);

            if (!response.Success) return BadRequest(response.Errors);

            return Ok(response);
        }
    }
}
