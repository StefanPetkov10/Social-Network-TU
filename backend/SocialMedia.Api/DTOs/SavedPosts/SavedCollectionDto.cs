namespace SocialMedia.DTOs.SavedPosts
{
    public class SavedCollectionDto
    {
        public string Name { get; set; } = null!;
        public int Count { get; set; }
        public string? CoverImageUrl { get; set; }
    }
}
