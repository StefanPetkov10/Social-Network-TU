using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Post
{
    public class UpdatePostDto
    {
        public PostVisibility Visibility { get; set; }
        public string Content { get; set; } = null!;
        public string? MediaUrl { get; set; }
    }
}
