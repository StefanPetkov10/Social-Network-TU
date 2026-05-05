"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ThumbsUp, MessageCircle, Heart, UserPlus, Users, CheckCircle, Loader2, UserCheck, X } from "lucide-react";
import { useIntersection } from "@mantine/hooks";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@frontend/components/ui/dialog";
import { SiteHeader } from "@frontend/components/site-header";
import ProtectedRoute from "@frontend/components/protected-route";
import { SidebarProvider } from "@frontend/components/ui/sidebar"; 

import { useInfiniteNotifications, useMarkAsRead } from "@frontend/hooks/use-notifications";
import { useProfile } from "@frontend/hooks/use-profile";
import { usePostForNotification } from "@frontend/hooks/use-post";
import { useInfiniteFriendRequests, useAcceptFriendRequest, useDeclineFriendRequest } from "@frontend/hooks/use-friends";
import { useFollowUser } from "@frontend/hooks/use-followers";
import { useApproveMember, useRejectMember } from "@frontend/hooks/use-group-members";
import { groupsService } from "@frontend/services/groups-service";
import { friendsService } from "@frontend/services/friends-service";
import { NotificationType } from "@frontend/lib/types/enums";
import { PostCommentDialog } from "@frontend/components/comments-forms/post-comment-dialog";
import { getUserDisplayName } from "@frontend/lib/utils";

function NotificationPostWrapper({ notification, onClose }: { notification: any, onClose: () => void }) {
    const { data: response, isLoading: isPostLoading } = usePostForNotification(notification);
    const { data: currentUser, isLoading: isUserLoading } = useProfile();
    const post = response; 

    if (isPostLoading || isUserLoading) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[600px] flex flex-col items-center justify-center h-64 border-none">
                    <DialogTitle className="sr-only">Зареждане</DialogTitle>
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                </DialogContent>
            </Dialog>
        );
    }

    if (!post || !currentUser) return null;

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

function NotificationItem({ notification, onClick }: { notification: any, onClick: (n: any) => void }) {
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
            } catch (error) {
                console.error("Грешка при търсене на заявката:", error);
            }
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
                <div className="flex gap-2 mt-3">
                    <Button size="sm" className="h-8 px-4 bg-primary text-white" disabled={isAccepting} onClick={handleAcceptFriend}>
                        {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Потвърди"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-4" disabled={isDeclining} onClick={handleDeclineFriend}>
                        {isDeclining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Изтрий"}
                    </Button>
                </div>
            );
        } else if (notification.type === NotificationType.NewFollower) {
            actionButtons = (
                <div className="flex gap-2 mt-3">
                    <Button size="sm" className="h-8 px-4 bg-blue-100 text-blue-700 hover:bg-blue-200" disabled={isFollowing} onClick={handleFollowBack}>
                        {isFollowing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Последвай също"}
                    </Button>
                </div>
            );
        } else if (notification.type === NotificationType.GroupJoinRequest) {
            actionButtons = (
                <div className="flex gap-2 mt-3">
                    <Button size="sm" className="h-8 px-4 bg-primary text-white" disabled={isApproving} onClick={handleApproveGroup}>
                        {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Одобри"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-4" disabled={isRejecting} onClick={handleRejectGroup}>
                        {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отхвърли"}
                    </Button>
                </div>
            );
        }
    }

    let statusMessage = null;
    if (actionStatus === 'accepted') statusMessage = <span className="flex items-center text-sm text-green-600 font-medium mt-2"><UserCheck className="w-4 h-4 mr-1" /> Одобрено</span>;
    if (actionStatus === 'declined') statusMessage = <span className="flex items-center text-sm text-red-500 font-medium mt-2"><X className="w-4 h-4 mr-1" /> Отхвърлено</span>;
    if (actionStatus === 'followed') statusMessage = <span className="flex items-center text-sm text-blue-600 font-medium mt-2"><UserCheck className="w-4 h-4 mr-1" /> Последван</span>;

    return (
        <div 
            onClick={() => onClick(notification)}
            className={`flex items-start gap-4 p-4 md:p-5 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${!notification.isRead ? 'bg-blue-50/40 dark:bg-blue-950/10' : 'bg-background'}`}
        >
            <div className="relative shrink-0 mt-1">
                <Avatar className="h-16 w-16 border shadow-sm">
                    <AvatarImage src={notification.triggeredByAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                        {notification.triggeredByName?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full border-2 border-background ${details.bg}`}>
                    {details.icon}
                </div>
            </div>

            <div className="flex-1 space-y-1">
                <p className={`text-[15px] leading-snug ${!notification.isRead ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {details.text}
                </p>
                <p className={`text-sm ${!notification.isRead ? 'text-blue-600 font-semibold' : 'text-muted-foreground'}`}>
                    {timeAgo}
                </p>
                
                {actionButtons}
                {statusMessage}
            </div>

            {!notification.isRead && (
                <div className="shrink-0 flex items-center justify-center w-3 h-3 bg-blue-600 rounded-full mt-3" />
            )}
        </div>
    );
}

export default function NotificationsPage() {
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
    
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: profile } = useProfile();
    const { mutate: markAsRead } = useMarkAsRead();

    const { 
        data: notificationsData, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage,
        isLoading 
    } = useInfiniteNotifications(unreadOnly);

    const { ref, entry } = useIntersection({ root: null, threshold: 1 });

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const notifications = notificationsData?.pages.flatMap(page => page.data) || [];

    const userForLayout = {
        name: getUserDisplayName(profile),
        avatar: profile?.authorAvatar || ""
    };

    const handleNotificationClick = async (n: any) => {
        if (!n.isRead) markAsRead(n.id);

        if (
            n.type === NotificationType.PostReaction ||
            n.type === NotificationType.PostComment ||
            n.type === NotificationType.CommentReaction
        ) {
            setSelectedNotification(n);
        } else {
            if (n.triggeredByUsername) queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", n.triggeredByUsername] });
            if (n.type === NotificationType.FriendAccept || n.type === NotificationType.FriendRequest) queryClient.invalidateQueries({ queryKey: ["my-friends-infinite"] });
            
            if (n.type === NotificationType.GroupJoinAccept || n.type === NotificationType.GroupJoinRequest) {
                queryClient.invalidateQueries({ queryKey: ["group-by-id", n.referenceId] });
                queryClient.invalidateQueries({ queryKey: ["group-members", n.referenceId] });

                try {
                    const response = await queryClient.fetchQuery({ queryKey: ["group-by-id", n.referenceId], queryFn: () => groupsService.getGroupById(n.referenceId) });
                    if (response?.data?.name) {
                        const tab = n.type === NotificationType.GroupJoinRequest ? "?tab=members" : "";
                        router.push(`/groups/${encodeURIComponent(response.data.name)}${tab}`);
                        return;
                    }
                } catch (error) { console.error(error); }
            }

            if (n.triggeredByUsername && n.type !== NotificationType.GroupJoinRequest && n.type !== NotificationType.GroupJoinAccept) {
                router.push(`/${n.triggeredByUsername}`);
            }
        }
    };

    return (
        <ProtectedRoute>
            <SidebarProvider>
                <div className="min-h-screen w-full bg-[#f0f2f5] text-foreground flex flex-col">
                    <SiteHeader user={userForLayout} />

                    <main className="w-full max-w-3xl mx-auto pt-24 px-4 pb-12 flex-1">
                        <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                            
                            <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h1 className="text-2xl font-bold">Известия</h1>
                                <div className="flex bg-muted p-1 rounded-lg">
                                    <button 
                                        onClick={() => setUnreadOnly(false)}
                                        className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${!unreadOnly ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Всички
                                    </button>
                                    <button 
                                        onClick={() => setUnreadOnly(true)}
                                        className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${unreadOnly ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Непрочетени
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                {isLoading ? (
                                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="bg-muted p-4 rounded-full mb-4">
                                            <Bell className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-bold">Нямате известия</h3>
                                        <p className="text-muted-foreground mt-1">Когато някой взаимодейства с вас, известието ще се появи тук.</p>
                                    </div>
                                ) : (
                                    notifications.map((n: any) => (
                                        <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                                    ))
                                )}

                                {isFetchingNextPage && (
                                    <div className="flex justify-center py-6 border-t"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>
                                )}
                                <div ref={ref} className="h-4 w-full" />
                            </div>

                        </div>
                    </main>

                    {selectedNotification && (
                        <NotificationPostWrapper 
                            notification={selectedNotification} 
                            onClose={() => setSelectedNotification(null)} 
                        />
                    )}
                </div>
            </SidebarProvider>
        </ProtectedRoute>
    );
}