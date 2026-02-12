using System.Collections.Concurrent;
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

        private static readonly ConcurrentDictionary<string, HashSet<string>> ConnectedUsers = new();

        public ChatHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        public override async Task OnConnectedAsync()
        {
            var appIdStr = GetUserId();

            if (!string.IsNullOrEmpty(appIdStr) && Guid.TryParse(appIdStr, out var appIdGuid))
            {
                var profileId = await _chatService.GetProfileIdByAppIdAsync(appIdGuid);

                if (profileId.HasValue)
                {
                    ConnectedUsers.AddOrUpdate(appIdStr,
                        _ => new HashSet<string> { Context.ConnectionId },
                        (_, connections) =>
                        {
                            lock (connections) { connections.Add(Context.ConnectionId); }
                            return connections;
                        });

                    int count;
                    if (ConnectedUsers.TryGetValue(appIdStr, out var connections))
                    {
                        lock (connections) { count = connections.Count; }

                        if (count == 1)
                        {
                            await Clients.All.SendAsync("UserIsOnline", profileId.Value.ToString());
                        }
                    }
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var appIdStr = GetUserId();

            if (!string.IsNullOrEmpty(appIdStr) && Guid.TryParse(appIdStr, out var appIdGuid))
            {
                var profileId = await _chatService.GetProfileIdByAppIdAsync(appIdGuid);

                if (profileId.HasValue && ConnectedUsers.TryGetValue(appIdStr, out var connections))
                {
                    bool isOffline = false;
                    lock (connections)
                    {
                        connections.Remove(Context.ConnectionId);
                        if (connections.Count == 0) isOffline = true;
                    }

                    if (isOffline)
                    {
                        ConnectedUsers.TryRemove(appIdStr, out _);
                        await Clients.All.SendAsync("UserIsOffline", profileId.Value.ToString());
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task<List<string>> GetOnlineUsers()
        {
            var appIds = ConnectedUsers.Keys
                .Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();

            return await _chatService.GetProfileIdsByAppIdsAsync(appIds);
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
            var userIdStr = GetUserId();

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

        private string? GetUserId()
        {
            var userIdStr = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userIdStr))
            {
                userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }
            return userIdStr;
        }
    }
}