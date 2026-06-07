using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using SocialMedia.Api.Configuration;
using SocialMedia.Api.Services.Interfaces;

namespace SocialMedia.Services
{
    public class FileUploadService : IFileUploadService
    {
        private const string OriginalFileNameKey = "OriginalFileName";

        private readonly BlobServiceClient _blobServiceClient;
        private readonly BlobStorageOptions _options;

        public FileUploadService(
            BlobServiceClient blobServiceClient,
            IOptions<BlobStorageOptions> options)
        {
            _blobServiceClient = blobServiceClient;
            _options = options.Value;
        }

        public async Task<string> UploadOriginalAsync(IFormFile file, string folder, Guid targetId)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty or null.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            var relativePath = $"{folder}/{targetId}/full{extension}";

            var containerClient = _blobServiceClient.GetBlobContainerClient(_options.ContainerName);
            await containerClient.CreateIfNotExistsAsync();

            var blobClient = containerClient.GetBlobClient(relativePath);

            var metadata = new Dictionary<string, string>
            {
                [OriginalFileNameKey] = Uri.EscapeDataString(file.FileName)
            };

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType },
                Metadata = metadata
            });

            return relativePath;
        }

        public string GetPublicUrl(string relativeOrAbsolutePath)
        {
            if (string.IsNullOrWhiteSpace(relativeOrAbsolutePath))
                return string.Empty;

            if (relativeOrAbsolutePath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                return relativeOrAbsolutePath;

            var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl)
                ? _blobServiceClient.Uri.ToString().TrimEnd('/')
                : _options.BaseUrl.TrimEnd('/');

            return $"{baseUrl}/{_options.ContainerName}/{relativeOrAbsolutePath.TrimStart('/')}";
        }

        public async Task<string?> GetOriginalFileNameAsync(string relativePath)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_options.ContainerName);
            var blobClient = containerClient.GetBlobClient(relativePath);

            if (!await blobClient.ExistsAsync())
                return null;

            var props = await blobClient.GetPropertiesAsync();
            if (props.Value.Metadata.TryGetValue(OriginalFileNameKey, out var encoded))
                return Uri.UnescapeDataString(encoded);

            return null;
        }

        public async Task<(Stream Content, string ContentType, string FileName)?> DownloadAsync(string relativePath)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_options.ContainerName);
            var blobClient = containerClient.GetBlobClient(relativePath);

            if (!await blobClient.ExistsAsync())
                return null;

            var download = await blobClient.DownloadStreamingAsync();
            var details = download.Value.Details;

            var name = details.Metadata.TryGetValue(OriginalFileNameKey, out var encoded)
                ? Uri.UnescapeDataString(encoded)
                : Path.GetFileName(relativePath);

            var contentType = string.IsNullOrEmpty(details.ContentType)
                ? "application/octet-stream"
                : details.ContentType;

            return (download.Value.Content, contentType, name);
        }
    }
}
