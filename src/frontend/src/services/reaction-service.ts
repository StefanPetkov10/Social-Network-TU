import { ReactorListResponse } from "@frontend/lib/types/reaction";
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
    },

    getReactors: async (
        entityId: string, 
        isComment: boolean, 
        typeFilter?: ReactionType | null, 
        lastReactionId?: string
    ) => {
        const params = new URLSearchParams();
        params.append("isComment", isComment.toString());
        params.append("take", "20"); 

        if (typeFilter !== undefined && typeFilter !== null) {
            params.append("type", typeFilter.toString());
        }

        if (lastReactionId) {
            params.append("lastReactionId", lastReactionId);
        }

        const { data } = await api.get<ApiResponse<ReactorListResponse>>(`/api/Reaction/${entityId}/reactors`, { params });
        return data;
    }
};


