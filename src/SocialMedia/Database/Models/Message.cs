using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    public class Message : BaseModel
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Content { get; set; } = null!;

        [Required]
        public Guid SenderId { get; set; }
        [ForeignKey(nameof(SenderId))]
        public Profile Sender { get; set; } = null!;

        public Guid? ReceiverId { get; set; }
        [ForeignKey(nameof(ReceiverId))]
        public Profile? Receiver { get; set; }

        public Guid? GroupId { get; set; }
        [ForeignKey(nameof(GroupId))]
        public Group? Group { get; set; }

        public DateTime? EditedAt { get; set; }

        public bool IsEdited => UpdatedDate.HasValue;

        public bool IsDeleted { get; set; }

        public ICollection<MessageMedia> Media { get; set; } = new List<MessageMedia>();
        public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
        public ICollection<MessageReadReceipt> ReadReceipts { get; set; } = new List<MessageReadReceipt>();
    }
}
