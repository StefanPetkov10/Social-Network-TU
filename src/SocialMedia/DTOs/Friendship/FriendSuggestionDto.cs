namespace SocialMedia.DTOs.Friendship
{
    public class FriendSuggestionDto
    {
        public Guid ProfileId { get; set; }
        public string DisplayFullName { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public int MutualFriendsCount { get; set; }
    }
}
