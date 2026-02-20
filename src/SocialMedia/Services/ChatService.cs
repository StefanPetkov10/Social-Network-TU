using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
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
        private readonly IRepository<GroupMembership, Guid> _groupMembershipRepository;
        private readonly IFileService _fileService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ChatService(UserManager<ApplicationUser> userManager,
            IRepository<Message, Guid> messageRepository,
            IRepository<MessageMedia, Guid> mediaRepository,
            IRepository<Profile, Guid> profileRepository,
            IRepository<GroupMembership, Guid> groupMembershipRepository,
            IFileService fileService,
            IHttpContextAccessor httpContextAccessor)
            : base(userManager)
        {
            _messageRepository = messageRepository;
            _mediaRepository = mediaRepository;
            _profileRepository = profileRepository;
            _groupMembershipRepository = groupMembershipRepository;
            _fileService = fileService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ChatAttachmentDto>> UploadAttachmentsAsync(List<IFormFile>? files)
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
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow
            };

            await _messageRepository.AddAsync(message);

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
                    message.Media.Add(mediaEntity);
                }
            }

            await _messageRepository.SaveChangesAsync();

            message.Sender = senderProfile;

            var responseDto = await MapMessageToDto(message);

            return ApiResponse<MessageDto>.SuccessResponse(responseDto, "Message sent.");
        }

        public async Task<List<string>> GetGroupMemberIdsAsync(Guid groupId)
        {
            return await _groupMembershipRepository.QueryNoTracking()
                .Include(gm => gm.Profile)
                .Where(gm => gm.GroupId == groupId && gm.Status == MembershipStatus.Approved)
                .Select(gm => gm.Profile.ApplicationId.ToString())
                .ToListAsync();
        }

        public async Task<ApiResponse<IEnumerable<ChatConversationDto>>> GetConversationsAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<ChatConversationDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var viewerProfile = await _profileRepository.QueryNoTracking()
                .Include(p => p.GroupMemberships)
                .ThenInclude(gm => gm.Group)
                .FirstOrDefaultAsync(p => p.ApplicationId == userId);

            if (viewerProfile == null) return ApiResponse<IEnumerable<ChatConversationDto>>.ErrorResponse("Invalid user profile.");

            var myGroupIds = viewerProfile.GroupMemberships
                .Where(gm => gm.Status == MembershipStatus.Approved)
                .Select(gm => gm.GroupId)
                .ToList();

            var allMessages = await _messageRepository.QueryNoTracking()
                .Include(m => m.Sender)
                .Include(m => m.Group)
                .Include(m => m.Receiver)
                .Include(m => m.ReadReceipts)
                .Where(m => !m.IsDeleted && (
                    (m.SenderId == viewerProfile.Id || m.ReceiverId == viewerProfile.Id)
                    ||
                    (m.GroupId.HasValue && myGroupIds.Contains(m.GroupId.Value))
                ))
                .OrderByDescending(m => m.CreatedDate)
                .ToListAsync();

            var conversations = allMessages
                .GroupBy(m =>
                {
                    if (m.GroupId.HasValue) return m.GroupId.Value;
                    return m.SenderId == viewerProfile.Id ? m.ReceiverId! : m.SenderId;
                })
                .Select(g =>
                {
                    var lastMsg = g.First();

                    string lastMsgContent = lastMsg.IsDeleted ? "Message deleted" : lastMsg.Content;

                    string name;
                    string? avatar;
                    bool isGroup;
                    Guid id;

                    if (lastMsg.GroupId.HasValue)
                    {
                        id = lastMsg.GroupId.Value;
                        isGroup = true;
                        name = lastMsg.Group?.Name ?? "Unknown Group";
                        avatar = null;
                    }
                    else
                    {
                        var otherUser = lastMsg.SenderId == viewerProfile.Id ? lastMsg.Receiver : lastMsg.Sender;
                        if (otherUser == null) return null;

                        id = otherUser.Id;
                        isGroup = false;
                        name = $"{otherUser.FirstName} {otherUser.LastName}";
                        avatar = otherUser.Photo;
                    }

                    return new ChatConversationDto
                    {
                        Id = id,
                        Name = name,
                        AuthorAvatar = avatar,
                        LastMessage = lastMsgContent,
                        LastMessageTime = lastMsg.CreatedDate,
                        IsGroup = isGroup,
                        UnreadCount = g.Count(m =>
                            m.SenderId != viewerProfile.Id &&
                            !m.ReadReceipts.Any(r => r.ProfileId == viewerProfile.Id))
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

            var messages = await _messageRepository.QueryNoTracking()
                .Include(m => m.Sender)
                .Include(m => m.Media)
                .Include(m => m.Reactions)
                .Include(m => m.ReadReceipts)
                    .ThenInclude(m => m.Profile)
                .Where(m =>
                    ((m.SenderId == viewerProfile.Id && m.ReceiverId == otherUserId) ||
                     (m.SenderId == otherUserId && m.ReceiverId == viewerProfile.Id)) ||
                     (m.GroupId == otherUserId))
                .OrderBy(m => m.CreatedDate)
                .ToListAsync();

            var messageDtos = new List<MessageDto>();
            foreach (var msg in messages)
            {
                messageDtos.Add(await MapMessageToDto(msg));
            }

            return ApiResponse<IEnumerable<MessageDto>>.SuccessResponse(messageDtos, "History retrieved.");
        }

        public async Task<ApiResponse<MessageDto>> GetMessageByIdAsync(Guid messageId)
        {
            var msg = await _messageRepository.QueryNoTracking()
                .Include(m => m.Sender)
                .Include(m => m.Media)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.Profile)
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (msg == null) return ApiResponse<MessageDto>.ErrorResponse("Message not found");

            return ApiResponse<MessageDto>.SuccessResponse(await MapMessageToDto(msg));
        }

        public async Task<ApiResponse<List<Guid>>> MarkMessagesAsReadAsync(ClaimsPrincipal userClaims, Guid chatId, bool isGroup)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<List<Guid>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var viewerProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (viewerProfile == null) return ApiResponse<List<Guid>>.ErrorResponse("Invalid user profile.");

            var query = _messageRepository.Query()
                .Include(m => m.ReadReceipts)
                .Where(m => m.SenderId != viewerProfile.Id && !m.ReadReceipts.Any(r => r.ProfileId == viewerProfile.Id));

            if (isGroup)
            {
                query = query.Where(m => m.GroupId == chatId);
            }
            else
            {
                query = query.Where(m => m.SenderId == chatId && m.ReceiverId == viewerProfile.Id);
            }

            var unreadMessages = await query.ToListAsync();

            if (!unreadMessages.Any())
            {
                return ApiResponse<List<Guid>>.SuccessResponse(new List<Guid>(), "No new messages to mark.");
            }

            var readMessageIds = new List<Guid>();

            foreach (var msg in unreadMessages)
            {
                msg.ReadReceipts.Add(new MessageReadReceipt
                {
                    MessageId = msg.Id,
                    ProfileId = viewerProfile.Id,
                    ReadAt = DateTime.UtcNow
                });
                readMessageIds.Add(msg.Id);
            }

            await _messageRepository.SaveChangesAsync();

            return ApiResponse<List<Guid>>.SuccessResponse(readMessageIds, "Messages marked as read.");
        }

        public async Task<ApiResponse<MessageDto>> EditMessageAsync(ClaimsPrincipal userClaims, Guid messageId, string newContent)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<MessageDto>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null) return ApiResponse<MessageDto>.ErrorResponse("Invalid user profile.");

            var messageToEdit = await _messageRepository.GetByIdAsync(messageId);
            if (messageToEdit == null) return ApiResponse<MessageDto>.ErrorResponse("Message not found.");

            if (messageToEdit.SenderId != profile.Id)
                return ApiResponse<MessageDto>.ErrorResponse("Unauthorized. You can only edit your own messages.");

            if (messageToEdit.IsDeleted)
                return ApiResponse<MessageDto>.ErrorResponse("Cannot edit a deleted message.");

            if (string.Equals(messageToEdit.Content, newContent))
            {
                var existingDto = await MapMessageToDto(messageToEdit);
                return ApiResponse<MessageDto>.SuccessResponse(existingDto, "No changes made.");
            }

            messageToEdit.Content = newContent;
            messageToEdit.EditedAt = DateTime.UtcNow;
            messageToEdit.UpdatedDate = DateTime.UtcNow;

            await _messageRepository.UpdateAsync(messageToEdit);
            await _messageRepository.SaveChangesAsync();

            var messageDto = await MapMessageToDto(messageToEdit);
            return ApiResponse<MessageDto>.SuccessResponse(messageDto, "Message edited.");
        }

        public async Task<ApiResponse<MessageDto>> DeleteMessageAsync(ClaimsPrincipal userClaims, Guid messageId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<MessageDto>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null) return ApiResponse<MessageDto>.ErrorResponse("Profile not found.");

            var messageToDelete = await _messageRepository.GetByIdAsync(messageId);
            if (messageToDelete == null) return ApiResponse<MessageDto>.ErrorResponse("Message not found.");

            if (messageToDelete.SenderId != profile.Id)
                return ApiResponse<MessageDto>.ErrorResponse("Unauthorized. You can only delete your own messages.");

            if (messageToDelete.IsDeleted)
                return ApiResponse<MessageDto>.ErrorResponse("Message is already deleted.");

            messageToDelete.IsDeleted = true;
            messageToDelete.UpdatedDate = DateTime.UtcNow;

            await _messageRepository.UpdateAsync(messageToDelete);
            await _messageRepository.SaveChangesAsync();

            var messageDto = await MapMessageToDto(messageToDelete);
            return ApiResponse<MessageDto>.SuccessResponse(messageDto, "Message deleted.");
        }

        public async Task<Guid?> GetProfileIdByAppIdAsync(Guid appId)
        {
            var profile = await _profileRepository.GetByApplicationIdAsync(appId);
            return profile?.Id;
        }

        public async Task<List<string>> GetProfileIdsByAppIdsAsync(List<Guid> appIds)
        {
            return await _profileRepository.QueryNoTracking()
                .Where(p => appIds.Contains(p.ApplicationId))
                .Select(p => p.Id.ToString())
                .ToListAsync();
        }

        private async Task<MessageDto> MapMessageToDto(Message m)
        {
            if (m.Sender == null)
            {
                m.Sender = await _profileRepository.GetByIdAsync(m.SenderId);
            }

            var mediaDtos = new List<MessageMediaDto>();
            string baseUrl = $"{_httpContextAccessor.HttpContext?.Request.Scheme}://{_httpContextAccessor.HttpContext?.Request.Host}";

            if (!m.IsDeleted && m.Media != null)
            {
                mediaDtos = m.Media.Select(att => new MessageMediaDto
                {
                    Id = att.Id,
                    Url = $"{baseUrl}/{att.FilePath}",
                    FileName = att.FileName,
                    MediaType = att.MediaType,
                    Order = att.Order
                }).ToList();
            }

            var reactionDtos = new List<MessageReactionDto>();
            if (!m.IsDeleted && m.Reactions != null && m.Reactions.Any())
            {
                reactionDtos = m.Reactions.Select(r => new MessageReactionDto
                {
                    ProfileId = r.ProfileId,
                    ReactorName = r.Profile?.FullName ?? "Unknown",
                    ReactorAvatar = r.Profile?.Photo,
                    Type = r.Type
                }).ToList();
            }

            return new MessageDto
            {
                Id = m.Id,
                Content = m.IsDeleted ? "This message was deleted." : m.Content,
                SenderId = m.SenderId,
                SenderName = $"{m.Sender.FirstName} {m.Sender.LastName}",
                SenderPhoto = m.Sender.Photo,
                ReceiverId = m.ReceiverId ?? Guid.Empty,
                GroupId = m.GroupId,
                ReadBy = m.ReadReceipts?.Select(r => r.ProfileId).ToList() ?? new List<Guid>(),
                SentAt = m.CreatedDate,
                IsEdited = m.EditedAt.HasValue && !m.IsDeleted,
                IsDeleted = m.IsDeleted,
                Media = mediaDtos,
                Reactions = reactionDtos
            };
        }
    }
}