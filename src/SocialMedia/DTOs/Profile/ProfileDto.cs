namespace SocialMedia.DTOs.Profile
{
    public class ProfileDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public int Age { get; set; }
        public string Sex { get; set; } = null!;
        public string? PhotoBase64 { get; set; }

    }
}
