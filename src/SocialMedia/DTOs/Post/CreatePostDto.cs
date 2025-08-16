namespace SocialMedia.DTOs.Post
{
    public class CreatePostDto
    {
        public string Content { get; set; } = null!;
        public string? MediaUrl { get; set; }
    }
}
