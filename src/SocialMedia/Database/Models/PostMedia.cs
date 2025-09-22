using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    public class PostMedia
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid PostId { get; set; }
        [ForeignKey(nameof(PostId))]
        public Post Post { get; set; } = null!;

        [Required]
        public string Url { get; set; } = null!;

        public string? MediaType { get; set; } // image, video, etc.
        public int SortOrder { get; set; }
    }
}
