namespace SocialMedia.DTOs.Follow
{
    public class FollowDto
    {
        public Guid ProfileId { get; set; }
        public string DisplayFullName { get; set; } = null!;
        public string? UserName { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
