using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Database.Models
{
    public class ReportedPost
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid PostId { get; set; }

        [ForeignKey("PostId")]
        public virtual Post Post { get; set; }

        [Required]
        public Guid ReporterId { get; set; }

        [ForeignKey("ReporterId")]
        public virtual Profile Reporter { get; set; }

        [Required]
        public ReportReason ReasonType { get; set; }

        [Required]
        public string ReasonComment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsResolved { get; set; } = false;
        
        public string? AdminComment { get; set; }
        
        public Guid? ResolvedById { get; set; }
        
        [ForeignKey("ResolvedById")]
        public virtual Profile? ResolvedBy { get; set; }
        
        public DateTime? ResolvedAt { get; set; }
    }
}
