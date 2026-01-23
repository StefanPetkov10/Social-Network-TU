namespace SocialMedia.DTOs.Comment
{
    public class CommentDto
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid ProfileId { get; set; }
        public string AuthorName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public string AuthorUsername { get; set; } = null!;
        public string Content { get; set; } = null!;
        public bool IsDeleted { get; set; }
        public int Depth { get; set; }
        public Guid? ParentCommentId { get; set; }
        public DateTime CreatedDate { get; set; }
        public int RepliesCount { get; set; }
        public IEnumerable<CommentDto>? RepliesPreview { get; set; }
        public CommentMediaDto? Media { get; set; }
    }
}
