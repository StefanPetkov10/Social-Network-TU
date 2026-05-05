using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Services.Interfaces
{
    public interface IFileService
    {
        public Task<(string filePath, MediaType mediaType)> SaveFileAsync(IFormFile file);
    }
}
