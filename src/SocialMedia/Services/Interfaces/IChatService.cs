using SocialMedia.DTOs.ChatHub;

namespace SocialMedia.Services.Interfaces
{
    public interface IChatService
    {
        Task<MessageDto> CreateMessageAsync(Guid userId,
            string content,
            Guid? receiverId,
            Guid? groupId,
            List<ChatAttachmentDto>? attachments);
        Task<List<ChatAttachmentDto>> UploadAttachmentsAsync(List<IFormFile> files);
    }
}

