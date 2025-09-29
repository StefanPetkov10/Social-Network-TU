using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Post
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = null!;

        public List<PostMediaDto> Media { get; set; } = new();

        public Guid ProfileId { get; set; }
        public string AuthorName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }

        public PostVisibility Visibility { get; set; }

        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }

        public Guid? GroupId { get; set; }
        public string? GroupName { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
