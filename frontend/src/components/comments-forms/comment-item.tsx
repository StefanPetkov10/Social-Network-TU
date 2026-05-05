"use client";

import { useState } from "react";
import Link from "next/link"; 
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { CommentDto } from "@frontend/lib/types/comment";
import { getInitials } from "@frontend/lib/utils";
import { MediaType } from "@frontend/lib/types/enums";
import { CommentInput } from "./comment-input"; 
import { useProfile } from "@frontend/hooks/use-profile"; 
import { useGetReplies, useDeleteComment } from "@frontend/hooks/use-comments"; 
import { ReactionListDialog } from "../reaction-dialog/reaction-list-dialog";

import { 
    Loader2, 
    CornerDownRight, 
    FileText, 
    Download, 
    MoreVertical, 
    Pencil, 
    Trash 
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
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

import { reactionService } from "@frontend/services/reaction-service";
import { ReactionButton, REACTION_CONFIG } from "@frontend/components/ui/reaction-button";
import { useReaction } from "@frontend/hooks/use-reaction";

interface CommentItemProps {
    comment: CommentDto;
}

export function CommentItem({ comment }: CommentItemProps) {
    const { data: currentUser } = useProfile();
    const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment(); 
    
    const [isReplying, setIsReplying] = useState(false);
    const [areRepliesOpen, setAreRepliesOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false); 
    const [isReactionListOpen, setIsReactionListOpen] = useState(false);

    const { currentReaction, likesCount, handleReaction } = useReaction({
        initialReaction: comment.userReaction ?? null, 
        initialCount: comment.likesCount || 0,        
        entityId: comment.id,
        reactApiCall: (id, type) => reactionService.reactToComment(id, type) 
    });

    const isOwner = currentUser?.id === comment.profileId; 
    const isCurrentUser = currentUser?.id === comment.profileId;
    
    const authorUsername = (comment as any).authorUsername; 
    
    const authorProfileUrl = isCurrentUser 
        ? "/profile" 
        : (authorUsername ? `/${authorUsername}` : "#");

    const isVideo = comment.media?.mediaType === MediaType.Video; 
    const isDocument = comment.media?.mediaType === MediaType.Document; 

    const displayReactionType = currentReaction ?? comment.topReactionType ?? 0;
    const displayReactionConfig = REACTION_CONFIG[displayReactionType];

    const { 
        data, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading 
    } = useGetReplies(comment.id, areRepliesOpen);

    const fetchedReplies = data?.pages.flatMap((page) => page.data || []) || [];
    const displayReplies = fetchedReplies.length > 0 ? fetchedReplies : (comment.repliesPreview || []);
    
    const canReply = comment.depth < 2; 
    const hasReplies = comment.repliesCount > 0 || displayReplies.length > 0;

    const handleReplySuccess = () => {
        setIsReplying(false); 
        setAreRepliesOpen(true); 
    };

    const handleEditSuccess = () => {
        setIsEditing(false);
    };

    const confirmDelete = () => {
        deleteComment({ 
            commentId: comment.id, 
            postId: comment.postId,
            parentCommentId: comment.parentCommentId || undefined
        }, {
            onSuccess: () => setShowDeleteDialog(false)
        });
    };

    return (
        <div className="flex flex-col w-full group/comment">
            <div className="flex gap-2 mb-2 animate-in fade-in duration-300">
                <Link href={authorProfileUrl} className="mt-1">
                    <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={comment.authorAvatar || ""} />
                        <AvatarFallback className="bg-primary text-white text-xs">
                            {getInitials(comment.authorName)}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                
                <div className="flex flex-col flex-1 max-w-[90%]">
                    
                    {isEditing ? (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <CommentInput
                                postId={comment.postId}
                                commentId={comment.id}
                                initialContent={comment.content}
                                initialMedia={comment.media}
                                currentUserAvatar={currentUser?.authorAvatar}
                                currentUserName={currentUser?.fullName}
                                mode="edit"
                                onCancel={() => setIsEditing(false)}
                                onSuccess={handleEditSuccess}
                                autoFocus={true}
                            />
                        </div>
                    ) : (
                        <div className="group/bubble relative flex items-start gap-2">
                             <div className="bg-muted/40 rounded-2xl p-2 px-3 w-fit min-w-[120px] relative">
                                <Link href={authorProfileUrl} className="font-bold text-xs block text-foreground cursor-pointer hover:underline mb-0.5 w-fit">
                                    {comment.authorName}
                                </Link>
                                
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
                                    {comment.content}
                                </p>

                                {likesCount > 0 && (
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsReactionListOpen(true);
                                        }}
                                        className="absolute -bottom-2 -right-1 z-10 bg-background border shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-muted/80 transition-colors"
                                    >
                                        <span className="text-[10px] leading-none filter drop-shadow-sm">
                                            {displayReactionConfig ? displayReactionConfig.icon : "👍"}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground leading-none">
                                            {likesCount}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {isOwner && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="opacity-0 group-hover/bubble:opacity-100 transition-opacity focus:opacity-100 outline-none data-[state=open]:opacity-100">
                                        <div className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors cursor-pointer mt-2">
                                            <MoreVertical className="h-4 w-4" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer gap-2">
                                            <Pencil className="h-3.5 w-3.5" /> Редактиране
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem 
                                            onClick={() => setShowDeleteDialog(true)} 
                                            className="cursor-pointer text-destructive focus:text-destructive gap-2"
                                        >
                                            <Trash className="h-3.5 w-3.5" /> Изтриване
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    )}
                    
                    {!isEditing && comment.media && (
                        <div className="mt-1">
                            {isDocument ? (
                                <div className="flex items-center p-2 border rounded-lg bg-background max-w-[250px] group/file hover:bg-muted/50 transition-colors shadow-sm mt-1">
                                    <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-2 shrink-0 border border-red-200">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 overflow-hidden min-w-0">
                                        <p className="text-xs font-semibold truncate text-foreground hover:text-blue-600 cursor-pointer">
                                            <a href={comment.media.url} target="_blank" rel="noopener noreferrer">
                                                {comment.media.fileName || comment.media.url.split('/').pop() || "Документ"}
                                            </a>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase">Файл</p>
                                    </div>
                                    <a href={comment.media.url} download className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80">
                                        <Download className="h-4 w-4" />
                                    </a>
                                </div>
                            ) : (
                                <div className="rounded-xl overflow-hidden border bg-black/5 max-w-[250px] relative group/media mt-1">
                                    {isVideo ? (
                                         <div className="relative">
                                            <video src={comment.media.url} controls className="w-full h-auto" />
                                         </div>
                                    ) : (
                                        <a href={comment.media.url} target="_blank" rel="noreferrer">
                                            <img src={comment.media.url} alt="Прикачен файл" className="w-full h-auto object-cover hover:opacity-95 transition-opacity cursor-zoom-in" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!isEditing && (
                        <div className="flex gap-3 px-2 mt-1 text-[11px] text-muted-foreground font-medium items-center">
                            <span>{comment.createdDate ? formatDistanceToNow(new Date(comment.createdDate), { addSuffix: true, locale: bg }) : "наскоро"}</span>
                            
                            <ReactionButton 
                                currentReaction={currentReaction}
                                likesCount={likesCount}
                                onReact={handleReaction}
                                isComment={true}
                            />
                            
                            {canReply && (
                                <button 
                                    className="hover:underline hover:text-foreground cursor-pointer font-semibold"
                                    onClick={() => setIsReplying(!isReplying)}
                                >
                                    Отговор
                                </button>
                            )}

                            {comment.repliesCount > 0 && !areRepliesOpen && (
                                 <button 
                                    className="hover:underline hover:text-foreground cursor-pointer ml-1 flex items-center gap-1 font-semibold"
                                    onClick={() => setAreRepliesOpen(true)}
                                 >
                                    <CornerDownRight className="h-3 w-3" />
                                    {comment.repliesCount} отговора
                                 </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="pl-10 relative">
                {hasReplies && areRepliesOpen && (
                    <div className="absolute left-4 top-0 bottom-4 w-px bg-border/40 hidden sm:block" />
                )}

                {areRepliesOpen && (
                    <div className="flex flex-col gap-1">
                        {isLoading && fetchedReplies.length === 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 pl-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Зареждане...
                            </div>
                        )}

                        {displayReplies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} />
                        ))}

                        {hasNextPage && (
                            <button 
                                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold py-2 pl-2 text-left flex items-center gap-2 mt-1"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage ? <Loader2 className="h-3 w-3 animate-spin" /> : <CornerDownRight className="h-3 w-3" />}
                                Виж още отговори...
                            </button>
                        )}
                    </div>
                )}

                {isReplying && (
                    <div className="mt-2 mb-3 animate-in fade-in slide-in-from-top-1">
                        <CommentInput 
                            postId={comment.postId} 
                            currentUserAvatar={currentUser?.authorAvatar}
                            currentUserName={currentUser?.fullName}
                            parentCommentId={comment.id}
                            onCancel={() => setIsReplying(false)}
                            onSuccess={handleReplySuccess}
                            autoFocus={true}
                        />
                    </div>
                )}
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Изтриване на коментар?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Сигурни ли сте, че искате да изтриете този коментар? 
                            Това действие е необратимо и ще премахне всички отговори към него.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Отказ</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault(); 
                                confirmDelete();
                            }} 
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Изтрий
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isReactionListOpen && (
                <ReactionListDialog 
                    open={isReactionListOpen}
                    onOpenChange={setIsReactionListOpen}
                    entityId={comment.id}
                    entityType="comment"
                />
            )}
        </div>
    );
}