using System.Diagnostics.CodeAnalysis;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Post
{
    public class UpdatePostDto
    {
        [AllowNull]
        public string? Content { get; set; }
        [AllowNull]
        public PostVisibility? Visibility { get; set; }
        [AllowNull]
        public List<Guid>? FilesToDelete { get; set; }
        [AllowNull]
        public List<IFormFile>? NewFiles { get; set; }
    }
}
