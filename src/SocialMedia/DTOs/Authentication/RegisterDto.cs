using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Authentication
{
    public class RegisterDto
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public int BirthDay { get; set; }
        public int BirthMonth { get; set; }
        public int BirthYear { get; set; }
        public Gender Sex { get; set; }
        public string UserName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
