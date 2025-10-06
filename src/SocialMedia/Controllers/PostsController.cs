using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;
        public PostsController(IPostService postService) => _postService = postService;

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var response = await _postService.CreatePostAsPost(User, dto);
            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }

        [HttpGet("{postId:guid}")]
        public async Task<IActionResult> GetPostById(Guid postId)
        {
            var response = await _postService.GetPostByIdAsync(User, postId);
            if (response.Success)
            {
                return Ok(response);
            }
            return NotFound(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetFeedPosts([FromQuery] Guid? lastPostId, [FromQuery] int take = 20)
        {
            var response = await _postService.GetFeedAsync(User, lastPostId, take);
            if (response.Success)
            {
                return Ok(response);
            }
            return NotFound(response);
        }

        [HttpGet("profile/{profileId:guid}")]
        public async Task<IActionResult> GetUserPosts(Guid profileId, [FromQuery] Guid? lastPostId, [FromQuery] int take = 20)
        {
            var response = await _postService.GetUserPostsAsync(User, profileId, lastPostId, take);
            if (response.Success)
            {
                return Ok(response);
            }
            return NotFound(response);
        }
        [HttpPut("{postId}")]
        public async Task<IActionResult> UpdatePost(Guid postId, [FromForm] UpdatePostDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();

                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }

            // Слагаме try/catch за да хванем DbUpdateConcurrencyException и други
            try
            {
                var response = await _postService.UpdatePostAsync(User, postId, dto);

                if (response.Success)
                    return Ok(response);

                // ако не е Success, може да е NotFound или Unauthorized
                if (response.Message?.Contains("not authorized", StringComparison.OrdinalIgnoreCase) == true)
                    return Forbid();

                if (response.Message?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                    return NotFound(response);

                return BadRequest(response);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                // Тук ще видиш точната причина (0 rows affected и т.н.)
                return Conflict(ApiResponse<object>.ErrorResponse("Concurrency error", new[] { ex.Message }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.ErrorResponse("Unexpected error", new[] { ex.Message }));
            }
        }

        [HttpDelete("{postId}")]
        public async Task<IActionResult> DeletePost(Guid postId)
        {
            var response = await _postService.DeletePostAsync(User, postId);
            if (response.Success)
            {
                return Ok(response);
            }
            return NotFound(response);
        }
    }
}
