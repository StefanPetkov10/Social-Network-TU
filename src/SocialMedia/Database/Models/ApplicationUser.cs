using Microsoft.AspNetCore.Identity;

namespace SocialMedia.Database.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string FullName { get; set; }
    }
}
