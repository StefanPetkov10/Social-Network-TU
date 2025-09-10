using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Post
{
    public class CreatePostDto
    {
        public PostVisibility Visibility { get; set; }
        public string Content { get; set; } = null!;
        public string? MediaUrl { get; set; }
    }
}
