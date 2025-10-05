using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;

namespace SocialMedia.Database.Models
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

        [AllowNull]
        public Guid? ParentCommentId { get; set; }

        [ForeignKey(nameof(ParentCommentId))]
        public Comment? ParentComment { get; set; }

        public ICollection<Comment> Replies { get; set; } = new List<Comment>();

        public bool IsDeleted { get; set; }

        public int Depth { get; set; }

        public ICollection<CommentMedia> Media { get; set; } = new List<CommentMedia>();
    }

}
