using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Notification;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class NotificationService : BaseService, INotificationService
    {
        private readonly IRepository<Notification, Guid> _notificationRepo;
        private readonly IRepository<Profile, Guid> _profileRepo;

        // Лимитът от 30 дни, за който говорихме
        private readonly DateTime _thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        public NotificationService(
            UserManager<ApplicationUser> userManager,
            IRepository<Notification, Guid> notificationRepo,
            IRepository<Profile, Guid> profileRepo) : base(userManager)
        {
            _notificationRepo = notificationRepo;
            _profileRepo = profileRepo;
        }

        public async Task<ApiResponse<IEnumerable<NotificationDto>>> GetNotificationsAsync(
            ClaimsPrincipal userClaims,
            bool unreadOnly = false,
            DateTime? lastUpdatedDate = null,
            int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<NotificationDto>>(userClaims, out var appUserId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepo.GetByApplicationIdAsync(appUserId);
            if (myProfile == null) return NotFoundResponse<IEnumerable<NotificationDto>>("Profile");

            var query = _notificationRepo.QueryNoTracking()
                .Include(n => n.TriggeredBy)
                    .ThenInclude(p => p.User)
                .Where(n => n.RecipientId == myProfile.Id)
                .Where(n => (n.UpdatedDate ?? n.CreatedDate) >= _thirtyDaysAgo);

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            if (lastUpdatedDate.HasValue)
            {
                query = query.Where(n => (n.UpdatedDate ?? n.CreatedDate) < lastUpdatedDate.Value);
            }

            var notifications = await query
                .OrderByDescending(n => n.UpdatedDate ?? n.CreatedDate)
                .Take(take)
                .ToListAsync();

            var dtos = notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                TriggeredById = n.TriggeredById,
                TriggeredByName = n.TriggeredBy.FullName ?? "Unknown",
                TriggeredByUsername = n.TriggeredBy.User.UserName!,
                TriggeredByAvatar = n.TriggeredBy.Photo,
                Type = n.Type,
                ReferenceId = n.ReferenceId,
                Count = n.Count,
                IsRead = n.IsRead,
                IsSeen = n.IsSeen,
                CreatedDate = n.CreatedDate,
                UpdatedDate = n.UpdatedDate
            }).ToList();

            return ApiResponse<IEnumerable<NotificationDto>>.SuccessResponse(dtos, "Notifications retrieved.");
        }

        public async Task<ApiResponse<UnseenNotificationsCountDto>> GetUnseenCountAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<UnseenNotificationsCountDto>(userClaims, out var appUserId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepo.GetByApplicationIdAsync(appUserId);
            if (myProfile == null) return NotFoundResponse<UnseenNotificationsCountDto>("Profile");

            var unseenCount = await _notificationRepo.QueryNoTracking()
                .CountAsync(n => n.RecipientId == myProfile.Id
                              && !n.IsSeen
                              && (n.UpdatedDate ?? n.CreatedDate) >= _thirtyDaysAgo);

            return ApiResponse<UnseenNotificationsCountDto>.SuccessResponse(new UnseenNotificationsCountDto { Count = unseenCount });
        }

        public async Task<ApiResponse<bool>> MarkAllAsSeenAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepo.GetByApplicationIdAsync(appUserId);
            if (myProfile == null) return NotFoundResponse<bool>("Profile");

            var unseenNotifications = await _notificationRepo.Query()
                .Where(n => n.RecipientId == myProfile.Id && !n.IsSeen)
                .ToListAsync();

            if (!unseenNotifications.Any())
                return ApiResponse<bool>.SuccessResponse(true, "Already seen.");

            foreach (var n in unseenNotifications)
            {
                n.IsSeen = true; 
                _notificationRepo.Update(n);
            }

            await _notificationRepo.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "All marked as seen. Badge cleared.");
        }

        public async Task<ApiResponse<bool>> MarkAsReadAsync(ClaimsPrincipal userClaims, Guid notificationId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var appUserId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var myProfile = await _profileRepo.GetByApplicationIdAsync(appUserId);
            if (myProfile == null) return NotFoundResponse<bool>("Profile");

            var notification = await _notificationRepo.GetByIdAsync(notificationId);
            if (notification == null || notification.RecipientId != myProfile.Id)
                return ApiResponse<bool>.ErrorResponse("Notification not found or unauthorized.");

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                notification.IsSeen = true; 

                await _notificationRepo.UpdateAsync(notification);
                await _notificationRepo.SaveChangesAsync();
            }

            return ApiResponse<bool>.SuccessResponse(true, "Notification marked as read.");
        }
        public async Task TriggerNotificationAsync(Guid recipientId, 
            Guid triggeredById, 
            NotificationType type, 
            Guid? referenceId = null)
        {
            if (recipientId == triggeredById) return;

            var existingNotification = await _notificationRepo.Query()
                .FirstOrDefaultAsync(n =>
                    n.RecipientId == recipientId &&
                    n.Type == type &&
                    n.ReferenceId == referenceId);

            if (existingNotification == null)
            {
                var newNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    RecipientId = recipientId,
                    TriggeredById = triggeredById,
                    Type = type,
                    ReferenceId = referenceId,
                    Count = 1,
                    IsRead = false, 
                    IsSeen = false, 
                };
                await _notificationRepo.AddAsync(newNotification);
            }
            else
            {
                existingNotification.Count++;
                existingNotification.TriggeredById = triggeredById; 

                existingNotification.IsRead = false;
                existingNotification.IsSeen = false;

                await _notificationRepo.UpdateAsync(existingNotification);
            }

            await _notificationRepo.SaveChangesAsync();
        }

        public async Task RevertNotificationAsync(Guid recipientId, 
            Guid triggeredById, 
            NotificationType type, 
            Guid? referenceId = null)
        {
            if (recipientId == triggeredById) return;

            var existingNotification = await _notificationRepo.Query()
                .FirstOrDefaultAsync(n =>
                    n.RecipientId == recipientId &&
                    n.Type == type &&
                    n.ReferenceId == referenceId);

            if (existingNotification != null)
            {
                existingNotification.Count--;

                if (existingNotification.Count <= 0)
                {
                    await _notificationRepo.DeleteAsync(existingNotification);
                }
                else
                {
                    await _notificationRepo.UpdateAsync(existingNotification);
                }

                await _notificationRepo.SaveChangesAsync();
            }
        }
    }
}