using Microsoft.AspNetCore.Identity;

namespace SocialMedia.Database.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public Profile Profile { get; set; }
    }
}
