namespace SocialMedia.DTOs.Profile
{
    public class ProfileDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public DateTime DateOfBirth { get; set; }
        public string Sex { get; set; } = null!;
        public string? AuthorAvatar { get; set; }
        public string? Bio { get; set; }

        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public int FriendsCount { get; set; }

        public bool IsFollowed { get; set; }

        public int FriendshipStatus { get; set; } = -1;

        public bool IsFriendRequestSender { get; set; }

        public Guid? FriendshipRequestId { get; set; }
    }
}
