"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Separator } from "@frontend/components/ui/separator";
import { ImageIcon, FileText } from "lucide-react";

interface CreatePostProps {
  user: {
    firstName: string;
    lastName?: string;
    photo?: string;
  };
  className?: string;
}

const getInitials = (first: string, last?: string) => {
    const f = first ? first.charAt(0) : "";
    const l = last ? last.charAt(0) : "";
    return (f + l).toUpperCase();
};

export function CreatePost({ user, className }: CreatePostProps) {
  const initials = getInitials(user.firstName, user.lastName);
  const displayName = user.firstName;

  return (
    <div className={`bg-background rounded-xl border p-4 shadow-sm ${className || ""}`}>
      <div className="flex gap-3 mb-4">
        <Avatar>
          <AvatarImage src={user.photo || ""} className="object-cover" />
          <AvatarFallback className="bg-primary text-white font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <input 
            type="text" 
            placeholder={`Споделете нещо с колегите, ${displayName}...`} 
            className="flex-1 bg-muted/50 hover:bg-muted/80 transition-colors rounded-full px-4 text-sm outline-none cursor-pointer"
        />
      </div>
      
      <Separator className="my-2" />
      
      <div className="flex gap-2 px-2 pt-1">
        <Button variant="ghost" size="sm" className="flex-1 gap-2 text-muted-foreground hover:bg-green-50 hover:text-green-700">
            <ImageIcon className="h-5 w-5 text-green-600" />
            Снимка/Видео
        </Button>
        
        <Button variant="ghost" size="sm" className="flex-1 gap-2 text-muted-foreground hover:bg-primary/10 hover:text-primary">
            <FileText className="h-5 w-5 text-primary" />
            Качи Документ
        </Button>
      </div>
    </div>
  );
}