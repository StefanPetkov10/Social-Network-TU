using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    public class SavedPosts
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ProfileId { get; set; }

        [ForeignKey(nameof(ProfileId))]
        public Profile Profile { get; set; } = null!;

        [Required]
        public Guid PostId { get; set; }

        [ForeignKey(nameof(PostId))]
        public Post Post { get; set; } = null!;

        [Required]
        public DateTime SavedAt { get; set; }

        [MaxLength(50)]
        public string? CollectionName { get; set; }

    }
}
