using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost("upload-attachments")]
        public async Task<IActionResult> UploadAttachments([FromForm] List<IFormFile> files)
        {
            try
            {
                var result = await _chatService.UploadAttachmentsAsync(files);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error uploading files: {ex.Message}");
            }
        }
    }
}
