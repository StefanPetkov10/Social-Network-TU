import api from "../lib/axios";
import { ProfileDto } from "@frontend/lib/types/profile";
import { ApiResponse } from "@frontend/lib/types/api";

export const profileService = {
    getProfileById: async (profileId: string) => {
        const { data } = await api.get<ApiResponse<ProfileDto>>(`/api/Profile/${profileId}`);
        return data;
    },
    getMyProfile: async () => {
        const { data } = await api.get<ApiResponse<ProfileDto>>(`/api/Profile/me`);
        return data;
    }   
};