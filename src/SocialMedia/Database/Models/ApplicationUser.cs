using Microsoft.AspNetCore.Identity;

namespace SocialMedia.Database.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
    }
}
