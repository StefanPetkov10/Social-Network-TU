using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    public class Follow
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey(nameof(Follower))]
        public Guid FollowerId { get; set; }
        [InverseProperty("Following")]
        public Profile Follower { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(Following))]
        public Guid FollowingId { get; set; }
        [InverseProperty("Followers")]
        public Profile Following { get; set; } = null!;

    }
}
