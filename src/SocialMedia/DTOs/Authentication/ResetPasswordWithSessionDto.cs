namespace SocialMedia.DTOs.Authentication
{
    public class ResetPasswordWithSessionDto
    {
        public string? SessionToken { get; set; }
        public string? NewPassword { get; set; }
        public string? ConfirmNewPassword { get; set; }
    }
}
