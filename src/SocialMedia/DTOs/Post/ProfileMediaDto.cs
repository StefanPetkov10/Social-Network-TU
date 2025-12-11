namespace SocialMedia.DTOs.Post
{
    public class ProfileMediaDto
    {
        public List<PostMediaDto> Images { get; set; } = new();
        public List<PostMediaDto> Documents { get; set; } = new();

    }
}