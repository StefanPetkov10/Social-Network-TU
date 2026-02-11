namespace SocialMedia.DTOs.ChatHub
{
    public class ChatConversationDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastMessageTime { get; set; }
        public bool IsGroup { get; set; }
        public int UnreadCount { get; set; }
    }
}
