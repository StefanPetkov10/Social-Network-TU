import { useQuery, useQueryClient, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { ProfileDto, UpdateProfileDto } from "@frontend/lib/types/profile";
import { profileService } from "@frontend/services/profile-service";
import { ApiResponse } from "@frontend/lib/types/api";
import { useAuthStore } from "@frontend/stores/useAuthStore"; 


export function useProfile() {
    const accessToken = useAuthStore((s) => s.accessToken); 

    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const { data } = await profileService.getMyProfile();
            return data;
        },
        enabled: !!accessToken, 
    });
}

export const useProfileById = (
    userId: string,
    options?: Partial<UseQueryOptions<ApiResponse<ProfileDto>, Error>>
) => {
    const accessToken = useAuthStore((s) => s.accessToken);

    return useQuery({
        queryKey: ["user-profile-by-id", userId],
        queryFn: () => profileService.getProfileById(userId),

        enabled: !!userId && !!accessToken && (options?.enabled !== false),

        ...options
    });
};

export const useProfileByUsername = (username: string) => {
    const accessToken = useAuthStore((s) => s.accessToken);

    return useQuery({
        queryKey: ["user-profile-by-username", username],
        queryFn: () => profileService.getProfileByUsername(username),
        enabled: !!username && username !== "" && !!accessToken,
        staleTime: 1000 * 60 * 5, 
    });
}

export const useEditProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<UpdateProfileDto>) => profileService.editMyProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
            queryClient.invalidateQueries({ queryKey: ["user-profile-by-id"] });
        },
    });
};

export const useUpdateBio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (bio: string) => profileService.updateBio(bio),
        onSuccess: () => {
            console.log("Bio updated successfully");
            queryClient.invalidateQueries({ queryKey: ["user"] });
            queryClient.invalidateQueries({ queryKey: ["user-profile-by-id"] });
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
            profileService.changePassword(data.currentPassword, data.newPassword, data.confirmNewPassword),
    });
};