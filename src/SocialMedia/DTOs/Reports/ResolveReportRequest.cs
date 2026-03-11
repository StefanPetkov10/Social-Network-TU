using System.ComponentModel.DataAnnotations;

namespace SocialMedia.DTOs.Reports
{
    public class ResolveReportRequest
    {
        public bool DeletePost { get; set; }
        
        [MaxLength(500)]
        public string? AdminComment { get; set; }
    }
}
