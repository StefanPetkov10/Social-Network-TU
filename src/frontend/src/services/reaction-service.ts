import api from "../lib/axios";
import { ReactionType } from "../lib/types/enums";
import { ApiResponse } from "@frontend/lib/types/api";

export const reactionService = {
    reactToPost : async (postId : string, reactionType: ReactionType) => {
        const { data } = await api.post<ApiResponse<string>>(`/api/Reaction/reactPost?postId=${postId}&type=${reactionType}`);
        return data;
    },

    reactToComment: async (commentId : string, reactionType: ReactionType) => {
        const { data } = await api.post<ApiResponse<string>>(`/api/Reaction/reactComment?commentId=${commentId}&type=${reactionType}`);
        return data;
    }
};


