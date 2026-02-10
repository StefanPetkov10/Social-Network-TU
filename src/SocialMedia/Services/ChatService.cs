using Microsoft.EntityFrameworkCore;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.ChatHub;
using SocialMedia.Services.Interfaces;
using MediaType = SocialMedia.Database.Models.Enums.MediaType;

namespace SocialMedia.Services
{
    public class ChatService : IChatService
    {
        private readonly IRepository<Message, Guid> _messageRepository;
        private readonly IRepository<MessageMedia, Guid> _mediaRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;
        private readonly IFileService _fileService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ChatService(
            IRepository<Message, Guid> messageRepository,
            IRepository<MessageMedia, Guid> mediaRepository,
            IRepository<Profile, Guid> profileRepository,
            IFileService fileService,
            IHttpContextAccessor httpContextAccessor)
        {
            _messageRepository = messageRepository;
            _mediaRepository = mediaRepository;
            _profileRepository = profileRepository;
            _fileService = fileService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ChatAttachmentDto>> UploadAttachmentsAsync(List<IFormFile> files)
        {
            var result = new List<ChatAttachmentDto>();
            if (files == null || !files.Any()) return result;

            foreach (var file in files)
            {
                var (filePath, mediaType) = await _fileService.SaveFileAsync(file);

                if (!string.IsNullOrEmpty(filePath) && mediaType != MediaType.Other)
                {
                    result.Add(new ChatAttachmentDto
                    {
                        FilePath = filePath,
                        FileName = file.FileName,
                        MediaType = mediaType
                    });
                }
            }
            return result;
        }

        public async Task<MessageDto> CreateMessageAsync(Guid userId, string content, Guid? receiverId, Guid? groupId, List<ChatAttachmentDto>? attachments)
        {
            var senderProfile = await _profileRepository
                .QueryNoTracking()
                .FirstOrDefaultAsync(p => p.ApplicationId == userId);

            if (senderProfile == null) throw new Exception("Profile not found");

            var message = new Message
            {
                Id = Guid.NewGuid(),
                Content = content ?? "",
                SenderId = senderProfile.Id,
                ReceiverId = receiverId,
                GroupId = groupId,
                IsRead = false,
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow
            };

            await _messageRepository.AddAsync(message);

            var mediaDtos = new List<MessageMediaDto>();
            string baseUrl = $"{_httpContextAccessor.HttpContext?.Request.Scheme}://{_httpContextAccessor.HttpContext?.Request.Host}";

            if (attachments != null && attachments.Any())
            {
                int order = 0;
                foreach (var att in attachments)
                {
                    var mediaEntity = new MessageMedia
                    {
                        Id = Guid.NewGuid(),
                        MessageId = message.Id,
                        FilePath = att.FilePath,
                        FileName = att.FileName,
                        MediaType = att.MediaType,
                        Order = order++
                    };

                    await _mediaRepository.AddAsync(mediaEntity);

                    mediaDtos.Add(new MessageMediaDto
                    {
                        Id = mediaEntity.Id,
                        Url = $"{baseUrl}/{mediaEntity.FilePath}",
                        FileName = mediaEntity.FileName,
                        MediaType = mediaEntity.MediaType,
                        Order = mediaEntity.Order
                    });
                }
            }

            await _messageRepository.SaveChangesAsync();

            return new MessageDto
            {
                Id = message.Id,
                Content = message.Content,
                SenderId = message.SenderId,
                SenderName = $"{senderProfile.FirstName} {senderProfile.LastName}",
                SenderPhoto = senderProfile.Photo,
                SentAt = message.CreatedDate,
                IsEdited = false,
                Media = mediaDtos,
                Reactions = new List<object>()
            };
        }
    }
}