namespace SocialMedia.DTOs.Friendship
{
    public class FriendDto
    {
        public Guid ProfileId { get; set; }
        public string DisplayFullName { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
    }
}
