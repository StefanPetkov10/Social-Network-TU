namespace SocialMedia.DTOs.Authentication
{
    public class VerifyOtpDto
    {
        public string SessionToken { get; set; } = null!;
        public string? Code { get; set; }
    }
}
