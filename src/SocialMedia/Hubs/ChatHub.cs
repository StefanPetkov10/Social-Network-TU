using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SocialMedia.DTOs.ChatHub;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;

        public ChatHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        public async Task JoinChat(string chatId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
        }

        public async Task LeaveChat(string chatId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
        }

        public async Task SendMessage(
            string chatId,
            string content,
            Guid? receiverId,
            Guid? groupId,
            List<ChatAttachmentDto>? attachments)
        {
            var userIdStr = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userIdStr))
            {
                userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }

            if (string.IsNullOrWhiteSpace(userIdStr))
            {
                await Clients.Caller.SendAsync("ErrorMessage", "Unauthorized: User ID not found.");
                return;
            }

            try
            {
                var response = await _chatService.CreateMessageAsync(Context.User!, content, receiverId, groupId, attachments);

                if (response.Success)
                {
                    await Clients.Group(chatId).SendAsync("ReceiveMessage", response.Data);

                    await Clients.Caller.SendAsync("ReceiveMessage", response.Data);
                }
                else
                {
                    await Clients.Caller.SendAsync("ErrorMessage", response.Message);
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("ErrorMessage", "Failed to send message: " + ex.Message);
            }
        }
    }
}