using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using SocialMedia.Api.Services.Interfaces;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class FileUploadService : IFileUploadService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName = "user-uploads"; 

        public FileUploadService(BlobServiceClient blobServiceClient)
        {
            _blobServiceClient = blobServiceClient;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string folderName = "")
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty or null.");

            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);

            var uniqueFileName = $"{Guid.NewGuid()}-{Path.GetFileName(file.FileName)}";

            var blobPath = string.IsNullOrEmpty(folderName) ? uniqueFileName : $"{folderName}/{uniqueFileName}";

            var blobClient = containerClient.GetBlobClient(blobPath);

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType });

            return blobClient.Uri.ToString();
        }
    }
}