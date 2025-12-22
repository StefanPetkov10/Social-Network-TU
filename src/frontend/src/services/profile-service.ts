import api from "../lib/axios";
import { ProfileDto, UpdateProfileDto } from "@frontend/lib/types/profile";
import { ApiResponse } from "@frontend/lib/types/api";

export const profileService = {
    getProfileById: async (profileId: string) => {
        const { data } = await api.get<ApiResponse<ProfileDto>>(`/api/Profile/${profileId}`);
        return data;
    },
    getMyProfile: async () => {
        const { data } = await api.get<ApiResponse<ProfileDto>>(`/api/Profile/me`);
        return data;
    },   

    editMyProfile: async (profileData: Partial<UpdateProfileDto>) => {
        const { data } = await api.put<ApiResponse<UpdateProfileDto>>(`/api/Profile/edit-profile`, profileData);
        return data;
    },

    updateBio: async (bio: string) => {
        const { data } = await api.post<ApiResponse<string>>(`/api/Profile/update-bio`, { bio }); 
        return data;
    },

    changePassword: async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
        const payload = {
            CurrentPassword: currentPassword,
            NewPassword: newPassword,
            ConfirmNewPassword: confirmNewPassword
        };
        const { data } = await api.post<ApiResponse<null>>(`/api/Profile/change-password`, payload);
        return data;
    }
};