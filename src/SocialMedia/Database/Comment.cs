using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocialMedia.Database.Models;

namespace SocialMedia.Database
{
    public class Comment : BaseModel
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid PostId { get; set; }
        [ForeignKey(nameof(PostId))]
        public Post Post { get; set; } = null!;

        [Required]
        public Guid ProfileId { get; set; }
        [ForeignKey(nameof(ProfileId))]
        public Profile Profile { get; set; } = null!;

        [Required]
        public string Content { get; set; } = null!;

        public Guid? ParentCommentId { get; set; }
    }
}
