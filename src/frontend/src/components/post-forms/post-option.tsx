"use client";

import { useState } from "react";
import { 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Bookmark, 
  BookmarkX, 
  Flag, 
  Link as LinkIcon, 
  Loader2 
} from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import { useRemoveSavedPost } from "@frontend/hooks/use-saved-posts";
import { toast } from "sonner";

interface PostOptionsProps {
  postId: string;
  isSavedPage?: boolean;
  isOwner?: boolean;
  canDelete?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export function PostOptions({ 
  postId, 
  isSavedPage = false,
  isOwner = false,
  canDelete = false,
  onEdit,
  onDelete,
  onSave
}: PostOptionsProps) {
  const { mutate: removeSaved, isPending: isRemoving } = useRemoveSavedPost();
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Thist URL don't open the post but in futer we can add a redirect to the post page when we open the link
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Линкът е копиран!");
    setIsOpen(false);
  };

  const handleRemoveFromSaved = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSaved(postId, {
      onSuccess: () => setIsOpen(false)
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-muted/80 transition-colors"
            onClick={(e) => e.stopPropagation()} 
        >
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Опции</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 animate-in fade-in-0 zoom-in-95">
        <DropdownMenuItem onClick={() => { onSave(); setIsOpen(false); }} className="cursor-pointer gap-2">
           <Bookmark className="w-4 h-4" />
           Запази
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
           <LinkIcon className="w-4 h-4" />
           Копирай линк
        </DropdownMenuItem>

        {canDelete && (
            <>
                <DropdownMenuSeparator />
                
                {isOwner && (
                    <DropdownMenuItem 
                        className="cursor-pointer gap-2"
                        onClick={() => { onEdit(); setIsOpen(false); }}
                    >
                        <Edit2 className="w-4 h-4" /> Редактиране
                    </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => { onDelete(); setIsOpen(false); }}
                >
                    <Trash2 className="w-4 h-4" /> Изтриване
                </DropdownMenuItem>
            </>
        )}

        {isSavedPage && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onClick={handleRemoveFromSaved}
                    disabled={isRemoving}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                >
                    {isRemoving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <BookmarkX className="w-4 h-4" />
                    )}
                    {isRemoving ? "Премахване..." : "Премахни от запазени"}
                </DropdownMenuItem>
            </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2 text-muted-foreground">
           <Flag className="w-4 h-4" />
           Докладвай
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}