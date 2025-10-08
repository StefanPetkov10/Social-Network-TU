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

        [HttpGet("postReactions/{postId}")]
        public async Task<IActionResult> GetPostReactionsCount(Guid postId)
        {
            var response = await _reactionService.GetPostReactionsCountAsync(postId);
            if (!response.Success)
            {
                return BadRequest(response.Errors);
            }
            return Ok(response);
        }

        [HttpGet("commentReactions/{commentId}")]
        public async Task<IActionResult> GetCommentReactionsCount(Guid commentId)
        {
            var response = await _reactionService.GetCommentReactionsCountAsync(commentId);
            if (!response.Success)
            {
                return BadRequest(response.Errors);
            }
            return Ok(response);
        }
    }
}
