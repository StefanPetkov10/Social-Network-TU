import api from "../lib/axios";
import { FriendRequest, FriendSuggestion } from "@frontend/lib/types/friends";
import { ApiResponse } from "@frontend/lib/types/api";
import { get } from "http";

export const friendsService = {
    getFriendRequests: async () => {
        const { data } = await api.get<ApiResponse<FriendRequest[]>>("/api/Friendship/pending-requests");
        return data;
    },

    getFriendSuggestions: async (skip: number = 0, take: number = 20) => {
        const { data } = await api.get<ApiResponse<FriendSuggestion[]>>(`/api/Friendship/suggestions?skip=${skip}&take=${take}`);
        return data;
    }
}
