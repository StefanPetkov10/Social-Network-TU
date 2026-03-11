using System.ComponentModel.DataAnnotations;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Reports
{
    public class ReportPostRequest
    {
        [Required]
        public ReportReason ReasonType { get; set; }

        [Required]
        [MaxLength(500)]
        public string ReasonComment { get; set; }
    }
}
