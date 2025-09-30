using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Group
{
    public class CreateGroupDto
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public GroupPrivacy GroupPrivacy { get; set; } //TODO Fix
    }
}
