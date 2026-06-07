using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Post
{
    public class PostMediaDto
    {
        public Guid Id { get; set; }

        public string Url { get; set; } = null!;

        public string? PreviewUrl { get; set; }

        public string? ThumbnailUrl { get; set; }

        public MediaType MediaType { get; set; }

        public string FileName { get; set; } = null!;

        public int Order { get; set; }
    }
}