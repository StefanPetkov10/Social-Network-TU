namespace SocialMedia.DTOs
{
    public class RegisterDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; } = null!;
        public int Age { get; set; }
        public string Sex { get; set; } = null!;
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
