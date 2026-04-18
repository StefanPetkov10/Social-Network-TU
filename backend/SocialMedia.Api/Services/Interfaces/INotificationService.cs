using SocialMedia.Common;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Notification;
using System.Security.Claims;

namespace SocialMedia.Services.Interfaces
{
    public interface INotificationService
    {
        Task<ApiResponse<IEnumerable<NotificationDto>>> GetNotificationsAsync(
            ClaimsPrincipal userClaims,
            bool unreadOnly = false,
            DateTime? lastUpdatedDate = null,
            int take = 20);

        Task<ApiResponse<UnseenNotificationsCountDto>> GetUnseenCountAsync(ClaimsPrincipal userClaims);
        Task<ApiResponse<bool>> MarkAllAsSeenAsync(ClaimsPrincipal userClaims);
        Task<ApiResponse<bool>> MarkAsReadAsync(ClaimsPrincipal userClaims, Guid notificationId);

        Task TriggerNotificationAsync(Guid recipientId, Guid triggeredById, NotificationType type, Guid? referenceId = null);
        Task RevertNotificationAsync(Guid recipientId, Guid triggeredById, NotificationType type, Guid? referenceId = null);
    }
}
