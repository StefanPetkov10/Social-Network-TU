using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Notification
{
    public class NotificationDto
    {
        public Guid Id { get; set; }

        public Guid TriggeredById { get; set; }
        public string TriggeredByName { get; set; } = null!;
        public string TriggeredByUsername { get; set; } = null!;
        public string? TriggeredByAvatar { get; set; }

        public NotificationType Type { get; set; }

        public Guid? ReferenceId { get; set; }

        public int Count { get; set; }

        public bool IsRead { get; set; } 
        public bool IsSeen { get; set; } 

        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}
