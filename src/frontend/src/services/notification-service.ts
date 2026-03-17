import api from "../lib/axios";
import { ApiResponse } from "@frontend/lib/types/api";
import { NotificationDto, UnseenNotificationsCountDto } from "@frontend/lib/types/notification";

export const notificationService = {
    getNotifications: async (unreadOnly: boolean = false, lastUpdatedDate?: string, take: number = 20) => {
        const params = new URLSearchParams();
        params.append("unreadOnly", unreadOnly.toString());
        params.append("take", take.toString());

        if (lastUpdatedDate) {
            params.append("lastUpdatedDate", lastUpdatedDate);
        }

        const { data } = await api.get<ApiResponse<NotificationDto[]>>('/api/Notifications', { params });
        return data;
    },

    getUnseenCount: async () => {
        const { data } = await api.get<ApiResponse<UnseenNotificationsCountDto>>('/api/Notifications/unseen-count');
        return data;
    },

    markAllAsSeen: async () => {
        const { data } = await api.put<ApiResponse<boolean>>('/api/Notifications/mark-seen');
        return data;
    },

    markAsRead: async (id: string) => {
        const { data } = await api.put<ApiResponse<boolean>>(`/api/Notifications/${id}/read`);
        return data;
    }
};