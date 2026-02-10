using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Database.Models
{
    public class MessageMedia
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid MessageId { get; set; }
        [ForeignKey(nameof(MessageId))]
        public Message Message { get; set; } = null!;

        [Required]
        public string FilePath { get; set; } = null!;

        [Required]
        public string FileName { get; set; } = null!;

        [Required]
        public MediaType MediaType { get; set; }

        public int Order { get; set; }
    }
}
