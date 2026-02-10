using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.ChatHub
{
    public class MessageMediaDto
    {
        public Guid Id { get; set; }
        public string Url { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public MediaType MediaType { get; set; }
        public int Order { get; set; }
    }
}
