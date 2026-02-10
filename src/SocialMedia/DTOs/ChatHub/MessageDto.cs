namespace SocialMedia.DTOs.ChatHub
{
    public class MessageDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = null!;
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = null!;
        public string? SenderPhoto { get; set; }
        public DateTime SentAt { get; set; }
        public bool IsEdited { get; set; }
        public List<MessageMediaDto> Media { get; set; } = new();
        public List<object> Reactions { get; set; } = new();
    }
}
