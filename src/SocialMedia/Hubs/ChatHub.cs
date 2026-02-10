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
            if (string.IsNullOrWhiteSpace(userIdStr)) return;
            var userId = Guid.Parse(userIdStr);

            try
            {
                var messageDto = await _chatService.CreateMessageAsync(userId, content, receiverId, groupId, attachments);

                await Clients.Group(chatId).SendAsync("ReceiveMessage", messageDto);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("ErrorMessage", "Failed to send message: " + ex.Message);
            }
        }
    }
}