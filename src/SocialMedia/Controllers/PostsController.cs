using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Common;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostsController(IPostService postService)
        {
            _postService = postService;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }
            var response = await _postService.CreatePostAsPost(User, dto);
            return Ok(response);
        }

        [HttpGet("{postId}")]
        public async Task<IActionResult> GetPostById(Guid postId)
        {
            var response = await _postService.GetPostByIdAsync(postId);
            if (response.Success)
            {
                return Ok(response);
            }
            return NotFound(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPosts()
        {
            var response = await _postService.GetAllPostsAsync();
            if (response.Success)
            {
                return Ok(response);
            }
            return NotFound(response);
        }

        [Authorize]
        [HttpPut("{postId}")]
        public async Task<IActionResult> UpdatePost(Guid postId, [FromBody] UpdatePostDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }
            var response = await _postService.UpdatePostAsync(User, postId, dto);
            if (response.Success)
            {
                return Ok(response);
            }
            return NotFound(response);
        }

        [Authorize]
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
