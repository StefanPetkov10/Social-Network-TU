namespace SocialMedia.DTOs.Friendship
{
    public class FriendSuggestionDto
    {
        public Guid ProfileId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string AuthorAvatar { get; set; }
        public int MutualFriendsCount { get; set; }
    }
}
