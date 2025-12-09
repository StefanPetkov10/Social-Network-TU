using SocialMedia.Database.Models.Enums;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class FileService : IFileService
    {
        private readonly string _uploadsFolder;

        public FileService(string uploadsFolder = "Uploads")
        {
            _uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), uploadsFolder);

            if (!Directory.Exists(_uploadsFolder))
                Directory.CreateDirectory(_uploadsFolder);
        }

        public async Task<(string filePath, MediaType mediaType)> SaveFileAsync(IFormFile file)
        {
            string extension = Path.GetExtension(file.FileName).ToLower();

            MediaType mediaType = GetMediaType(extension);

            if (mediaType == MediaType.Other)
            {
                return (null, MediaType.Other);
            }

            string fileName = Guid.NewGuid() + extension;
            string destPath = Path.Combine(_uploadsFolder, fileName);

            using (var stream = new FileStream(destPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return (Path.Combine("Uploads", fileName).Replace("\\", "/"), mediaType);
        }

        protected MediaType GetMediaType(string extension)
        {
            return extension switch
            {
                ".jpg" or ".jpeg" or ".png" or ".webp" => MediaType.Image,
                ".mp4" or ".avi" or ".mov" => MediaType.Video,
                ".pdf" or ".docx" or ".txt" => MediaType.Document,
                ".gif" => MediaType.Gif,
                _ => MediaType.Other
            };
        }
    }
}