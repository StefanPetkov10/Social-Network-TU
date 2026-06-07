using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace SocialMedia.ImageResize.Functions
{
    public class ResizeOnUploadFunction
    {
        private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName;
        private readonly ILogger<ResizeOnUploadFunction> _logger;

        public ResizeOnUploadFunction(
            BlobServiceClient blobServiceClient,
            IConfiguration configuration,
            ILogger<ResizeOnUploadFunction> logger)
        {
            _blobServiceClient = blobServiceClient;
            _containerName = configuration["BlobContainerName"] ?? "user-uploads";
            _logger = logger;
        }

        [Function(nameof(ResizeOnUploadFunction))]
        public async Task Run(
            [BlobTrigger("user-uploads/{name}", Connection = "BlobStorageConnection")]
            Stream blobStream,
            string name)
        {
            var fileName = Path.GetFileName(name);
            var extension = Path.GetExtension(name).ToLowerInvariant();

            if (!fileName.StartsWith("full", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("Skipping (not an original): {Name}", name);
                return;
            }

            if (Array.IndexOf(ImageExtensions, extension) < 0)
            {
                _logger.LogInformation("Skipping (not an image): {Name}", name);
                return;
            }

            var folder = name.Contains('/') ? name[..name.LastIndexOf('/')] : string.Empty;
            var isAvatar = name.StartsWith("avatars", StringComparison.OrdinalIgnoreCase);

            var container = _blobServiceClient.GetBlobContainerClient(_containerName);

            using var source = new MemoryStream();
            await blobStream.CopyToAsync(source);

            if (isAvatar)
            {
                await ResizeAndUploadAsync(container, source, folder, "preview_medium.jpg", 256, 256, ResizeMode.Crop);
                await ResizeAndUploadAsync(container, source, folder, "preview_small.jpg", 64, 64, ResizeMode.Crop);
            }
            else
            {
                await ResizeAndUploadAsync(container, source, folder, "preview.jpg", 1280, 1280, ResizeMode.Max);
                await ResizeAndUploadAsync(container, source, folder, "thumb.jpg", 400, 400, ResizeMode.Max);
            }

            _logger.LogInformation("Resize complete for {Name}", name);
        }

        private async Task ResizeAndUploadAsync(
            BlobContainerClient container,
            MemoryStream source,
            string folder,
            string fileName,
            int width,
            int height,
            ResizeMode mode)
        {
            source.Position = 0;

            using var image = await Image.LoadAsync(source);
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(width, height),
                Mode = mode
            }));

            using var output = new MemoryStream();
            await image.SaveAsJpegAsync(output, new JpegEncoder { Quality = 80 });
            output.Position = 0;

            var targetPath = string.IsNullOrEmpty(folder) ? fileName : $"{folder}/{fileName}";
            await container.GetBlobClient(targetPath).UploadAsync(output, new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = "image/jpeg" }
            });

            _logger.LogInformation("Wrote {Path} ({W}x{H})", targetPath, width, height);
        }
    }
}