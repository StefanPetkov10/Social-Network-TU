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
        [MaxLength(128)]
        public string? SessionTokenHash { get; set; }

        [Required]
        public string? EncodedIdentityToken { get; set; }

        [Required]
        public bool IsVerified { get; set; } = false;
        public bool IsUsed { get; set; } = false;

        public DateTime ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}


