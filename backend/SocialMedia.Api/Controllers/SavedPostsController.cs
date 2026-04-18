using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.DTOs.SavedPosts;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SavedPostsController : ControllerBase
    {
        private readonly ISavedPostsService _savedPostsService;

        public SavedPostsController(ISavedPostsService savedPostsService)
        {
            _savedPostsService = savedPostsService;
        }

        [HttpPost]
        public async Task<IActionResult> SavePost([FromBody] SavePostRequestDto dto)
        {
            var result = await _savedPostsService.ToggleSavePostAsync(User, dto);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }

        [HttpGet("collections")]
        public async Task<IActionResult> GetCollections()
        {
            var result = await _savedPostsService.GetMyCollectionsAsync(User);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetSavedPosts(
            [FromQuery] string? collectionName,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20)
        {
            var result = await _savedPostsService.GetSavedPostsAsync(User, collectionName, skip, take);
            if (result.Success) return Ok(result);
            return NotFound(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveSavedPost(Guid id)
        {
            var result = await _savedPostsService.RemoveFromSavedAsync(User, id);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }
    }
}