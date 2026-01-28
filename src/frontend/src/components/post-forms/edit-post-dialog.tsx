"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Image as ImageIcon, 
  FileText, 
  X, 
  Globe, 
  Users, 
  Lock, 
  Loader2,
  FileSpreadsheet,
  FilePieChart,
  FileArchive,
  FileIcon,
  File
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@frontend/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@frontend/components/ui/select";
import { Textarea } from "@frontend/components/ui/textarea";
import { ScrollArea } from "@frontend/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@frontend/components/ui/form";

import { useUpdatePost } from "@frontend/hooks/use-post";
import { validateFile } from "@frontend/lib/file-validation";
import { getFileDetails, getInitials} from "@frontend/lib/utils";
import { PostDto } from "@frontend/lib/types/posts";
import { useProfile } from "@frontend/hooks/use-profile";

const editPostSchema = z.object({
  content: z.string()
    .min(1, "Моля, напишете нещо.")
    .max(500, "Текстът не може да надвишава 500 символа."),
  visibility: z.string(),
});

type EditPostValues = z.infer<typeof editPostSchema>;

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostDto;
}

export function EditPostDialog({ open, onOpenChange, post }: EditPostDialogProps) {
  const { data: currentUser } = useProfile();
  
  const [existingMedia, setExistingMedia] = useState(post.media || []);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]); 
  
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePost, isPending } = useUpdatePost();

  const form = useForm<EditPostValues>({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      content: post.content || "",
      visibility: post.visibility.toString(),
    },
  });

  useEffect(() => {
    if (open) {
        form.reset({
            content: post.content || "",
            visibility: post.visibility.toString(),
        });
        setExistingMedia(post.media || []);
        setFilesToDelete([]);
        setNewFiles([]);
        setFileError(null);
    }
  }, [open, post, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      const currentCount = existingMedia.length + newFiles.length;
      if (currentCount + selectedFiles.length > 5) {
        setFileError("Максимум 5 файла са позволени общо.");
        return;
      }

      const validFiles: File[] = [];
      let hasInvalidFile = false;

      selectedFiles.forEach((file) => {
        if (file.size > 100 * 1024 * 1024) {
            setFileError(`Файлът "${file.name}" е твърде голям.`);
            hasInvalidFile = true;
            return;
        }

        if (validateFile(file)) {
          validFiles.push(file);
        } else {
          hasInvalidFile = true;
        }
      });

      if (hasInvalidFile && !fileError) {
          setFileError("Някои файлове не бяха добавени (невалиден тип или размер).");
      }

      if (validFiles.length > 0) {
        setNewFiles((prev) => [...prev, ...validFiles]);
      }
      e.target.value = ""; 
    }
  };

  const removeNewFile = (fileToRemove: File) => {
    setNewFiles((prev) => prev.filter((f) => f !== fileToRemove));
    setFileError(null);
  };

  const removeExistingMedia = (mediaId: string) => {
    setFilesToDelete((prev) => [...prev, mediaId]);
    setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const onSubmit = (data: EditPostValues) => {
    if (existingMedia.length + newFiles.length > 5) {
        setFileError("Максимум 5 файла са позволени общо.");
        return;
    }

    const formData = new FormData();
    formData.append("Content", data.content);
    
    if (!post.groupId) {
        formData.append("PostVisibility", data.visibility);
    }

    filesToDelete.forEach((id) => {
        formData.append("FilesToDelete", id);
    });

    newFiles.forEach((file) => {
        formData.append("NewFiles", file);
    });

    updatePost({ postId: post.id, formData }, {
        onSuccess: () => {
            onOpenChange(false);
        }
    });
  };

  const isMedia = (file: File) => file.type.startsWith("image/") || file.type.startsWith("video/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center w-full font-bold text-lg">
              Редактиране на публикация
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="p-4 flex gap-3">
                    <Avatar>
                        <AvatarImage src={currentUser?.authorAvatar || ""} />
                        <AvatarFallback className="bg-primary text-white">{getInitials(currentUser?.fullName || "User")}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold text-sm">{currentUser?.fullName}</div>
                        {!post.groupId ? (
                             <FormField
                                control={form.control}
                                name="visibility"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-6 text-xs bg-muted/50 border-none px-2 py-0 mt-1 w-fit gap-1 rounded-md">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="0"><div className="flex items-center"><Globe className="h-4 w-4 mr-2"/> Публично</div></SelectItem>
                                            <SelectItem value="1"><div className="flex items-center"><Users className="h-4 w-4 mr-2"/> Приятели</div></SelectItem>
                                            <SelectItem value="2"><div className="flex items-center"><Lock className="h-4 w-4 mr-2"/> Само аз</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                             />
                        ) : (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                <Users className="h-3 w-3 mr-1" /> Група
                            </div>
                        )}
                    </div>
                </div>

                <ScrollArea className="max-h-[50vh] px-4">
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea 
                                        {...field}
                                        placeholder="Редактирайте текста..."
                                        className="min-h-[100px] text-lg border-none focus-visible:ring-0 resize-none p-0 placeholder:text-muted-foreground/70"
                                    />
                                </FormControl>
                                <FormMessage className="text-red-500 text-sm mt-1" />
                            </FormItem>
                        )}
                    />
                    
                    {fileError && (
                        <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded-md border border-red-100">
                            {fileError}
                        </div>
                    )}

                    {(existingMedia.length > 0 || newFiles.length > 0) && (
                        <div className="mt-4 mb-2 grid grid-cols-1 gap-2 border rounded-lg p-2 bg-muted/10">
                            
                            {existingMedia.map((media) => (
                                 <div key={media.id} className="relative group rounded-md overflow-hidden border bg-background">
                                    {media.mediaType === 0 ? ( 
                                         <img src={media.url} alt="media" className="w-full h-auto max-h-[300px] object-contain" />
                                    ) : media.mediaType === 1 ? (
                                         <video src={media.url} controls className="w-full max-h-[300px]" />
                                    ) : ( 
                                         <div className="flex items-center p-3 gap-3">
                                            {(() => {
                                                const { Icon, colorClass } = getFileDetails(media.fileName);
                                                return (
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                                        <Icon />
                                                    </div>
                                                );
                                            })()}
                                            <div className="flex-1 overflow-hidden">
                                                <div className="text-sm font-medium truncate">{media.fileName}</div>
                                                <div className="text-xs text-muted-foreground">Съществуващ файл</div>
                                            </div>
                                         </div>
                                    )}
                                    
                                    <Button 
                                        type="button"
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-7 w-7 opacity-80 group-hover:opacity-100 transition-opacity rounded-full"
                                        onClick={() => removeExistingMedia(media.id)}
                                        title="Изтрий файл"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            {newFiles.map((file, i) => (
                                 <div key={`new-${i}`} className="relative group rounded-md overflow-hidden border bg-background border-green-200">
                                    {isMedia(file) ? (
                                        <div className="flex justify-center bg-black/5">
                                            {file.type.startsWith("image/") ? (
                                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-auto max-h-[300px] object-contain" />
                                            ) : (
                                                <video src={URL.createObjectURL(file)} controls className="w-full max-h-[300px]" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center p-3 gap-3">
                                            {(() => {
                                                const { Icon, colorClass } = getFileDetails(file.name);
                                                return (
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                                        <Icon />
                                                    </div>
                                                );
                                            })()}
                                            <div className="flex-1 overflow-hidden">
                                                <div className="text-sm font-medium truncate">{file.name}</div>
                                                <div className="text-xs text-red-600 font-medium">Нов файл</div>
                                            </div>
                                        </div>
                                    )}

                                    <Button 
                                        type="button"
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full"
                                        onClick={() => removeNewFile(file)}
                                        title="Премахни нов файл"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="px-4 py-3 border-t bg-gray-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Добави още:</span>
                        <div className="flex gap-2">
                             <Button type="button" variant="outline" size="sm" onClick={() => mediaInputRef.current?.click()}>
                                <ImageIcon className="h-4 w-4 mr-2 text-green-600" /> Медия
                             </Button>
                             <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()}>
                                <FileText className="h-4 w-4 mr-2 text-orange-500" /> Документ
                             </Button>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Отказ
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Запази промените
                        </Button>
                    </div>
                </div>
            </form>
        </Form>

        <input 
            type="file" 
            ref={mediaInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            multiple 
            onChange={handleFileChange} 
        />
        <input 
            type="file" 
            ref={docInputRef} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.rar,.7z" 
            multiple 
            onChange={handleFileChange} 
        />
      </DialogContent>
    </Dialog>
  );
}