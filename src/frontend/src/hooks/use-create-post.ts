import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postService } from "@frontend/services/post-service"; 

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => postService.createPost(formData),

    onSuccess: (response, formData) => {
      if (!response.success) {
        toast.error("Грешка при качване", {
          description: response.message || "Невалиден тип файл.",
        });
        return; 
      }
      toast.success("Успех!", { description: "Постът е публикуван успешно." });
      
      const profileId = formData.get("ProfileId")?.toString();
      const groupId = formData.get("GroupId")?.toString();
      if (groupId) {
          queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
      } else {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          queryClient.invalidateQueries({ queryKey: ["posts", profileId] }); 
      }
    },
  });
}