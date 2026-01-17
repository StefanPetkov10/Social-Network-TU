using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Group
{
    public class MemberDto
    {
        public Guid ProfileId { get; set; }
        public string Username { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public GroupRole Role { get; set; }
        public DateTime JoinedOn { get; set; }

        public bool IsFriend { get; set; }
        public bool IsMe { get; set; }
        public int MutualFriendsCount { get; set; }

        public bool HasPendingRequest { get; set; }
    }
}
