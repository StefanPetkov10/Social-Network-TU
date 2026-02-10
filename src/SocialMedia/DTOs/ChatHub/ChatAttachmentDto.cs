using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.ChatHub
{
    public class ChatAttachmentDto
    {
        public string FilePath { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public MediaType MediaType { get; set; }
    }
}
