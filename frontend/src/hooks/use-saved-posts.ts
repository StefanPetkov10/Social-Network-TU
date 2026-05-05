import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { savedPostService } from "@frontend/services/saved-posts-service";
import { SavePostRequest } from "@frontend/lib/types/saved-posts";

export const useSavedCollections = () => {
  return useQuery({
    queryKey: ["saved-collections"],
    queryFn: savedPostService.getCollections,
    select: (data) => data
  });
};

export const useSavedPosts = (collectionName?: string | null) => {
  return useQuery({
    queryKey: ["saved-posts", collectionName],
    queryFn: () => savedPostService.getSavedPosts(collectionName),
    select: (data) => data,
    placeholderData: keepPreviousData,
  });
};

export const useToggleSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SavePostRequest) => savedPostService.toggleSavePost(data),
    
    onSuccess: (response, variables) => {
      if (!response.success) {
        toast.error("Грешка", { description: response.message });
        return;
      }
      const collectionDisplay = variables.collectionName 
        ? `"${variables.collectionName}"` 
        : `"Всички (Общи)"`;

      let bgMessage = "Успешно запазено!";

      if (response.message?.includes("moved")) {
        bgMessage = `Успешно преместено в ${collectionDisplay}`;
      } else if (response.message?.includes("already")) {
        bgMessage = `Вече е запазено в ${collectionDisplay}`;
      } else if (response.message?.includes("saved")) {
        bgMessage = `Успешно запазено в ${collectionDisplay}`;
      }
      toast.success(bgMessage);

      queryClient.invalidateQueries({ queryKey: ["saved-collections"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
    onError: (error: any) => {
        toast.error("Грешка при запазване", {
            description: error?.response?.data?.message || "Възникна проблем."
        });
    }
  });
};

export const useRemoveSavedPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => savedPostService.removeSavedPost(id),
    
    onSuccess: (response) => {
      if (!response.success) {
          toast.error("Грешка", { description: response.message });
          return;
      }
      
      toast.success("Премахнато от запазени.");

      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-collections"] });
    },
    onError: (error: any) => {
        toast.error("Грешка при изтриване", {
            description: error?.response?.data?.message || "Възникна проблем."
        });
    }
  });
};