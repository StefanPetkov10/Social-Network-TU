using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Comment
{
    public class CommentMediaDto
    {
        public Guid Id { get; set; }
        public string FilePath { get; set; } = null!;
        public MediaType MediaType { get; set; }
    }
}
