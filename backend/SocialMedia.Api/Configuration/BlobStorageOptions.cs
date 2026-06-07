namespace SocialMedia.Api.Configuration
{
    public class BlobStorageOptions
    {
        public const string SectionName = "BlobStorage";
 
        public string BaseUrl { get; set; } = string.Empty;
 
        public string ContainerName { get; set; } = "user-uploads";
 
        public string PostsFolder { get; set; } = "posts";
 
        public string AvatarsFolder { get; set; } = "avatars";
    }
}
