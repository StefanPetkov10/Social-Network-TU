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
        public int Age { get; set; }

        [Required]
        public Gender Sex { get; set; }

        [ForeignKey(nameof(User))]
        public Guid ApplicationId { get; set; }

        public ApplicationUser User { get; set; } = null!;

        public virtual string FullName { get { return $"{FirstName} {LastName}"; } }

    }
}
