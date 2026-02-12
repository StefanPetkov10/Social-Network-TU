using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.DTOs.ChatHub;
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

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var response = await _chatService.GetConversationsAsync(User);

            if (response.Success) return Ok(response);
            return BadRequest(response.Message);
        }

        [HttpGet("history/{otherUserId}")]
        public async Task<IActionResult> GetChatHistory(Guid otherUserId)
        {
            var response = await _chatService.GetMessageHistoryAsync(User, otherUserId);

            if (response.Success) return Ok(response);
            return BadRequest(response.Message);
        }

        [HttpPost("upload-attachments")]
        public async Task<IActionResult> UploadAttachments([FromForm] UploadChatFilesDto dto)
        {
            try
            {
                var result = await _chatService.UploadAttachmentsAsync(dto.Files);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error uploading files: {ex.Message}");
            }
        }
    }
}
