using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocialMedia.Database.Models.Enums;

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
        public string FilePath { get; set; } = null!;

        [Required]
        public string FileName { get; set; } = null!;

        [Required]
        public MediaType MediaType { get; set; }

        public int Order { get; set; }
    }
}
