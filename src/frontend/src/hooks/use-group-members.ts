import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { groupMembersService } from "@frontend/services/group-members-service";
import { toast } from "sonner";
import { GroupRole } from "@frontend/lib/types/enums";


type PageParam = { lastJoinedDate: string; lastMemberId: string; };

export const useGroupMembers = (groupId: string) => {
  return useInfiniteQuery({
    queryKey: ["group-members", groupId], 
    
    queryFn: ({ pageParam }) => {
        return groupMembersService.getGroupMembers(
            groupId, 
            pageParam?.lastJoinedDate, 
            pageParam?.lastMemberId,
        );
    },

    getNextPageParam: (lastPageResponse) => {
      const data = lastPageResponse.data || [];
      const meta = lastPageResponse.meta;

      if (data.length < 20) {
          return undefined;
      }

      if (meta?.lastJoinedDate && meta?.lastProfileId) {
        return {
          lastJoinedDate: meta.lastJoinedDate,
          lastMemberId: meta.lastProfileId
        };
      }
      return undefined;
    },
    initialPageParam: undefined as PageParam | undefined,
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

export const useGroupRequests = (groupId: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["group-requests", groupId],
        queryFn: () => groupMembersService.getPendingRequests(groupId),
        
        enabled: !!groupId && (options?.enabled !== false), 
    });
};


export const useJoinGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (groupId: string) => groupMembersService.joinGroup(groupId),
        onSuccess: (data, groupId) => {
            const isJoinedImmediately = data.message?.toLowerCase().includes("joined");

            if (isJoinedImmediately) {
                toast.success("Успешно присъединяване!", { 
                    description: "Вече сте член на групата и можете да разглеждате съдържанието." 
                });
            } else {
                toast.success("Заявката е изпратена!", { 
                    description: "Изчакайте одобрение от администратор, за да влезете в групата." 
                });
            }
            queryClient.invalidateQueries({ queryKey: ["groups-discover"] }); 
            
            queryClient.invalidateQueries({ queryKey: ["group-by-name"] });
            
            queryClient.invalidateQueries({ queryKey: ["my-groups"] });
            
            queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        },
        onError: (error: any) => {
            if (error?.response?.data?.message?.includes("Already")) {
                 queryClient.invalidateQueries({ queryKey: ["groups-discover"] });
                 queryClient.invalidateQueries({ queryKey: ["group-by-name"] });
            }
            
            toast.error("Грешка", { description: error?.response?.data?.message || "Неуспешно присъединяване." });
        }
    });
};

export const useLeaveGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (groupId: string) => groupMembersService.leaveGroup(groupId),
        onSuccess: (data, groupId) => {
            toast.success("Успех", { description: "Напуснахте групата успешно." });
            queryClient.invalidateQueries({ queryKey: ["group-by-name"] });

            queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });

            queryClient.invalidateQueries({ queryKey: ["my-groups"] });

            queryClient.invalidateQueries({ queryKey: ["groups-discover"] });
            
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

            queryClient.invalidateQueries({ queryKey: ["group-by-name"] });
            queryClient.invalidateQueries({ queryKey: ["my-groups"] });
        },
        onError: (error: any) => {
             toast.error("Грешка", { description: error?.response?.data?.message || "Грешка при смяна на роля." });
        }
    });
};