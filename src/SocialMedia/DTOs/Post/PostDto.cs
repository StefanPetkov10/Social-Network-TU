namespace SocialMedia.DTOs.Post
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public string AuthorName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public string Content { get; set; } = null!;
        public string? MediaUrl { get; set; }
        public DateTime CreatedDate { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
    }
}
