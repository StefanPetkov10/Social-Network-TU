using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;

namespace SocialMedia.Database.Models
{
    public class Group
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        [AllowNull]
        public string? Description { get; set; }

        [Required]
        public bool IsPrivate { get; set; }

        [ForeignKey(nameof(Owner))]
        public Guid OwnerId { get; set; }
        public Profile Owner { get; set; } = null!;

        public ICollection<GroupMembership> Members { get; set; } = new List<GroupMembership>();
        public ICollection<Post> Posts { get; set; } = new List<Post>();
    }
}
