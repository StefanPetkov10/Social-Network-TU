namespace SocialMedia.Api.Services.Interfaces
{
    public interface IFileUploadService
    {
        Task<string> UploadFileAsync(IFormFile file, string folderName = "");
    }
}
