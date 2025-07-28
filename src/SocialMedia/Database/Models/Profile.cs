using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;

namespace SocialMedia.Database.Models
{
    public class Profile
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string FirstName { get; set; }

        public string LastName { get; set; } = null!;

        [AllowNull]
        public string Photo { get; set; }

        [Required]
        public int Age { get; set; }

        public string Sex { get; set; }

        [ForeignKey(nameof(User))]
        public Guid ApplicationId { get; set; }

        public ApplicationUser User { get; set; } = null!;

        public virtual string FullName { get { return $"{FirstName} {LastName}"; } }

    }
}
