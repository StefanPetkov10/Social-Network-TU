namespace SocialMedia.DTOs.Post
{
    public class CreatePostDto
    {
        public Guid AuthorId { get; set; }
        public string Content { get; set; } = null!;
        public string? MediaUrl { get; set; }
    }
}
