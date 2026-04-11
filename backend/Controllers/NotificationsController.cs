using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] bool unreadOnly = false,
            [FromQuery] DateTime? lastUpdatedDate = null,
            [FromQuery] int take = 20)
        {
            var response = await _notificationService.GetNotificationsAsync(User, unreadOnly, lastUpdatedDate, take);
            if (response.Success) return Ok(response);
            return BadRequest(response);
        }

        [HttpGet("unseen-count")]
        public async Task<IActionResult> GetUnseenCount()
        {
            var response = await _notificationService.GetUnseenCountAsync(User);
            if (response.Success) return Ok(response);
            return BadRequest(response);
        }

        [HttpPut("mark-seen")]
        public async Task<IActionResult> MarkAllAsSeen()
        {
            var response = await _notificationService.MarkAllAsSeenAsync(User);
            if (response.Success) return Ok(response);
            return BadRequest(response);
        }

        [HttpPut("{id:guid}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var response = await _notificationService.MarkAsReadAsync(User, id);
            if (response.Success) return Ok(response);
            return BadRequest(response);
        }
    }
}