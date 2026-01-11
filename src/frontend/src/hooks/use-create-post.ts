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
console.log("Пост създаден успешно. Инвалидация на кеша...");
      if (groupId) {
          queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
          console.log("Инвалидация на груповите постове за група:", groupId);
      } else {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          queryClient.invalidateQueries({ queryKey: ["posts", profileId] }); 
      }
    },
    onError: (error: any) => {
      console.log("Грешка при създаване на пост:", error);
      console.log("Отговор от сървъра:", error?.response?.data);
      const msg = error?.response?.data?.message 
      toast.error("Грешка", { description: msg });
    },
  });
}