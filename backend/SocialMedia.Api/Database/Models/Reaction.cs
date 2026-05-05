using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Database.Models
{
    public class Reaction
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public ReactionType Type { get; set; }

        [Required]
        public Guid ProfileId { get; set; }
        [ForeignKey(nameof(ProfileId))]
        public Profile Profile { get; set; } = null!;

        public Guid? PostId { get; set; }
        [ForeignKey(nameof(PostId))]
        public Post? Post { get; set; }

        public Guid? CommentId { get; set; }
        [ForeignKey(nameof(CommentId))]
        public Comment? Comment { get; set; }

        public Guid? MessageId { get; set; }
        [ForeignKey(nameof(MessageId))]
        public Message? Message { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }
    }

}
