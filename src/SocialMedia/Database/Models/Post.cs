using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Database.Models
{
    public class Post : BaseModel
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Content { get; set; } = null!;

        public ICollection<PostMedia>? Media { get; set; } = new List<PostMedia>();

        [Required]
        public Guid ProfileId { get; set; }
        [ForeignKey(nameof(ProfileId))]
        public Profile Profile { get; set; } = null!;

        public PostVisibility Visibility { get; set; }

        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }

        public bool IsDeleted { get; set; }

        [ForeignKey(nameof(GroupId))]
        public Guid? GroupId { get; set; }
        public Group? Group { get; set; }

        public ICollection<Comment> Comments { get; set; } = new List<Comment>();

        public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    }
}