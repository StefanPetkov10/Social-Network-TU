using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.ChatHub;

namespace SocialMedia.Services.Interfaces
{
    public interface IChatService
    {
        Task<ApiResponse<MessageDto>> CreateMessageAsync(ClaimsPrincipal userClaims,
            string content,
            Guid? receiverId,
            Guid? groupId,
            List<ChatAttachmentDto>? attachments);

        Task<List<ChatAttachmentDto>> UploadAttachmentsAsync(List<IFormFile> files);

        Task<List<string>> GetGroupMemberIdsAsync(Guid groupId);
        Task<ApiResponse<IEnumerable<ChatConversationDto>>> GetConversationsAsync(ClaimsPrincipal userClaims);

        Task<ApiResponse<IEnumerable<MessageDto>>> GetMessageHistoryAsync(
            ClaimsPrincipal userClaims, 
            Guid otherUserId, 
            Guid? lastMessageId = null, 
            int take = 30);
        Task<ApiResponse<MessageDto>> GetMessageByIdAsync(Guid messageId);


        Task<Guid?> GetProfileIdByAppIdAsync(Guid appId);
        Task<List<string>> GetProfileIdsByAppIdsAsync(List<Guid> appIds);

        Task<ApiResponse<List<Guid>>> MarkMessagesAsReadAsync(ClaimsPrincipal userClaims, Guid chatId, bool isGroup);
        Task<ApiResponse<MessageDto>> EditMessageAsync(ClaimsPrincipal userClaims, Guid messageId, string newContent);
        Task<ApiResponse<MessageDto>> DeleteMessageAsync(ClaimsPrincipal userClaims, Guid messageId);
    }
}

