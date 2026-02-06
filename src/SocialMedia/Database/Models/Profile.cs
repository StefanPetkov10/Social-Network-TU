using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Database.Models
{
    public class Profile : BaseModel
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string FirstName { get; set; } = null!;

        [AllowNull]
        public string? LastName { get; set; }

        [AllowNull]
        public string? Photo { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public Gender Sex { get; set; }

        public string Bio { get; set; } = string.Empty;

        [ForeignKey(nameof(User))]
        public Guid ApplicationId { get; set; }

        public ApplicationUser User { get; set; } = null!;

        public virtual string FullName { get { return $"{FirstName} {LastName}"; } }

        public ICollection<Post> Posts { get; set; } = new List<Post>();
        public ICollection<SavedPosts> SavedPosts { get; set; } = new List<SavedPosts>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();

        public ICollection<Friendship> FriendshipsRequested { get; set; } = new List<Friendship>();
        public ICollection<Friendship> FriendshipsReceived { get; set; } = new List<Friendship>();

        public ICollection<Follow> Followers { get; set; } = new List<Follow>();
        public ICollection<Follow> Following { get; set; } = new List<Follow>();

        public ICollection<Group> GroupsOwned { get; set; } = new List<Group>();
        public ICollection<GroupMembership> GroupMemberships { get; set; } = new List<GroupMembership>();

    }
}
