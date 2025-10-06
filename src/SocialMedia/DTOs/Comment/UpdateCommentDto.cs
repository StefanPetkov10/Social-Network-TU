namespace SocialMedia.DTOs.Comment
{
    public class UpdateCommentDto
    {
        public string Content { get; set; }
        public Guid? FileToDelete { get; set; }
    }
}
