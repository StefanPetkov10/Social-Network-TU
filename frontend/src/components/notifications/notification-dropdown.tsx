"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ThumbsUp, MessageCircle, Heart, UserPlus, Users, CheckCircle, Loader2, UserCheck, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@frontend/components/ui/dialog";
import { useIntersection } from "@mantine/hooks";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";
import { cn } from "@frontend/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

import { 
    useInfiniteNotifications, 
    useUnseenNotificationsCount, 
    useMarkAllAsSeen, 
    useMarkAsRead 
} from "@frontend/hooks/use-notifications";
import { usePostForNotification } from "@frontend/hooks/use-post"; 
import { useProfile } from "@frontend/hooks/use-profile";
import { useInfiniteFriendRequests, useAcceptFriendRequest, useDeclineFriendRequest } from "@frontend/hooks/use-friends";
import { useFollowUser } from "@frontend/hooks/use-followers";
import { useApproveMember, useRejectMember } from "@frontend/hooks/use-group-members";
import { groupsService } from "@frontend/services/groups-service";
import { friendsService } from "@frontend/services/friends-service";
import { NotificationType } from "@frontend/lib/types/enums";
import { PostCommentDialog } from "@frontend/components/comments-forms/post-comment-dialog";

function NotificationPostWrapper({ notification, onClose }: { notification: any, onClose: () => void }) {
    const { data: response, isLoading: isPostLoading } = usePostForNotification(notification);
    const { data: currentUser, isLoading: isUserLoading } = useProfile();

    const post =  response; 

    if (isPostLoading || isUserLoading) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[600px] flex flex-col items-center justify-center h-64 border-none">
                    <DialogTitle className="sr-only">Зареждане на публикация</DialogTitle>
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Зареждане на публикацията...</p>
                </DialogContent>
            </Dialog>
        );
    }

    if (!post || !currentUser) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[400px] flex items-center justify-center h-32 border-none">
                    <DialogTitle className="sr-only">Публикацията не е намерена</DialogTitle>
                    <p className="text-muted-foreground font-medium">Тази публикация вече не е налична.</p>
                </DialogContent>
            </Dialog>
        );
    }

    let initialReactionConfig = null;
    if (notification.type === NotificationType.PostReaction) {
        initialReactionConfig = { entityId: notification.referenceId, entityType: 'post' as const };
    } else if (notification.type === NotificationType.CommentReaction) {
        initialReactionConfig = { entityId: notification.referenceId, entityType: 'comment' as const };
    }

    return (
        <PostCommentDialog 
            open={true} 
            onOpenChange={(open) => !open && onClose()} 
            post={post} 
            currentUser={currentUser} 
            initialReactionConfig={initialReactionConfig}
        />
    );
}

function NotificationDropdownItem({ notification, onClick }: { notification: any, onClick: (n: any) => void }) {
    const queryClient = useQueryClient();
    const [actionStatus, setActionStatus] = useState<'none' | 'accepted' | 'declined' | 'followed'>('none');
    
    const { data: requestsData } = useInfiniteFriendRequests();

    const { mutate: acceptFriend, isPending: isAccepting } = useAcceptFriendRequest();
    const { mutate: declineFriend, isPending: isDeclining } = useDeclineFriendRequest();
    const { mutate: followUser, isPending: isFollowing } = useFollowUser();
    const { mutate: approveGroup, isPending: isApproving } = useApproveMember();
    const { mutate: rejectGroup, isPending: isRejecting } = useRejectMember();

    const timeAgo = formatDistanceToNow(new Date(notification.updatedDate ?? notification.createdDate), { addSuffix: true, locale: bg });
    const name = <span className="font-semibold text-foreground">{notification.triggeredByName}</span>;
    const others = notification.count > 1 ? ` и ${notification.count - 1} други` : "";

    let details = { icon: <Bell className="w-3 h-3 text-white" />, bg: "bg-gray-500", text: <>{name} взаимодейства с теб.</> };

    switch (notification.type) {
        case NotificationType.PostReaction:
            details = { icon: <ThumbsUp className="w-3 h-3 text-white" />, bg: "bg-blue-500", text: <>{name}{others} реагираха на твоя публикация.</> }; break;
        case NotificationType.CommentReaction:
            details = { icon: <Heart className="w-3 h-3 text-white" />, bg: "bg-red-500", text: <>{name}{others} харесаха твоя коментар.</> }; break;
        case NotificationType.PostComment:
            details = { icon: <MessageCircle className="w-3 h-3 text-white fill-white" />, bg: "bg-green-500", text: <>{name}{others} коментираха твоята публикация.</> }; break;
        case NotificationType.NewFollower:
            details = { icon: <UserPlus className="w-3 h-3 text-white" />, bg: "bg-blue-500", text: <>{name} започна да те следва.</> }; break;
        case NotificationType.FriendRequest:
            details = { icon: <UserPlus className="w-3 h-3 text-white" />, bg: "bg-blue-500", text: <>{name} ти изпрати покана за приятелство.</> }; break;
        case NotificationType.FriendAccept:
            details = { icon: <Users className="w-3 h-3 text-white" />, bg: "bg-green-500", text: <>{name} прие твоята покана за приятелство.</> }; break;
        case NotificationType.GroupJoinRequest:
            details = { icon: <Users className="w-3 h-3 text-white" />, bg: "bg-orange-500", text: <>{name} иска да се присъедини към твоята група.</> }; break;
        case NotificationType.GroupJoinAccept:
            details = { icon: <CheckCircle className="w-3 h-3 text-white" />, bg: "bg-green-500", text: <>Твоята заявка за групата беше одобрена.</> }; break;
    }

    const getFriendRequestId = async () => {
        const loadedRequests = requestsData?.pages.flatMap((p: any) => p.data || []) || [];
        const matchingReq = loadedRequests.find((req: any) => 
            req.requesterId === notification.triggeredById || req.profileId === notification.triggeredById
        );
        let requestId = matchingReq?.pendingRequestId || matchingReq?.id;

        if (!requestId) {
            try {
                const res = await queryClient.fetchQuery({
                    queryKey: ["temp-requests-fetch"],
                    queryFn: () => friendsService.getFriendRequests(null, 50)
                });
                const fetchedRequests = res?.data || [];
                const found = fetchedRequests.find((r: any) => 
                    r.requesterId === notification.triggeredById || r.profileId === notification.triggeredById
                );
                requestId = found?.pendingRequestId;
            } catch (error) { console.error(error); }
        }
        return requestId;
    };

    const handleAcceptFriend = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const requestId = await getFriendRequestId();
        if (!requestId) return toast.error("Тази покана вече не е валидна или е приета.");
        acceptFriend(requestId, { 
            onSuccess: () => {
                setActionStatus('accepted');
                queryClient.invalidateQueries({ queryKey: ["friend-requests-infinite"] });
                queryClient.invalidateQueries({ queryKey: ["my-friends-infinite"] });
            } 
        });
    };

    const handleDeclineFriend = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const requestId = await getFriendRequestId();
        if (!requestId) return toast.error("Тази покана вече не е валидна.");
        declineFriend(requestId, { 
            onSuccess: () => {
                setActionStatus('declined');
                queryClient.invalidateQueries({ queryKey: ["friend-requests-infinite"] });
            } 
        });
    };

    const handleFollowBack = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!notification.triggeredById) return toast.error("Невалиден потребител.");
        followUser(notification.triggeredById, { onSuccess: () => setActionStatus('followed') });
    };

    const handleApproveGroup = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!notification.referenceId || !notification.triggeredById) return toast.error("Невалидна заявка.");
        approveGroup({ groupId: notification.referenceId, profileId: notification.triggeredById }, { onSuccess: () => setActionStatus('accepted') });
    };

    const handleRejectGroup = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!notification.referenceId || !notification.triggeredById) return toast.error("Невалидна заявка.");
        rejectGroup({ groupId: notification.referenceId, profileId: notification.triggeredById }, { onSuccess: () => setActionStatus('declined') });
    };

    let actionButtons = null;
    if (actionStatus === 'none') {
        if (notification.type === NotificationType.FriendRequest) {
            actionButtons = (
                <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-7 px-3 text-xs bg-primary text-white" disabled={isAccepting} onClick={handleAcceptFriend}>
                        {isAccepting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Потвърди"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs" disabled={isDeclining} onClick={handleDeclineFriend}>
                        {isDeclining ? <Loader2 className="w-3 h-3 animate-spin" /> : "Изтрий"}
                    </Button>
                </div>
            );
        } else if (notification.type === NotificationType.NewFollower) {
            actionButtons = (
                <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-7 px-3 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200" disabled={isFollowing} onClick={handleFollowBack}>
                        {isFollowing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Последвай също"}
                    </Button>
                </div>
            );
        } else if (notification.type === NotificationType.GroupJoinRequest) {
            actionButtons = (
                <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-7 px-3 text-xs bg-primary text-white" disabled={isApproving} onClick={handleApproveGroup}>
                        {isApproving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Одобри"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs" disabled={isRejecting} onClick={handleRejectGroup}>
                        {isRejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Отхвърли"}
                    </Button>
                </div>
            );
        }
    }

    let statusMessage = null;
    if (actionStatus === 'accepted') statusMessage = <span className="flex items-center text-xs text-green-600 font-medium mt-1.5"><UserCheck className="w-3 h-3 mr-1" /> Одобрено</span>;
    if (actionStatus === 'declined') statusMessage = <span className="flex items-center text-xs text-red-500 font-medium mt-1.5"><X className="w-3 h-3 mr-1" /> Отхвърлено</span>;
    if (actionStatus === 'followed') statusMessage = <span className="flex items-center text-xs text-blue-600 font-medium mt-1.5"><UserCheck className="w-3 h-3 mr-1" /> Последван</span>;

    return (
        <div 
            onClick={() => onClick(notification)}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${!notification.isRead ? 'bg-accent/30' : ''}`}
        >
            <div className="relative shrink-0 mt-1">
                <Avatar className="h-14 w-14 border border-muted shadow-sm">
                    <AvatarImage src={notification.triggeredByAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {notification.triggeredByName?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full border-2 border-background ${details.bg}`}>
                    {details.icon}
                </div>
            </div>

            <div className="flex-1 space-y-0.5">
                <p className={`text-sm leading-tight text-muted-foreground ${!notification.isRead ? 'text-foreground' : ''}`}>
                    {details.text}
                </p>
                <p className={`text-xs ${!notification.isRead ? 'text-blue-600 font-semibold' : 'text-muted-foreground'}`}>
                    {timeAgo}
                </p>
                
                {actionButtons}
                {statusMessage}
            </div>

            {!notification.isRead && (
                <div className="shrink-0 flex items-center justify-center w-3 h-3 bg-blue-600 rounded-full mt-2" />
            )}
        </div>
    );
}

export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: unseenData } = useUnseenNotificationsCount();
    const unseenCount = unseenData?.count || 0;
    const { mutate: markAllAsSeen } = useMarkAllAsSeen();
    const { mutate: markAsRead } = useMarkAsRead();

    const { 
        data: notificationsData, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage 
    } = useInfiniteNotifications(unreadOnly);

    const { ref: scrollRef, entry } = useIntersection({ root: dropdownRef.current, threshold: 1 });

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        if (!isOpen && unseenCount > 0) markAllAsSeen();
        setIsOpen(!isOpen);
    };

    const notifications = notificationsData?.pages.flatMap(page => page.data) || [];

    const handleNotificationClick = async (n: any) => {
        if (!n.isRead) markAsRead(n.id);
        setIsOpen(false);

        if (
            n.type === NotificationType.PostReaction ||
            n.type === NotificationType.PostComment ||
            n.type === NotificationType.CommentReaction
        ) {
            setSelectedNotification(n);
        } else {
            if (n.triggeredByUsername) {
                queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", n.triggeredByUsername] });
            }
            if (n.type === NotificationType.FriendAccept || n.type === NotificationType.FriendRequest) {
                queryClient.invalidateQueries({ queryKey: ["my-friends-infinite"] });
            }
            if (n.type === NotificationType.GroupJoinAccept || n.type === NotificationType.GroupJoinRequest) {
                queryClient.invalidateQueries({ queryKey: ["group-by-id", n.referenceId] });
                queryClient.invalidateQueries({ queryKey: ["group-members", n.referenceId] });

                try {
                    const response = await queryClient.fetchQuery({
                        queryKey: ["group-by-id", n.referenceId],
                        queryFn: () => groupsService.getGroupById(n.referenceId)
                    });
                    
                    if (response?.data?.name) {
                        const tab = n.type === NotificationType.GroupJoinRequest ? "?tab=members" : "";
                        router.push(`/groups/${encodeURIComponent(response.data.name)}${tab}`);
                        return;
                    }
                } catch (error) {
                    console.error(error);
                }
            }

            if (n.triggeredByUsername && n.type !== NotificationType.GroupJoinRequest && n.type !== NotificationType.GroupJoinAccept) {
                router.push(`/${n.triggeredByUsername}`);
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={toggleDropdown}
                className={cn(
                    "relative flex items-center justify-center h-10 w-10 rounded-full transition-colors cursor-pointer group",
                    isOpen ? "bg-primary/10" : "bg-muted hover:bg-primary/10"
                )}
            >
                <Bell className={cn(
                    "!size-6 transition-colors",
                    isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
                )} />
                
                {unseenCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold text-white bg-red-500 border-2 border-background rounded-full">
                        {unseenCount > 9 ? "9+" : unseenCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-background border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                    <div className="p-4 pb-2">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xl font-bold">Известия</h2>
                            <Link 
                                href="/notifications" 
                                onClick={() => setIsOpen(false)}
                                className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Вижте всички
                            </Link>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setUnreadOnly(false)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${!unreadOnly ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'hover:bg-muted'}`}
                            >
                                Всички
                            </button>
                            <button 
                                onClick={() => setUnreadOnly(true)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${unreadOnly ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'hover:bg-muted'}`}
                            >
                                Непрочетени
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[450px] p-2 custom-scrollbar">
                        {notifications.length === 0 && !isFetchingNextPage ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Нямате известия тук.
                            </div>
                        ) : (
                            notifications.map((n: any) => (
                                <NotificationDropdownItem 
                                    key={n.id} 
                                    notification={n} 
                                    onClick={handleNotificationClick} 
                                />
                            ))
                        )}
                        <div ref={scrollRef} className="h-4 w-full" />
                        {isFetchingNextPage && <div className="text-center text-xs py-2"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground"/></div>}
                    </div>
                </div>
            )}

            {selectedNotification && (
                <NotificationPostWrapper 
                    notification={selectedNotification} 
                    onClose={() => setSelectedNotification(null)} 
                />
            )}
        </div>
    );
}