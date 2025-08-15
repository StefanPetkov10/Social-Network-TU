namespace SocialMedia.DTOs.Post
{
    public class UpdatePostDto
    {
        public string Content { get; set; } = null!;
        public string? MediaUrl { get; set; }
    }
}
