using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs
{
    public class RegisterDto
    {
        public string FirstName { get; set; } = null!;
        public string? LastName { get; set; }
        public int Age { get; set; }
        public Gender Sex { get; set; }
        public string UserName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
