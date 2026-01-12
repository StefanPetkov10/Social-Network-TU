import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { groupMembersService } from "@frontend/services/group-members-service";
import { toast } from "sonner";
import { GroupRole } from "@frontend/lib/types/enums";


export const useGroupMembers = (groupId: string) => {
  return useInfiniteQuery({
    queryKey: ["group-members", groupId], 
    queryFn: ({ pageParam = undefined }) => {
        return groupMembersService.getGroupMembers(groupId, pageParam as string | undefined);
    },
    getNextPageParam: (lastPageResponse) => {
      return lastPageResponse.meta?.lastJoinedDate || undefined;
    },
    initialPageParam: undefined,
    enabled: !!groupId,
  });
};

export const useGroupFriends = (groupId: string) => {
    return useQuery({
        queryKey: ["group-friends", groupId],
        queryFn: () => groupMembersService.getFriendsInGroup(groupId, 3, 0),
        enabled: !!groupId,
    });
};

export const useGroupMutualFriends = (groupId: string) => {
    return useQuery({
        queryKey: ["group-mutual-friends", groupId],
        queryFn: () => groupMembersService.getMutualFriendsInGroup(groupId),
        enabled: !!groupId,
    });
};

export const useGroupAdmins = (groupId: string) => {
    return useQuery({
        queryKey: ["group-admins", groupId],
        queryFn: () => groupMembersService.getGroupAdmins(groupId),
        enabled: !!groupId,
    });
};

export const useGroupRequests = (groupId: string) => {
    return useQuery({
        queryKey: ["group-requests", groupId],
        queryFn: () => groupMembersService.getPendingRequests(groupId),
        enabled: !!groupId,
    });
};


export const useJoinGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (groupId: string) => groupMembersService.joinGroup(groupId),
        onSuccess: (data, groupId) => {
            toast.success("Успех", { description: data.message });
            queryClient.invalidateQueries({ queryKey: ["group-by-name"] }); 
            queryClient.invalidateQueries({ queryKey: ["my-groups"] });
        },
        onError: (error: any) => {
            toast.error("Грешка", { description: error?.response?.data?.message || "Неуспешно присъединяване." });
        }
    });
};

export const useLeaveGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (groupId: string) => groupMembersService.leaveGroup(groupId),
        onSuccess: (data, groupId) => {
            toast.success("Успех", { description: "Напуснахте групата." });
            queryClient.invalidateQueries({ queryKey: ["group-by-name"] });
            queryClient.invalidateQueries({ queryKey: ["my-groups"] });
            queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        },
        onError: (error: any) => {
            toast.error("Грешка", { description: error?.response?.data?.message || "Грешка при напускане." });
        }
    });
};

export const useApproveMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ groupId, profileId }: { groupId: string, profileId: string }) => 
            groupMembersService.approveRequest(groupId, profileId),
        onSuccess: (_, { groupId }) => {
            toast.success("Одобрено", { description: "Потребителят е добавен." });
            queryClient.invalidateQueries({ queryKey: ["group-requests", groupId] });
            queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        }
    });
};

export const useRejectMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ groupId, profileId }: { groupId: string, profileId: string }) => 
            groupMembersService.rejectRequest(groupId, profileId),
        onSuccess: (_, { groupId }) => {
            toast.success("Отхвърлено", { description: "Заявката е отхвърлена." });
            queryClient.invalidateQueries({ queryKey: ["group-requests", groupId] });
        }
    });
};

export const useRemoveMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ groupId, profileId }: { groupId: string, profileId: string }) => 
            groupMembersService.removeMember(groupId, profileId),
        onSuccess: (_, { groupId }) => {
            toast.success("Премахнат", { description: "Потребителят е премахнат от групата." });
            queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
            queryClient.invalidateQueries({ queryKey: ["group-admins", groupId] });
        },
        onError: (error: any) => {
             toast.error("Грешка", { description: error?.response?.data?.message || "Грешка при премахване." });
        }
    });
};

export const useChangeRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ groupId, profileId, newRole }: { groupId: string, profileId: string, newRole: GroupRole }) => 
            groupMembersService.changeMemberRole(groupId, profileId, newRole),
        onSuccess: (_, { groupId }) => {
            toast.success("Ролята е обновена");
            queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
            queryClient.invalidateQueries({ queryKey: ["group-admins", groupId] });
        },
        onError: (error: any) => {
             toast.error("Грешка", { description: error?.response?.data?.message || "Грешка при смяна на роля." });
        }
    });
};