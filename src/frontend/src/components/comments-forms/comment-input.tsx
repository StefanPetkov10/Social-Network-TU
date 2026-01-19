"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { Textarea } from "@frontend/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { useCreateComment } from "@frontend/hooks/use-comments";
import { getInitials } from "@frontend/lib/utils";

interface CommentInputProps {
  postId: string;
  currentUserAvatar?: string | null;
  currentUserName?: string;
}

export function CommentInput({ postId, currentUserAvatar, currentUserName }: CommentInputProps) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: createComment, isPending } = useCreateComment(postId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if ((!content.trim() && !file) || isPending) return;

    createComment(
      { content, file },
      {
        onSuccess: () => {
          setContent("");
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  }

  return (
    <div className="flex gap-3 p-4 border-t bg-background z-20 relative">
      <Avatar className="w-8 h-8 mt-1">
        <AvatarImage src={currentUserAvatar || ""} />
        <AvatarFallback>{getInitials(currentUserName || "?")}</AvatarFallback>
      </Avatar>

      <div className="flex-1 bg-muted/30 rounded-2xl p-2 border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        {file && (
          <div className="relative w-fit mb-2 group">
            <img 
              src={URL.createObjectURL(file)} 
              alt="Preview" 
              className="h-24 w-auto rounded-lg object-cover border shadow-sm"
            />
            <button
              onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишете коментар..."
          className="min-h-[36px] border-none shadow-none resize-none bg-transparent focus-visible:ring-0 p-1 text-sm max-h-[120px]"
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        <div className="flex justify-between items-center mt-1 px-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                type="button"
            >
                <ImageIcon className="h-5 w-5" />
            </Button>
            
            <Button 
                size="icon" 
                variant="ghost"
                className={`h-8 w-8 rounded-full transition-colors ${content || file ? "text-primary hover:bg-primary/10" : "text-muted-foreground"}`}
                disabled={(!content && !file) || isPending}
                onClick={handleSubmit}
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
            </Button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileChange}
      />
    </div>
  );
}