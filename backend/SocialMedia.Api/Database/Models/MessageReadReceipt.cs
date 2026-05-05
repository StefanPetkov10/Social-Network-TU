using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    //[PrimaryKey(nameof(MessageId), nameof(ProfileId))]
    public class MessageReadReceipt
    {
        public Guid Id { get; set; }

        [ForeignKey(nameof(Message))]
        public Guid MessageId { get; set; }
        public Message Message { get; set; } = null!;

        [ForeignKey(nameof(Profile))]
        public Guid ProfileId { get; set; }
        public Profile Profile { get; set; } = null!;

        public DateTime ReadAt { get; set; }
    }
}
