namespace SocialMedia.DTOs.Follow
{
    public class FollowDto
    {
        public Guid ProfileId { get; set; }
        public string DisplayFullName { get; set; } = null!;
        public string? Username { get; set; }
        public string? AuthorAvatar { get; set; }
        public string? Bio { get; set; }

        public bool IsFollowing { get; set; }
        public bool IsFollower { get; set; }
        public bool IsFriend { get; set; }
    }
}
