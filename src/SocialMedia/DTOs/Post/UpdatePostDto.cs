using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Post
{
    public class UpdatePostDto
    {
        public string? Content { get; set; }
        public PostVisibility? Visibility { get; set; }
        public List<Guid>? FilesToDelete { get; set; }
        public List<IFormFile>? NewFiles { get; set; }
    }
}
