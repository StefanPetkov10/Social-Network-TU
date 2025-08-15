using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    public class Post : BaseModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Content { get; set; } = null!;

        public string? MediaUrl { get; set; }

        [Required]
        public Guid ProfileId { get; set; }

        [ForeignKey(nameof(ProfileId))]
        public Profile Profile { get; set; }

        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }

        public bool IsDeleted { get; set; }
    }
}