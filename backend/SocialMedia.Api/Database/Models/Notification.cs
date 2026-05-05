using SocialMedia.Database.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    public class Notification : BaseModel
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid RecipientId { get; set; }

        [ForeignKey(nameof(RecipientId))]
        [InverseProperty(nameof(Profile.NotificationsReceived))]
        public Profile Recipient { get; set; } = null!;

        [Required]
        public Guid TriggeredById { get; set; }

        [ForeignKey(nameof(TriggeredById))]
        [InverseProperty(nameof(Profile.NotificationsTriggered))]
        public Profile TriggeredBy { get; set; } = null!;

        [Required]
        public NotificationType Type { get; set; }

        public Guid? ReferenceId { get; set; }

        [Required]
        public int Count { get; set; } = 1;

        [Required]
        public bool IsRead { get; set; } = false;

        [Required]
        public bool IsSeen { get; set; } = false;
    }
}

