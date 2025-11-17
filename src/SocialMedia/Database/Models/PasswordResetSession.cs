using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    public class PasswordResetSession
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string OtpHash { get; set; } = string.Empty;

        [Required]
        public int FailedAttempts { get; set; } = 0;

        public DateTime? LockedUntil { get; set; }

        [Required]
        public DateTime ExpiresAt { get; set; }

        public DateTime LastSentAt { get; set; }

        public bool IsVerified { get; set; } = false;

        public bool IsUsed { get; set; } = false;
    }
}


