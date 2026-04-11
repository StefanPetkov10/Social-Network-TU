using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.ChatHub;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly IReactionService _reactionService;

        private static readonly ConcurrentDictionary<string, HashSet<string>> ConnectedUsers = new();

        public ChatHub(IChatService chatService,
                        IReactionService reactionService)
        {
            _chatService = chatService;
            _reactionService = reactionService;
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
                    if (groupId.HasValue)
                    {
                        var memberIds = await _chatService.GetGroupMemberIdsAsync(groupId.Value);
                        await Clients.Users(memberIds).SendAsync("ReceiveMessage", response.Data);
                    }
                    else
                    {
                        await Clients.Group(chatId).SendAsync("ReceiveMessage", response.Data);
                    }
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

        public async Task MarkChatAsRead(Guid chatId, bool isGroup)
        {
            try
            {
                var response = await _chatService.MarkMessagesAsReadAsync(Context.User!, chatId, isGroup);

                if (response.Success && response.Data != null && response.Data.Any())
                {
                    var currentAppId = GetUserId();
                    if (currentAppId != null && Guid.TryParse(currentAppId, out var appIdGuid))
                    {
                        var currentProfileId = await _chatService.GetProfileIdByAppIdAsync(appIdGuid);

                        if (isGroup)
                        {
                            var memberIds = await _chatService.GetGroupMemberIdsAsync(chatId);

                            await Clients.Users(memberIds)
                                .SendAsync("MessagesMarkedAsRead", currentProfileId, response.Data, chatId);
                        }
                        else
                        {
                            await Clients.Group(chatId.ToString())
                                .SendAsync("MessagesMarkedAsRead", currentProfileId, response.Data, currentProfileId);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("ErrorMessage", "Failed to mark messages as read: " + ex.Message);
            }
        }

        public async Task EditMessage(Guid messageId, string newContent)
        {
            try
            {
                var response = await _chatService.EditMessageAsync(Context.User!, messageId, newContent);

                if (response.Success)
                {
                    await BroadcastMessageUpdate(response.Data, "MessageEdited");
                }
                else
                {
                    await Clients.Caller.SendAsync("ErrorMessage", response.Message);
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("ErrorMessage", "Failed to edit message: " + ex.Message);
            }
        }

        public async Task DeleteMessage(Guid messageId)
        {
            try
            {
                var response = await _chatService.DeleteMessageAsync(Context.User!, messageId);

                if (response.Success)
                {
                    await BroadcastMessageUpdate(response.Data, "MessageDeleted");
                }
                else
                {
                    await Clients.Caller.SendAsync("ErrorMessage", response.Message);
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("ErrorMessage", "Failed to delete message: " + ex.Message);
            }
        }

        public async Task ReactToMessage(Guid messageId, ReactionType type)
        {
            try
            {
                var response = await _reactionService.ReactToMessageAsync(Context.User!, messageId, type);

                if (response.Success)
                {
                    var messageResponse = await _chatService.GetMessageByIdAsync(messageId);

                    if (messageResponse.Success)
                    {
                        await BroadcastMessageUpdate(messageResponse.Data, "MessageEdited");
                    }
                }
                else
                {
                    await Clients.Caller.SendAsync("ErrorMessage", response.Message);
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("ErrorMessage", "Failed to react to message: " + ex.Message);
            }
        }
        private async Task BroadcastMessageUpdate(MessageDto message, string eventName)
        {
            if (message.GroupId.HasValue)
            {
                var memberIds = await _chatService.GetGroupMemberIdsAsync(message.GroupId.Value);
                await Clients.Users(memberIds).SendAsync(eventName, message);
            }
            else
            {
                var senderAppId = GetUserId();
                if (senderAppId != null)
                    await Clients.User(senderAppId).SendAsync(eventName, message);

                await Clients.Group(message.SenderId.ToString()).SendAsync(eventName, message);
                await Clients.Group(message.ReceiverId.ToString()).SendAsync(eventName, message);
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