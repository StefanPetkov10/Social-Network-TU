using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.ChatHub
{
    public class MessageReactionDto
    {
        public Guid ProfileId { get; set; }
        public string ReactorName { get; set; } = null!;
        public string? ReactorAvatar { get; set; }
        public ReactionType Type { get; set; }
    }
}
