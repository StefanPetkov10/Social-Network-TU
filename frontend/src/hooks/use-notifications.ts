import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@frontend/services/notification-service";
import { useAuthStore } from "@frontend/stores/useAuthStore";
import { toast } from "sonner";

export const useInfiniteNotifications = (unreadOnly: boolean = false) => {
    const accessToken = useAuthStore((s) => s.accessToken);

    return useInfiniteQuery({
        queryKey: ["notifications", unreadOnly],
        queryFn: ({ pageParam = undefined }) => {
            return notificationService.getNotifications(unreadOnly, pageParam as string | undefined, 20);
        },
        getNextPageParam: (lastPageResponse) => {
            const notifications = lastPageResponse.data;
            if (!notifications || notifications.length < 20) {
                return undefined;
            }
            const lastNotification = notifications[notifications.length - 1];
            return lastNotification.updatedDate ?? lastNotification.createdDate;
        },
        initialPageParam: undefined as string | undefined,
        enabled: !!accessToken,
    });
};

export const useUnseenNotificationsCount = () => {
    const accessToken = useAuthStore((s) => s.accessToken);

    return useQuery({
        queryKey: ["notifications-unseen-count"],
        queryFn: async () => {
            const response = await notificationService.getUnseenCount();
            return response.data;
        },
        enabled: !!accessToken,
        refetchInterval: 15000,
    });
};

export const useMarkAllAsSeen = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationService.markAllAsSeen(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications-unseen-count"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: (error: any) => {
            console.error("Грешка при маркиране като видяни:", error);
        }
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unseen-count"] });
        },
        onError: (error: any) => {
            toast.error("Грешка", {
                description: error?.response?.data?.message || "Възникна проблем при отваряне на известието."
            });
        }
    });
};