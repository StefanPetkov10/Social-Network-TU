using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Post
{
    public class PostMediaDto
    {
        public Guid Id { get; set; }
        public string Url { get; set; } = null!;
        public MediaType MediaType { get; set; }
        public int Order { get; set; }
    }
}