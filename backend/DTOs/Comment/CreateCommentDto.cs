namespace SocialMedia.DTOs.Comment
{
    public class CreateCommentDto
    {
        public string Content { get; set; } = null!;
        public Guid? ParentCommentId { get; set; }
        public IFormFile? File { get; set; }
    }
}
