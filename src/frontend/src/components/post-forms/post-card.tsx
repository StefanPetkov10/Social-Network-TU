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
  Download,
  Loader2,
  FileSpreadsheet,
  FilePieChart,
  FileArchive,
  FileIcon,
  File
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
import { cn, getInitials, getFileDetails } from "@frontend/lib/utils";
import { PostDto } from "@frontend/lib/types/posts";
import { ProfileDto } from "@frontend/lib/types/profile";
import { useProfile } from "@frontend/hooks/use-profile";
import { PostCommentDialog } from "../comments-forms/post-comment-dialog"; 

import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

import { reactionService } from "@frontend/services/reaction-service";
import { useReaction } from "@frontend/hooks/use-reaction";
import { ReactionButton, REACTION_CONFIG } from "@frontend/components/ui/reaction-button";
import { ReactionListDialog } from "../reaction-dialog/reaction-list-dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@frontend/components/ui/alert-dialog";
import { useDeletePost } from "@frontend/hooks/use-post";
import { EditPostDialog } from "./edit-post-dialog";

interface PostCardProps {
    post: PostDto;
    authorProfile?: ProfileDto; 
    hideGroupInfo?: boolean; 
    isPreview?: boolean;
    isGroupAdmin?: boolean; 
}

export function PostCard({ 
    post, 
    authorProfile, 
    hideGroupInfo, 
    isPreview = false,
    isGroupAdmin = false 
}: PostCardProps) {
  const { data: currentUser } = useProfile();
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isReactionListOpen, setIsReactionListOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();

  const { currentReaction, likesCount, handleReaction } = useReaction({
      initialReaction: post.userReaction ?? null,
      initialCount: post.likesCount,
      entityId: post.id,
      reactApiCall: (id, type) => reactionService.reactToPost(id, type)
  });

  const authorName = post.authorName || "Потребител";
  const authorAvatarUrl = post.authorAvatar || "";
  const authorInitials = getInitials(authorName);
  const authorUsername = post.username;
  const isCurrentUser = authorProfile?.username === authorUsername;
  const authorProfileUrl = isCurrentUser 
      ? "/profile" 
      : (authorUsername ? `/${authorUsername}` : "#");

  const isGroupPost = !hideGroupInfo && !!post.groupId && post.groupId !== "00000000-0000-0000-0000-000000000000";
  const groupName = post.groupName || "Unknown Group";
  const groupUrl = `/groups/${encodeURIComponent(groupName)}`; 
  const groupInitials = getInitials(groupName);

  const isOwner = post.isOwner || false;
 
  const canDelete = isOwner || isGroupAdmin;

  const documents = post.media?.filter(m => m.mediaType !== 0 && m.mediaType !== 1) || [];
  const visualMedia = post.media?.filter(m => m.mediaType === 0 || m.mediaType === 1) || [];

  const activeReactionConfig = currentReaction !== null ? REACTION_CONFIG[currentReaction] : null;

  return (
    <>
    <div className={cn(
        "bg-background rounded-xl border p-4 shadow-sm animate-in fade-in zoom-in duration-300",
        isPreview && "border-none shadow-none"
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          {isGroupPost ? (
            <div className="relative w-10 h-10"> 
               <Link href={groupUrl}>
                 <Avatar className="w-10 h-10 border border-border shadow-sm cursor-pointer hover:opacity-90 rounded-xl">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xs rounded-xl">
                        {groupInitials}
                    </AvatarFallback>
                 </Avatar>
               </Link>
               <Link href={authorProfileUrl}>
                 <Avatar className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-2 border-background cursor-pointer hover:scale-110 transition-transform ring-1 ring-white">
                    <AvatarImage src={authorAvatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary text-white text-[8px]">
                        {authorInitials}
                    </AvatarFallback>
                 </Avatar>
               </Link>
            </div>
          ) : (
            <Link href={authorProfileUrl}>
                <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={authorAvatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white">
                      {authorInitials}
                  </AvatarFallback>
                </Avatar>
            </Link>
          )}

          <div className="flex flex-col justify-center">
            {isGroupPost ? (
                <div className="leading-tight">
                    <Link href={groupUrl} className="hover:underline block">
                        <h4 className="font-bold text-sm cursor-pointer text-foreground line-clamp-1">
                            {groupName}
                        </h4>
                    </Link>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Link href={authorProfileUrl} className="hover:underline font-semibold text-foreground/70">
                            {authorName}
                        </Link>
                        <span>•</span>
                        <span>
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: bg })}
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    <Link href={authorProfileUrl} className="hover:underline">
                        <h4 className="font-semibold text-sm cursor-pointer">
                            {authorName}
                        </h4>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: bg })}
                    </p>
                </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">
              <Bookmark className="mr-2 h-4 w-4" /> Запази
            </DropdownMenuItem>
            
            {canDelete && (
                <>
                    <DropdownMenuSeparator />
                    
                    {isOwner && (
                        <DropdownMenuItem 
                            className="cursor-pointer"
                            onSelect={() => {
                                setTimeout(() => setIsEditOpen(true), 0); 
                            }}
                        >
                            <Edit2 className="mr-2 h-4 w-4" /> Редактиране
                        </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                        onSelect={(e) => {
                            e.preventDefault(); 
                            setIsDeleteDialogOpen(true);
                        }}
                    >
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

      <p className="text-sm mb-4 whitespace-pre-wrap text-foreground/90 leading-relaxed">
        {post.content}
      </p>

      {documents.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
            {documents.map((doc, idx) => {
                const { Icon, colorClass } = getFileDetails(doc.fileName);
                return (
                    <div key={idx} className="flex items-center p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group/file">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                            <Icon />
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0 ml-3">
                            <p className="text-sm font-medium truncate text-foreground">
                                {doc.fileName || `Document-${idx + 1}`} 
                            </p>
                            <p className="text-xs text-muted-foreground">
                            {doc.fileName ? doc.fileName.split('.').pop()?.toUpperCase() : "DOC"}
                            </p>
                        </div>
                        <a href={doc.url} download className="p-2 text-muted-foreground hover:text-foreground">
                            <Download className="h-4 w-4" />
                        </a>
                    </div>
                );
            })}
        </div>
      )}

      {visualMedia.length > 0 && (
        <div className="mb-4 -mx-4 md:mx-0">
          {visualMedia.length === 1 ? (
            <div className="flex justify-center items-center md:rounded-lg overflow-hidden relative bg-transparent">
              {visualMedia[0].mediaType === 1 ? (
                <video controls src={visualMedia[0].url} className="w-full h-auto max-h-[60vh] md:rounded-lg border" />
              ) : (
                <img src={visualMedia[0].url} alt="post content" className="w-auto h-auto max-w-full max-h-[60vh] mx-auto md:rounded-lg border" />
              )}
            </div>
          ) : (
            <Carousel className="w-full md:rounded-lg overflow-hidden border">
              <CarouselContent>
                {visualMedia.map((item, index) => (
                 <CarouselItem key={index} className="basis-full">
                    <div className="flex items-center justify-center relative w-full h-full bg-transparent">
                        {item.mediaType === 1 ? (
                        <video controls src={item.url} className="w-full h-auto max-h-[600px] object-contain" />
                        ) : (
                        <img src={item.url} alt={`slide-${index}`} className="w-full h-auto max-h-[600px] object-contain" />
                        )}
                    </div>
                </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-white/80 hover:bg-white text-black shadow-sm border-none" />
              <CarouselNext className="right-2 bg-white/80 hover:bg-white text-black shadow-sm border-none" />
            </Carousel>
          )}
        </div>
      )}

      <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1 min-h-[20px]">
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => likesCount > 0 && setIsReactionListOpen(true)}
          >
            {likesCount > 0 && (
               <>
                 {activeReactionConfig 
                    ? <span className="text-sm">{activeReactionConfig.icon}</span>
                    : <span className="text-sm">👍</span>
                 }
                 <span className="ml-1">{likesCount}</span>
               </>
            )}
          </div>
          {post.commentsCount > 0 && (
            <span 
                className={cn(
                    "transition-colors",
                    !isPreview && "cursor-pointer hover:text-foreground"
                )}
                onClick={() => !isPreview && setIsCommentDialogOpen(true)}
            >
                {post.commentsCount} коментара
            </span>
          )}
      </div>

      <Separator />

      {!isPreview && (
          <div className="flex justify-between pt-1 relative">
             <div className="flex-1">
                 <ReactionButton 
                    currentReaction={currentReaction}
                    likesCount={likesCount} 
                    onReact={handleReaction}
                    isComment={false} 
                 />
             </div>
    
             <Button 
                variant="ghost" 
                className="flex-1 gap-2 text-muted-foreground hover:bg-muted/50 py-6"
                onClick={() => setIsCommentDialogOpen(true)}
             >
                <MessageCircle className="h-4 w-4" /> Коментар
             </Button>
             
             <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:bg-muted/50 py-6">
                <Share2 className="h-4 w-4" /> Споделяне
             </Button>
          </div>
      )}
    </div>

    {!isPreview && currentUser && (
        <>
            <PostCommentDialog 
                open={isCommentDialogOpen} 
                onOpenChange={setIsCommentDialogOpen}
                post={post}
                currentUser={currentUser}
                parentReaction={currentReaction}
                parentLikesCount={likesCount}
            />
            
            {isReactionListOpen && (
                <ReactionListDialog 
                    open={isReactionListOpen}
                    onOpenChange={setIsReactionListOpen}
                    entityId={post.id}
                    isComment={false}
                />
            )}
        </>
    )}

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle>Изтриване на публикация?</AlertDialogTitle>
                <AlertDialogDescription>
                    Сигурни ли сте, че искате да изтриете тази публикация? Това действие е необратимо.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Отказ</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={(e) => {
                        e.preventDefault();
                        deletePost(post.id, {
                            onSuccess: () => setIsDeleteDialogOpen(false)
                        });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    disabled={isDeleting}
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                    Изтрий
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {isOwner && (
        <EditPostDialog 
            open={isEditOpen} 
            onOpenChange={setIsEditOpen} 
            post={post} 
        />
    )}
    </>
  );
}