"use client";

import { useState } from "react";
import { 
  MoreHorizontal, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  ThumbsUp,
  Trash2,
  Edit2,
  FileText,
  Download
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
import Link from "next/link";
import { cn, getInitials, getUserDisplayName, getUserUsername } from "@frontend/lib/utils";
import { PostDto } from "@frontend/lib/types/posts";
import { ReactionType } from "@frontend/lib/types/enums";
import { reactionService } from "@frontend/services/reaction-service";
import { get } from "http";

const REACTION_CONFIG = {
  [ReactionType.Like]: { icon: "👍", label: "Харесва ми", color: "text-blue-600" },
  [ReactionType.Love]: { icon: "❤️", label: "Любов", color: "text-red-600" },
  [ReactionType.Funny]: { icon: "😆", label: "Ха-ха", color: "text-yellow-500" },
  [ReactionType.Congrats]: { icon: "👏", label: "Браво", color: "text-green-600" },
  [ReactionType.Support]: { icon: "🤗", label: "Подкрепа", color: "text-purple-600" },
};

interface PostCardProps {
    post: PostDto;
    authorProfile?: any; 
}

export function PostCard({ post, authorProfile }: PostCardProps) {
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(post.userReaction ?? null);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isReactionMenuOpen, setIsReactionMenuOpen] = useState(false);

  let authorName = "Потребител";
  let avatarUrl = "";

  if (authorProfile) {
      authorName = getUserDisplayName(authorProfile);
      avatarUrl = authorProfile.authorAvatar || "";
  } else {
      authorName = post.authorName || "Потребител";
      avatarUrl = post.authorAvatar || "";
  }
  
  const isOwner = post.isOwner || false;
  const initials = getInitials(authorName);

  const username = post.username
  const profileUrl = `/${username}`;

  const documents = post.media?.filter(m => m.mediaType !== 0 && m.mediaType !== 1) || [];
  const visualMedia = post.media?.filter(m => m.mediaType === 0 || m.mediaType === 1) || [];

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

  const handleReaction = async (type: ReactionType) => {
    const oldReaction = currentReaction;
    const oldCount = likesCount;

    setIsReactionMenuOpen(false);

    if (currentReaction === type) {
        setCurrentReaction(null);
        setLikesCount(prev => Math.max(0, prev - 1));
    } else {
        setCurrentReaction(type);
        if (oldReaction === null) {
            setLikesCount(prev => prev + 1);
        }
    }

    try {
        await reactionService.reactToPost(post.id, type);
    } catch (error) {
        console.error("Failed to react", error);
        setCurrentReaction(oldReaction);
        setLikesCount(oldCount);
    }
  };

  const activeReactionConfig = currentReaction !== null ? REACTION_CONFIG[currentReaction] : null;

  return (
    <div className="bg-background rounded-xl border p-4 shadow-sm animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <Link href={profileUrl}>
            <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-primary text-white">
                  {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div>
            <Link href={profileUrl} className="hover:underline">
                <h4 className="font-semibold text-sm cursor-pointer">
                    {authorName}
                </h4>
            </Link>
            
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
                    <DropdownMenuItem className="cursor-pointer">
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

      {documents.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
            {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors group/file">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate text-foreground">
                            {doc.fileName || `Document-${idx + 1}`} 
                        </p>
                        <p className="text-xs text-muted-foreground">
                           {doc.fileName ? doc.fileName.split('.').pop()?.toUpperCase() : "DOC"}
                        </p>
                    </div>
                    
                    <a 
                        href={doc.url} 
                        download={doc.fileName || "document"} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-2 hover:bg-background rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Свали файл"
                    >
                        <Download className="h-4 w-4" />
                    </a>
                </div>
            ))}
        </div>
      )}

      {visualMedia.length > 0 && (
        <div className="mb-4 -mx-4 md:mx-0">
            {visualMedia.length === 1 ? (
                <div className="overflow-hidden md:rounded-lg border bg-muted">
                    {visualMedia[0].mediaType === 1 ? (
                        <video controls src={visualMedia[0].url} className="w-full h-auto max-h-[500px]" />
                    ) : (
                        <img src={visualMedia[0].url} alt="post content" className="w-full h-auto max-h-[500px] object-cover" />
                    )}
                </div>
            ) : (
                <Carousel className="w-full md:rounded-lg overflow-hidden border bg-muted">
                    <CarouselContent>
                        {visualMedia.map((item, index) => (
                            <CarouselItem key={index} className="basis-full">
                                <div className="flex items-center justify-center bg-black/5 aspect-video md:aspect-[4/3] overflow-hidden">
                                     {item.mediaType === 1 ? (
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

      <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1 min-h-[20px]">
          <div className="flex items-center gap-1">
            {likesCount > 0 && (
               <>
                 {activeReactionConfig 
                    ? <span>{activeReactionConfig.icon}</span>
                    : <span>👍</span>
                 }
                 <span>{likesCount}</span>
               </>
            )}
          </div>
          {post.commentsCount > 0 && <span>{post.commentsCount} коментара</span>}
      </div>

      <Separator />

      <div className="flex justify-between pt-2 relative">
         <div 
            className="flex-1 group relative"
            onMouseEnter={() => setIsReactionMenuOpen(true)}
            onMouseLeave={() => setIsReactionMenuOpen(false)}
         >
            {isReactionMenuOpen && (
                <div className="absolute bottom-full left-0 flex bg-background border shadow-lg rounded-full p-1 gap-1 animate-in slide-in-from-bottom-2 z-50"> 
                    {(Object.keys(REACTION_CONFIG) as unknown as ReactionType[]).map((type) => (
                        <button
                            key={type}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(Number(type));
                            }}
                            className="p-2 hover:bg-muted rounded-full transition-transform hover:scale-125 text-xl leading-none"
                        >
                            {REACTION_CONFIG[type].icon}
                        </button>
                    ))}
                </div>
            )}

            <Button 
                variant="ghost" 
                className={cn(
                    "w-full flex gap-2 items-center hover:bg-transparent transition-colors", 
                    activeReactionConfig ? activeReactionConfig.color : "text-muted-foreground"
                )}
                onClick={() => {
                    if (currentReaction !== null) {
                        handleReaction(currentReaction);
                    } else {
                        handleReaction(ReactionType.Like);
                    }
                }}
            >
                {activeReactionConfig ? (
                   <>
                     <span className="text-lg leading-none">{activeReactionConfig.icon}</span>
                     <span className="font-semibold">{activeReactionConfig.label}</span>
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