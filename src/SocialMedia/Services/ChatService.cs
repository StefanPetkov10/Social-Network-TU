using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.ChatHub;
using SocialMedia.Services.Interfaces;
using MediaType = SocialMedia.Database.Models.Enums.MediaType;

namespace SocialMedia.Services
{
    public class ChatService : BaseService, IChatService
    {
        private readonly IRepository<Message, Guid> _messageRepository;
        private readonly IRepository<MessageMedia, Guid> _mediaRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;
        private readonly IFileService _fileService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ChatService(UserManager<ApplicationUser> userManager,
            IRepository<Message, Guid> messageRepository,
            IRepository<MessageMedia, Guid> mediaRepository,
            IRepository<Profile, Guid> profileRepository,
            IFileService fileService,
            IHttpContextAccessor httpContextAccessor)
            : base(userManager)
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

        public async Task<ApiResponse<MessageDto>> CreateMessageAsync(ClaimsPrincipal userClaims,
            string content,
            Guid? receiverId,
            Guid? groupId,
            List<ChatAttachmentDto>? attachments)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<MessageDto>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var senderProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (senderProfile == null) return ApiResponse<MessageDto>.ErrorResponse("Profile not found.");

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

            var responseDto = new MessageDto
            {
                Id = message.Id,
                Content = message.Content,
                SenderId = message.SenderId,
                SenderName = $"{senderProfile.FirstName} {senderProfile.LastName}",
                SenderPhoto = senderProfile.Photo,
                ReceiverId = message.ReceiverId ?? Guid.Empty,
                SentAt = message.CreatedDate,
                IsEdited = false,
                Media = mediaDtos
            };

            return ApiResponse<MessageDto>.SuccessResponse(responseDto, "Message sent.");
        }

        public async Task<ApiResponse<IEnumerable<ChatConversationDto>>> GetConversationsAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<ChatConversationDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null) return ApiResponse<IEnumerable<ChatConversationDto>>.ErrorResponse("Invalid user profile.");

            var allMessages = await _messageRepository.QueryNoTracking()
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => (m.SenderId == viewerProfile.Id || m.ReceiverId == viewerProfile.Id) && !m.IsDeleted)
                .OrderByDescending(m => m.CreatedDate)
                .ToListAsync();

            var conversations = allMessages
                .GroupBy(m => m.SenderId == viewerProfile.Id ? m.ReceiverId : m.SenderId)
                .Select(g =>
                {
                    var lastMsg = g.First();
                    var otherUser = lastMsg.SenderId == viewerProfile.Id ? lastMsg.Receiver : lastMsg.Sender;

                    if (otherUser == null) return null;

                    return new ChatConversationDto
                    {
                        Id = otherUser.Id,
                        Name = $"{otherUser.FirstName} {otherUser.LastName}",
                        AuthorAvatar = otherUser.Photo,
                        LastMessage = lastMsg.Content,
                        LastMessageTime = lastMsg.CreatedDate,
                        IsGroup = false,
                        UnreadCount = g.Count(m => !m.IsRead && m.ReceiverId == viewerProfile.Id)
                    };
                })
                .Where(x => x != null)
                .ToList();

            return ApiResponse<IEnumerable<ChatConversationDto>>.SuccessResponse(conversations!, "Conversations retrieved.");
        }

        public async Task<ApiResponse<IEnumerable<MessageDto>>> GetMessageHistoryAsync(ClaimsPrincipal userClaims, Guid otherUserId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<MessageDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null) return ApiResponse<IEnumerable<MessageDto>>.ErrorResponse("Invalid user profile.");

            var baseUrl = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}";

            var messages = await _messageRepository.QueryNoTracking()
                .Include(m => m.Sender)
                .Include(m => m.Media)
                .Where(m => !m.IsDeleted &&
                    ((m.SenderId == viewerProfile.Id && m.ReceiverId == otherUserId) ||
                     (m.SenderId == otherUserId && m.ReceiverId == viewerProfile.Id)))
                .OrderBy(m => m.CreatedDate)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    Content = m.Content,
                    SenderId = m.SenderId,
                    SenderName = $"{m.Sender.FirstName} {m.Sender.LastName}",
                    SenderPhoto = m.Sender.Photo,
                    ReceiverId = m.ReceiverId ?? Guid.Empty,
                    SentAt = m.CreatedDate,
                    IsEdited = false,
                    Media = m.Media.Select(media => new MessageMediaDto
                    {
                        Id = media.Id,
                        Url = $"{baseUrl}/{media.FilePath}",
                        FileName = media.FileName,
                        MediaType = media.MediaType,
                        Order = media.Order
                    }).ToList()
                })
                .ToListAsync();

            return ApiResponse<IEnumerable<MessageDto>>.SuccessResponse(messages, "History retrieved.");
        }
    }
}