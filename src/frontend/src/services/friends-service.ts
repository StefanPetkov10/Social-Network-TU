import api from "../lib/axios";
import { FriendRequest, FriendSuggestion } from "@frontend/lib/types/friends";
import { ApiResponse } from "@frontend/lib/types/api";

export const friendsService = {
    getFriendRequests: async () => {
        const { data } = await api.get<ApiResponse<FriendRequest[]>>("/api/Friendship/pending-requests");
        return data;
    },

    getFriendSuggestions: async (skip: number = 0, take: number = 20) => {
        const { data } = await api.get<ApiResponse<FriendSuggestion[]>>(`/api/Friendship/suggestions?skip=${skip}&take=${take}`);
        return data;
    },

    sendFriendRequest: async (addresseeId: string) => {
        const { data } = await api.post<ApiResponse<null>>(`/api/Friendship/send-request/${addresseeId}`);
        return data;
    },

    acceptFriendRequest: async (pendingRequestId: string) => {
        const { data } = await api.post<ApiResponse<null>>(`/api/Friendship/accept-request/${pendingRequestId}`);
        return data;
    },

    declineFriendRequest: async (pendingRequestId: string) => {
        const { data } = await api.delete<ApiResponse<null>>(`/api/Friendship/decline/${pendingRequestId}`);
        return data;
    }
};