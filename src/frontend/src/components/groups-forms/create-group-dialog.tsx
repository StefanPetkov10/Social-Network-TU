"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react"; 
import { toast } from "sonner";


import { useCreateGroup } from "@frontend/hooks/use-groups";
import { GroupPrivacy } from "@frontend/lib/types/enums";

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

const createGroupSchema = z.object({
  name: z.string().min(3, "Името трябва да е поне 3 символа").max(50),
  description: z.string().max(200).optional(),
  groupPrivacy: z.enum(GroupPrivacy),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createGroup, isPending } = useCreateGroup();

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      groupPrivacy: GroupPrivacy.Public,
    },
  });

 const onSubmit = (data: CreateGroupFormValues) => {
  createGroup(data, {
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const validationErrors = error.response?.data?.errors;
      if (validationErrors && validationErrors["Name"]) {
        form.setError("name", { 
          type: "manual", 
          message: "Това име вече е заето. Моля, изберете друго." 
        });

      } else {
        toast.error("Възникна грешка при създаването на групата.");
      }
    }
  });
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
           className="flex items-center justify-center w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20 font-semibold py-3 rounded-xl transition-colors mb-6"
        >
            <PlusCircle className="size-5" />
            <span>Създаване на нова група</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Създаване на нова група</DialogTitle>
          <DialogDescription>
            Създайте общност за вашите интереси.
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
                    <Input placeholder="Напр: Програмисти в България" {...field} />
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
                  <FormLabel>Описание (опционално)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="За какво е тази група?" 
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
                    onValueChange={(value) => field.onChange(Number(value))} 
                    defaultValue={field.value.toString()}
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
                Създай
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}