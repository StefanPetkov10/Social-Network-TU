namespace SocialMedia.DTOs.Group
{
    public class GroupDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsPrivate { get; set; }

        public bool IsMember { get; set; }
        public bool IsAdmin { get; set; }
        public bool IsOwner { get; set; }
        public bool HasRequestedJoin { get; set; }

        public int MembersCount { get; set; }
        public List<MutualFriendDto> MutualFriends { get; set; } = new();
        public int MutualFriendsCount { get; set; }

        public bool CanViewPosts { get; set; }
        public bool CanCreatePost { get; set; }
    }
}
