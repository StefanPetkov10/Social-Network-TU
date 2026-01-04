namespace SocialMedia.DTOs.Follow
{
    public class FollowSuggestionDto : FollowDto
    {
        public string Reason { get; set; } = null!; // "Popular in TU", "Followed by Ivan", etc.
        public int MutualFollowersCount { get; set; }
    }
}
