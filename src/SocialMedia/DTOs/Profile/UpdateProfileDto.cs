using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Profile
{
    public class UpdateProfileDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public int Age { get; set; }
        public Gender Sex { get; set; }
        public string? PhotoBase64 { get; set; }
    }
}
