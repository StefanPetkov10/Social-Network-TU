using System.Diagnostics.CodeAnalysis;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Post
{
    public class CreatePostDto
    {
        public string Content { get; set; } = null!;

        public List<IFormFile>? Files { get; set; } // images, videos, docs

        public PostVisibility Visibility { get; set; }

        [AllowNull]
        public Guid? GroupId { get; set; }
    }
}
