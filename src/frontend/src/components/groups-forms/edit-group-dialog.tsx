"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Settings, Loader2 } from "lucide-react"; 
import { toast } from "sonner";
import { useRouter } from "next/navigation"; 
import { useQueryClient } from "@tanstack/react-query"; 

import { useUpdateGroup } from "@frontend/hooks/use-groups";
import { GroupPrivacy } from "@frontend/lib/types/enums";
import { GroupDto } from "@frontend/lib/types/groups";
import { ApiResponse } from "@frontend/lib/types/api"; 

import { Button } from "@frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@frontend/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@frontend/components/ui/form";
import { Input } from "@frontend/components/ui/input";
import { Textarea } from "@frontend/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";

const updateGroupSchema = z.object({
  name: z.string()
    .min(1, "Името на групата е задължително") 
    .max(100, "Името не може да надвишава 100 символа"), 
  description: z.string()
    .max(500, "Описанието не може да надвишава 500 символа") 
    .optional(),
  groupPrivacy: z.string(), 
});

type UpdateGroupFormValues = z.infer<typeof updateGroupSchema>;

interface EditGroupDialogProps {
    group: GroupDto;
    trigger?: React.ReactNode; 
}

export function EditGroupDialog({ group, trigger }: EditGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter(); 
  const queryClient = useQueryClient();
  const { mutate: updateGroup, isPending } = useUpdateGroup();

  const form = useForm<UpdateGroupFormValues>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: group.name || "",
      description: group.description || "",
      groupPrivacy: group.isPrivate ? GroupPrivacy.Private.toString() : GroupPrivacy.Public.toString(), 
    },
  });

  useEffect(() => {
    if (open) {
        form.reset({
            name: group.name || "",
            description: group.description || "",
            groupPrivacy: group.isPrivate ? GroupPrivacy.Private.toString() : GroupPrivacy.Public.toString(),
        });
    }
  }, [open, group, form]);

 const onSubmit = (data: UpdateGroupFormValues) => {
  const privacyEnumValue = Number(data.groupPrivacy);
  
  const payload = {
      name: data.name,
      description: data.description,
      groupPrivacy: privacyEnumValue
  };

  updateGroup({ groupId: group.id, data: payload }, {
    onSuccess: (response: ApiResponse<any>) => { 
      
      if (!response.success) {
          const message = response.message || "";
          const errors = response.errors || [];
          
          if (message.includes("already taken") || errors.some(e => e.includes("unique"))) {
             form.setError("name", { 
                type: "manual", 
                message: "Това име вече е заето. Опитайте с друго." 
             });
          } else {
             toast.error("Възникна грешка: " + message);
          }
          return;
      }

      setOpen(false);
      
      const updatedGroupData: GroupDto = {
          ...group,
          name: data.name,
          description: data.description || undefined,
          isPrivate: privacyEnumValue === GroupPrivacy.Private, 
      };

      if (group.name !== data.name) {
          const encodedName = encodeURIComponent(data.name);
          
          queryClient.setQueryData<ApiResponse<GroupDto>>(
              ["group-by-name", data.name], 
              (old) => ({ data: updatedGroupData, success: true, message: "Updated" }) 
          );
          queryClient.removeQueries({ queryKey: ["group-by-name", group.name] });

          router.replace(`/groups/${encodedName}`);
      } 
      else {
          queryClient.setQueryData<ApiResponse<GroupDto>>(
              ["group-by-name", group.name],
              (oldData) => {
                  if (!oldData) return { data: updatedGroupData, success: true, message: "" };
                  return {
                      ...oldData,
                      data: {
                          ...oldData.data,
                          ...updatedGroupData
                      }
                  };
              }
          );
          queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      }

      toast.success("Промените са запазени успешно!");
    },
    onError: (error: any) => {
      const validationErrors = error.response?.data?.errors;
      if (validationErrors && validationErrors["Name"]) {
        form.setError("name", { 
          type: "manual", 
          message: "Това име вече е заето. Опитайте с друго." 
        });
      } else {
        toast.error("Възникна грешка при обновяването.");
      }
    }
  });
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
            <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Настройки
            </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактиране на група</DialogTitle>
          <DialogDescription>
            Променете настройките и информацията за групата.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Име на групата</FormLabel>
                  <FormControl>
                    <Input placeholder="Напр: C# Developers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Описание на групата..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupPrivacy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Поверителност</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Избери тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={GroupPrivacy.Public.toString()}>
                        🌍 Публична (Всеки може да вижда)
                      </SelectItem>
                      <SelectItem value={GroupPrivacy.Private.toString()}>
                        🔒 Частна (Само членове)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Отказ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Запази промените
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}