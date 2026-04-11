using System.Diagnostics.CodeAnalysis;

namespace SocialMedia.DTOs.Comment
{
    public class UpdateCommentDto
    {
        public string Content { get; set; } = null!;

        [AllowNull]
        public Guid? FileToDelete { get; set; }
    }
}
