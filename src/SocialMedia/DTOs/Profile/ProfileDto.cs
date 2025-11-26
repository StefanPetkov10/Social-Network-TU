namespace SocialMedia.DTOs.Profile
{
    public class ProfileDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public DateTime DateOfBirth { get; set; }
        public string Sex { get; set; } = null!;
        public string? AuthorAvatar { get; set; } //AuthorAvatar

        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public int FriendsCount { get; set; }

    }
}
