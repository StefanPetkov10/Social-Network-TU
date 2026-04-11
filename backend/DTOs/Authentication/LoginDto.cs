namespace SocialMedia.DTOs.Authentication
{
    public class LoginDto
    {
        public string Identifier { get; set; } = null!; // Email or username
        public string Password { get; set; } = null!;
    }
}
