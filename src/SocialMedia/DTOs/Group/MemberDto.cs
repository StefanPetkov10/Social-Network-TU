using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Group
{
    public class MemberDto
    {
        public Guid ProfileId { get; set; }
        public string FullName { get; set; } = null!;
        public string? Photo { get; set; }
        public GroupRole Role { get; set; }
        public DateTime JoinedOn { get; set; }
    }
}
