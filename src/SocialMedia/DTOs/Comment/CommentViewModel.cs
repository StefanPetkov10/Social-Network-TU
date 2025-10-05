namespace SocialMedia.DTOs.Comment
{
    public class CommentViewModel
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid ProfileId { get; set; }
        public string ProfileName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public string Content { get; set; } = null!;
        public bool IsDeleted { get; set; }
        public int Depth { get; set; }
        public DateTime PostedDate { get; set; }
        public int RepliesCount { get; set; }
        public IEnumerable<CommentViewModel>? RepliesPreview { get; set; }
        public IEnumerable<CommentMediaDto> Media { get; set; } = new List<CommentMediaDto>();
    }
}
