namespace SocialMedia.Api.Services.Interfaces
{
    public interface IFileUploadService
    {
        Task<string> UploadOriginalAsync(IFormFile file, string folder, Guid targetId);

        string GetPublicUrl(string relativeOrAbsolutePath);

        Task<string?> GetOriginalFileNameAsync(string relativePath);

        Task<(Stream Content, string ContentType, string FileName)?> DownloadAsync(string relativePath);

    }
}
