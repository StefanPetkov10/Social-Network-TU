namespace SocialMedia.DTOs.Friendship
{
    public class FriendDto
    {
        public Guid ProfileId { get; set; }
        public string DisplayFullName { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
    }
}
