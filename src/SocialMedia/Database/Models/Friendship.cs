using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Database.Models
{
    public class Friendship
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey(nameof(Requester))]
        public Guid RequesterId { get; set; }
        [InverseProperty("FriendshipsRequested")]
        public Profile Requester { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(Addressee))]
        public Guid AddresseeId { get; set; }
        [InverseProperty("FriendshipsReceived")]
        public Profile Addressee { get; set; } = null!;

        [Required]
        public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;

        [Required]
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime AcceptedAt { get; set; }


    }
}
