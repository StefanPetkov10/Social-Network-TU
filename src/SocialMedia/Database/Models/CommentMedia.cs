using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Database.Models
{
    public class CommentMedia
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid CommentId { get; set; }
        [ForeignKey(nameof(CommentId))]
        public Comment Comment { get; set; } = null!;

        [Required]
        public string FilePath { get; set; } = null!;

        [Required]
        public MediaType MediaType { get; set; }
    }

}
