"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@frontend/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Separator } from "@frontend/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@frontend/components/ui/carousel";
import { 
    FileText, 
    Download, 
    MoreHorizontal, 
    X, 
    MessageCircle, 
    Share2, 
    Loader2 
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";

import { PostDto } from "@frontend/lib/types/posts";
import { ProfileDto } from "@frontend/lib/types/profile";
import { getInitials } from "@frontend/lib/utils";
import { useGetComments } from "@frontend/hooks/use-comments";
import { CommentInput } from "./comment-input"; 
import { CommentItem } from "./comment-item";

import { reactionService } from "@frontend/services/reaction-service";
import { useReaction } from "@frontend/hooks/use-reaction";
import { ReactionButton, REACTION_CONFIG } from "@frontend/components/ui/reaction-button";

interface PostCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostDto;
  currentUser: ProfileDto;
}

export function PostCommentDialog({ open, onOpenChange, post, currentUser }: PostCommentDialogProps) {
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useGetComments(post.id);
  const comments = data?.pages.flatMap((page) => page.data) || [];

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
  const authorProfileUrl = authorUsername ? `/${authorUsername}` : "#";
  
  const isGroupPost = !!post.groupId && post.groupId !== "00000000-0000-0000-0000-000000000000";
  const groupName = post.groupName || "Unknown Group";
  const groupUrl = `/groups/${encodeURIComponent(groupName)}`; 
  const groupInitials = getInitials(groupName);

  const documents = post.media?.filter(m => m.mediaType !== 0 && m.mediaType !== 1) || [];
  const visualMedia = post.media?.filter(m => m.mediaType === 0 || m.mediaType === 1) || [];
  
  const activeReactionConfig = currentReaction !== null ? REACTION_CONFIG[currentReaction] : null;

  const getRelativeTime = (dateString: string) => {
     try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: bg });
     } catch {
        return "наскоро";
     }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl h-[85vh] p-0 gap-0 bg-background flex flex-col overflow-hidden shadow-2xl border-none outline-none">
        
        <DialogHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 shrink-0 bg-background z-20 h-14">
            <DialogTitle className="flex-1 text-center font-bold text-base truncate px-8">
                {isGroupPost ? `Публикация в ${groupName}` : `Публикацията на ${authorName}`}
            </DialogTitle>
            <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full absolute right-3 top-3 bg-muted/50 hover:bg-muted">
                    <X className="h-4 w-4 text-foreground" />
                    <span className="sr-only">Затвори</span>
                </Button>
            </DialogClose>
        </DialogHeader>

        <div className="flex-1 w-full bg-background overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="flex flex-col min-h-full pb-4">
                
                <div className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
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
                                            <span>{getRelativeTime(post.createdAt)}</span>
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
                                          {getRelativeTime(post.createdAt)}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>

                    {post.content && (
                        <div className="mb-3">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                                {post.content}
                            </p>
                        </div>
                    )}
                </div>

                {visualMedia.length > 0 && (
                    <div className="w-full bg-black/5 border-y mb-0 flex items-center justify-center relative overflow-hidden">
                        <Carousel className="w-full max-h-[40vh]">
                            <CarouselContent>
                                {visualMedia.map((item, index) => (
                                    <CarouselItem key={index} className="flex justify-center bg-transparent">
                                        <div className="relative w-full h-full max-h-[40vh] flex items-center justify-center py-1">
                                            {item.mediaType === 1 ? (
                                                <video
                                                    controls
                                                    src={item.url}
                                                    className="max-h-[40vh] w-auto max-w-full object-contain shadow-sm"
                                                    style={{ maxHeight: '40vh' }}
                                                />
                                            ) : (
                                                <img
                                                    src={item.url}
                                                    alt={`post-img-${index}`}
                                                    className="h-auto w-auto max-h-[40vh] max-w-full object-contain shadow-sm"
                                                    style={{ maxHeight: '40vh' }}
                                                />
                                            )}
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {visualMedia.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2 bg-white/80 hover:bg-white text-black border-none h-8 w-8" />
                                    <CarouselNext className="right-2 bg-white/80 hover:bg-white text-black border-none h-8 w-8" />
                                </>
                            )}
                        </Carousel>
                    </div>
                )}

                {documents.length > 0 && (
                    <div className="px-4 py-2 mt-2">
                        <div className="flex flex-col gap-2">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center p-2 border rounded-lg bg-muted/30 group hover:bg-muted/50 transition-colors">
                                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3 shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden min-w-0">
                                        <p className="text-sm font-medium truncate">{doc.fileName || `Файл ${idx+1}`}</p>
                                        <p className="text-[10px] text-muted-foreground">PDF</p>
                                    </div>
                                    <a href={doc.url} download className="p-2 text-muted-foreground hover:text-foreground">
                                        <Download className="h-4 w-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-4 bg-background mt-2">
                    {(likesCount > 0 || post.commentsCount > 0) && (
                        <>
                            <div className="flex justify-between items-center text-xs text-muted-foreground py-2">
                                <div className="flex items-center gap-1">
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
                                {post.commentsCount > 0 && <span>{post.commentsCount} коментара</span>}
                            </div>
                            <Separator />
                        </>
                    )}
                    
                    <div className="flex justify-between py-1 relative">
                         <div className="flex-1">
                             <ReactionButton 
                                currentReaction={currentReaction}
                                likesCount={likesCount}
                                onReact={handleReaction}
                                isComment={false}
                             />
                         </div>

                         <Button variant="ghost" className="flex-1 text-muted-foreground hover:text-foreground h-10 rounded-none hover:bg-muted/50">
                            <MessageCircle className="h-4 w-4 mr-2"/> Коментар
                         </Button>
                         <Button variant="ghost" className="flex-1 text-muted-foreground hover:text-foreground h-10 rounded-none hover:bg-muted/50">
                            <Share2 className="h-4 w-4 mr-2"/> Споделяне
                         </Button>
                    </div>
                    
                    <Separator className="mb-2" />
                </div>

                <div className="px-4 pb-4 w-full">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                        </div>
                    )}

                    {!isLoading && comments.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/60 gap-1 animate-in fade-in">
                             <div className="bg-muted/30 p-4 rounded-full mb-2 opacity-70">
                                <MessageCircle className="h-6 w-6" />
                             </div>
                             <p className="font-medium text-sm">Все още няма коментари.</p>
                             <p className="text-xs">Напишете първия коментар!</p>
                        </div>
                    )}

                    {!isLoading && comments.length > 0 && (
                        <div className="flex flex-col gap-0 mt-2">
                            <h3 className="text-sm font-semibold mb-3 text-foreground/80">Коментари</h3>

                            {hasNextPage && (
                               <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-xs font-semibold text-primary mb-4 self-start hover:underline p-0 h-auto"
                                  onClick={() => fetchNextPage()} 
                                  disabled={isFetchingNextPage}
                               >
                                  {isFetchingNextPage && <Loader2 className="h-3 w-3 mr-2 animate-spin"/>}
                                  Виж предишни коментари...
                               </Button>
                            )}
                            
                            {comments.map(comment => comment && (
                                <CommentItem key={comment.id} comment={comment} />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>

        <div className="p-3 bg-background border-t shrink-0 w-full z-30 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
             <CommentInput 
                postId={post.id} 
                currentUserAvatar={currentUser?.authorAvatar}
                currentUserName={currentUser?.fullName}
             />
        </div>

      </DialogContent>
    </Dialog>
  );
}