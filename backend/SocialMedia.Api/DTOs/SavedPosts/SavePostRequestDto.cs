namespace SocialMedia.DTOs.SavedPosts
{
    public class SavePostRequestDto
    {
        public Guid PostId { get; set; }

        public string? CollectionName { get; set; }
    }
}
