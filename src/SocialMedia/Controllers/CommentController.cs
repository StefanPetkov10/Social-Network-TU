using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.DTOs.Comment;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;
        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateComment(Guid postId, [FromForm] CreateCommentDto createCommentDto)
        {
            if (ModelState.IsValid == false)
            {
                return BadRequest(ModelState);
            }

            var response = await _commentService.CreateCommentAsPost(User, postId, createCommentDto);
            if (!response.Success)
            {
                return BadRequest(response.Errors);
            }
            return Ok(response.Data);
        }

        [HttpGet("{postId}")]
        public async Task<IActionResult> GetCommentsByPostId(Guid postId, [FromQuery] Guid? lastCommentId = null, [FromQuery] int take = 20)
        {
            var response = await _commentService.GetCommentsByPostIdAsync(User, postId, lastCommentId, take);
            if (!response.Success)
            {
                return BadRequest(response.Errors);
            }
            return Ok(response.Data);
        }
    }
}
