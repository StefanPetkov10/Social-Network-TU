namespace SocialMedia.DTOs.Friendship
{
    public class PendingFriendDto
    {
        public Guid PendingRequestId { get; set; }
        public Guid ProfileId { get; set; }
        public string DisplayFullName { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
    }
}
