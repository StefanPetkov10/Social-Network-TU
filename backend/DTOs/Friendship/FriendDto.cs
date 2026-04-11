namespace SocialMedia.DTOs.Friendship
{
    public class FriendDto
    {
        public Guid ProfileId { get; set; }
        public string DisplayFullName { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? AuthorAvatar { get; set; }

        public bool IsMe { get; set; }
        public bool IsFriend { get; set; }
        public bool HasSentRequest { get; set; }
        public bool HasReceivedRequest { get; set; }
        public Guid? PendingRequestId { get; set; }

        public int MutualFriendsCount { get; set; }
    }
}
