"use client";

import { useState } from "react";
import { 
  MoreHorizontal, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  ThumbsUp,
  Trash2,
  Edit2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Separator } from "@frontend/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@frontend/components/ui/carousel";
import { cn } from "@frontend/lib/utils";
import { PostDto, ReactionType } from "@frontend/lib/types/posts";

const REACTION_CONFIG = {
  [ReactionType.Like]: { icon: "👍", label: "Харесва ми", color: "text-blue-600" },
  [ReactionType.Love]: { icon: "❤️", label: "Любов", color: "text-red-600" },
  [ReactionType.Funny]: { icon: "😆", label: "Ха-ха", color: "text-yellow-500" },
  [ReactionType.Congrats]: { icon: "👏", label: "Браво", color: "text-green-600" },
  [ReactionType.Support]: { icon: "🤗", label: "Подкрепа", color: "text-purple-600" },
};

interface PostCardProps {
    post: PostDto;
}

export function PostCard({ post }: PostCardProps) {
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(post.userReaction || null);

  const authorName = post.authorName || "Unknown User";
  const avatarUrl = post.authorAvatar;
  const isOwner = post.isOwner || true;

  const getInitials = (name: string) => {
      const parts = name.split(" ").filter(Boolean);
      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(authorName);

    const getRelativeTime = (dateString: string) => {
    if (dateString.startsWith("0001")) return "Току-що";

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 5) return "Току-що";
    if (diffInSeconds < 60) return `преди ${diffInSeconds} сек.`;
    
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `преди ${minutes} мин.`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `преди ${hours} ч.`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `преди ${days} дни`;

    return date.toLocaleDateString("bg-BG", { day: "numeric", month: "long" });
};

interface PostCardProps {
    post: PostDto;
}


  const handleEdit = () => {
      console.log("Edit clicked");
  };

  const ActiveReactionIcon = currentReaction !== null ? REACTION_CONFIG[currentReaction] : null;

  return (
    <div className="bg-background rounded-xl border p-4 shadow-sm animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-sm cursor-pointer hover:underline">
                {authorName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {getRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">
              <Bookmark className="mr-2 h-4 w-4" /> Запази
            </DropdownMenuItem>
            
            {isOwner && (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                        <Edit2 className="mr-2 h-4 w-4" /> Редактиране
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Изтриване
                    </DropdownMenuItem>
                </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">
               Докладвай
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm mb-4 whitespace-pre-wrap text-foreground/90">
        {post.content}
      </p>

      {post.media && post.media.length > 0 && (
        <div className="mb-4 -mx-4 md:mx-0">
            {post.media.length === 1 ? (
                <div className="overflow-hidden md:rounded-lg border bg-muted">
                    {post.media[0].mediaType !== 0 ? (
                        <video controls src={post.media[0].url} className="w-full h-auto max-h-[500px]" />
                    ) : (
                        <img src={post.media[0].url} alt="post content" className="w-full h-auto max-h-[500px] object-cover" />
                    )}
                </div>
            ) : (
                <Carousel className="w-full md:rounded-lg overflow-hidden border bg-muted">
                    <CarouselContent>
                        {post.media.map((item, index) => (
                            <CarouselItem key={index} className="basis-full">
                                <div className="flex items-center justify-center bg-black/5 aspect-video md:aspect-[4/3] overflow-hidden">
                                     {item.mediaType !== 0 ? (
                                        <video controls src={item.url} className="w-full h-full object-contain" />
                                     ) : (
                                        <img src={item.url} alt={`slide-${index}`} className="w-full h-full object-cover" />
                                     )}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                </Carousel>
            )}
        </div>
      )}

      <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
          <div className="flex items-center gap-1">
            {currentReaction !== null && <span>{REACTION_CONFIG[currentReaction].icon}</span>}
            <span>{post.likesCount + (currentReaction !== null && !post.userReaction ? 1 : 0)}</span>
          </div>
          <span>{post.commentsCount} коментара</span>
      </div>

      <Separator />

      <div className="flex justify-between pt-2 relative">
         <div className="flex-1 group relative">
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-background border shadow-lg rounded-full p-1 gap-1 animate-in slide-in-from-bottom-2 z-50">
                {(Object.keys(REACTION_CONFIG) as unknown as ReactionType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setCurrentReaction(Number(type))}
                        className="p-2 hover:bg-muted rounded-full transition-transform hover:scale-125 text-xl leading-none"
                    >
                        {REACTION_CONFIG[type].icon}
                    </button>
                ))}
            </div>

            <Button 
                variant="ghost" 
                className={cn(
                    "w-full flex gap-2 items-center", 
                    currentReaction !== null ? ActiveReactionIcon?.color : "text-muted-foreground"
                )}
                onClick={() => setCurrentReaction(currentReaction ? null : ReactionType.Like)}
            >
                {currentReaction !== null ? (
                   <>
                     <span className="text-lg leading-none">{ActiveReactionIcon?.icon}</span>
                     <span className="font-semibold">{ActiveReactionIcon?.label}</span>
                   </>
                ) : (
                   <>
                     <ThumbsUp className="h-4 w-4" />
                     <span>Харесване</span>
                   </>
                )}
            </Button>
         </div>

         <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4" /> Коментар
         </Button>
         <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground">
            <Share2 className="h-4 w-4" /> Споделяне
         </Button>
      </div>
    </div>
  );
}