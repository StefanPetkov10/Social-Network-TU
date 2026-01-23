"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, X, Loader2, FileText, Save } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { Textarea } from "@frontend/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { useCreateComment, useEditComment } from "@frontend/hooks/use-comments";
import { getInitials } from "@frontend/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@frontend/components/ui/form";
import { CommentMediaDto } from "@frontend/lib/types/comment";

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_DOC_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx"];

const commentSchema = z.object({
  content: z.string()
    .min(1, "Моля, напишете нещо.") 
    .max(300, "Коментарът не може да надвишава 300 символа."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentInputProps {
  postId: string;
  commentId?: string; 
  currentUserAvatar?: string | null;
  currentUserName?: string;
  parentCommentId?: string;
  
  initialContent?: string;
  initialMedia?: CommentMediaDto | null;
  mode?: "create" | "edit";

  onCancel?: () => void;
  onSuccess?: () => void; 
  autoFocus?: boolean;
}

export function CommentInput({ 
    postId, 
    commentId,
    currentUserAvatar, 
    currentUserName,
    parentCommentId,
    initialContent = "",
    initialMedia = null,
    mode = "create",
    onCancel,
    onSuccess, 
    autoFocus = false
}: CommentInputProps) {

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const [isMediaDeleted, setIsMediaDeleted] = useState(false);
  
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: createComment, isPending: isCreating } = useCreateComment(postId);
  const { mutate: editComment, isPending: isEditing } = useEditComment();

  const isPending = isCreating || isEditing;

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: initialContent,
    },
  });

  const { watch, handleSubmit: submitForm, reset, setValue } = form;
  const contentValue = watch("content");

  useEffect(() => {
      if (mode === "edit" && initialContent) {
          setValue("content", initialContent);
      }
  }, [initialContent, mode, setValue]);

  const isContentChanged = contentValue.trim() !== initialContent.trim();
  const isDirty = isContentChanged || (file !== null) || isMediaDeleted;
  const isValid = contentValue.trim().length > 0; 

  const isButtonEnabled = mode === "create" 
      ? (isValid || file) 
      : (isDirty && isValid);

  const checkExtension = (fileName: string, allowedExts: string[]) => {
    const ext = "." + fileName.split('.').pop()?.toLowerCase();
    return allowedExts.includes(ext);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      const fileName = selectedFile.name.toLowerCase();

      if (selectedFile.type.startsWith("video/")) {
          setFileError("Видео клипове не са разрешени в коментарите.");
          e.target.value = "";
          return;
      }

      const isImage = checkExtension(fileName, ALLOWED_IMAGE_EXTENSIONS);
      const isDoc = checkExtension(fileName, ALLOWED_DOC_EXTENSIONS);

      if (!isImage && !isDoc) {
          setFileError("Неподдържан файлов формат.");
          e.target.value = "";
          return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
          setFileError("Файлът трябва да е по-малък от 10MB.");
          e.target.value = "";
          return;
      }

      setFile(selectedFile);
    }
    e.target.value = ""; 
  };

  const onSubmit = (data: CommentFormValues) => {
    if (isPending) return;

    if (mode === "create") {
        createComment(
          { content: data.content, file: file, parentCommentId },
          {
            onSuccess: () => {
              reset();
              setFile(null);
              setFileError(null);
              if (onSuccess) onSuccess();
              else if (onCancel) onCancel();
            }
          }
        );
    } else if (mode === "edit" && commentId) {
        const payload: any = { content: data.content };
        
        if (isMediaDeleted && initialMedia) {
            payload.fileToDelete = initialMedia.id;
        }

        editComment(
            { 
                commentId, 
                postId, 
                parentCommentId, 
                payload 
            },
            {
                onSuccess: () => {
                    if (onSuccess) onSuccess(); 
                }
            }
        );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitForm(onSubmit)();
      }
  }

  const isImageFile = (file: File) => {
      return checkExtension(file.name, ALLOWED_IMAGE_EXTENSIONS) || file.type.startsWith("image/");
  };

  const containerClasses = mode === "edit"
    ? "w-full animate-in fade-in" 
    : (parentCommentId 
        ? "flex gap-2 items-start mt-2 w-full animate-in fade-in slide-in-from-top-2" 
        : "flex gap-3 p-4 border-t bg-background z-20 relative");

  const avatarSizeClasses = parentCommentId ? "w-6 h-6 mt-1" : "w-8 h-8 mt-1";
  
  const showAvatar = mode === "create";

  return (
    <div className={containerClasses}>
      {showAvatar && (
          <Avatar className={avatarSizeClasses}>
            <AvatarImage src={currentUserAvatar || ""} />
            <AvatarFallback className="bg-primary text-white text-xs">
                {getInitials(currentUserName || "?")}
            </AvatarFallback>
          </Avatar>
      )}

      <div className="flex-1">
        <Form {...form}>
            <div className={`rounded-2xl p-2 border transition-all ${mode === 'edit' ? 'bg-background border-primary/40 ring-1 ring-primary/10' : 'bg-muted/30 focus-within:border-primary/50'}`}>
                
                {mode === "edit" && initialMedia && !isMediaDeleted && (
                     <div className="relative w-fit mb-2 group">
                        {initialMedia.mediaType === 0 ? ( 
                             <img 
                                src={initialMedia.url} 
                                alt="Existing attachment" 
                                className="h-20 w-auto rounded-lg object-cover border opacity-80"
                            />
                        ) : ( 
                            <div className="flex items-center p-2 border rounded-lg bg-background shadow-sm pr-8 opacity-80">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 shrink-0">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-medium truncate max-w-[150px]">{initialMedia.fileName}</span>
                            </div>
                        )}
                       
                        <button
                            onClick={() => setIsMediaDeleted(true)} 
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors z-10"
                            type="button"
                            title="Изтрий прикачения файл"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
                
                {mode === "edit" && isMediaDeleted && initialMedia && (
                     <div className="mb-2 text-xs text-destructive flex items-center gap-2 bg-destructive/10 p-1.5 rounded-md w-fit">
                        <span>Прикаченият файл ще бъде изтрит</span>
                        <button 
                            onClick={() => setIsMediaDeleted(false)} 
                            className="underline hover:no-underline font-semibold"
                            type="button"
                        >
                            Върни
                        </button>
                    </div>
                )}

                {file && (
                <div className="relative w-fit mb-2 group animate-in zoom-in-95 duration-200">
                    {isImageFile(file) ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Preview" 
                          className="h-20 w-auto rounded-lg object-cover border shadow-sm"
                        />
                    ) : (
                        <div className="flex items-center p-2 border rounded-lg bg-background shadow-sm pr-8">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-2 shrink-0">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col overflow-hidden max-w-[150px]">
                                <span className="text-xs font-medium truncate">{file.name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{file.name.split('.').pop()}</span>
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={() => { setFile(null); setFileError(null); }}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors z-10"
                        type="button"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
                )}

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                {...field}
                                onKeyDown={handleKeyDown}
                                placeholder={mode === "edit" ? "Редактирайте коментара..." : (parentCommentId ? "Напишете отговор..." : "Напишете коментар...")}
                                className="min-h-[36px] border-none shadow-none resize-none bg-transparent focus-visible:ring-0 p-1 text-sm max-h-[120px]"
                                rows={1}
                                autoFocus={autoFocus}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = "auto";
                                    target.style.height = `${target.scrollHeight}px`;
                                }}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-between items-center mt-1 px-1">
                    <div className="flex gap-1">
                        {mode === "create" && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-full transition-colors"
                                    onClick={() => mediaInputRef.current?.click()}
                                    type="button"
                                    title="Снимка"
                                >
                                    <ImageIcon className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-full transition-colors"
                                    onClick={() => docInputRef.current?.click()}
                                    type="button"
                                    title="Документ"
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        
                        {(onCancel || mode === "edit") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
                                onClick={onCancel}
                                type="button"
                            >
                                Отказ
                            </Button>
                        )}
                    </div>
                    
                    <Button 
                        size="icon" 
                        variant="ghost"
                        className={`h-7 w-7 rounded-full transition-colors ${isButtonEnabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground opacity-50"}`}
                        disabled={!isButtonEnabled || isPending}
                        onClick={submitForm(onSubmit)}
                        type="button"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "edit" ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4 ml-0.5" />)}
                    </Button>
                </div>
            </div>
        </Form>
        
        {(form.formState.errors.content || fileError) && (
            <div className="px-2 mt-1">
                {form.formState.errors.content && (
                    <p className="text-xs text-red-500 font-medium">{form.formState.errors.content.message}</p>
                )}
                {fileError && (
                    <p className="text-xs text-red-500 font-medium">{fileError}</p>
                )}
            </div>
        )}
      </div>

      <input
        type="file"
        ref={mediaInputRef}
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,.gif,image/*" 
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={docInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
        onChange={handleFileChange}
      />
    </div>
  );
}