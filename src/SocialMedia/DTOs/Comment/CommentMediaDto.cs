using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Comment
{
    public class CommentMediaDto
    {
        public Guid Id { get; set; }
        public string Url { get; set; } = null!;
        public string FileName { get; set; } = null!;

        public MediaType MediaType { get; set; }
    }
}
