using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Post;

namespace SocialMedia.DTOs.Reports
{
    public class ReportedPostDto
    {
        public Guid Id { get; set; }
        
        public Guid PostId { get; set; }
        public string PostContent { get; set; }
        public string PostAuthorName { get; set; }
        
        public IEnumerable<PostMediaDto>? PostMedia { get; set; }

        public Guid ReporterId { get; set; }
        public string ReporterName { get; set; }
        
        public ReportReason ReasonType { get; set; }
        public string ReasonComment { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public bool IsResolved { get; set; }
        
        public string? AdminComment { get; set; }
        public string? ResolvedByName { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
