"use client";

import { useState, useEffect } from "react";
import {
    ArrowLeft, UserPlus, UserCheck, MessageCircle, MoreHorizontal,
    UserMinus, Users, Loader2, Check, X, Image as ImageIcon,
    Clock 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@frontend/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";

import { PostCard } from "@frontend/components/post-forms/post-card";
import { ProfileMediaCard } from "@frontend/components/profile-form/profile-media-card";
import { ProfileFriendsCard } from "@frontend/components/profile-form/profile-friends-card";
import { useUserPosts } from "@frontend/hooks/use-post";
import { useIntersection } from "@mantine/hooks";
import { getInitials, getUserDisplayName, getUserUsername, cn } from "@frontend/lib/utils";
import { useProfileById } from "@frontend/hooks/use-profile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { friendsService } from "@frontend/services/friends-service";
import { followersService } from "@frontend/services/followers-servise";
import { toast } from "sonner";
import { FriendshipStatus } from "@frontend/lib/types/enums";
import { ProfilePreviewData } from "@frontend/lib/types/profile-view";
// 2. Импортираме новия хук
import { useCancelFriendRequest } from "@frontend/hooks/use-friends";

type RequestStatusUI = "pending_received" | "pending_sent" | "friend" | "none";

interface FriendProfileViewProps {
    profileId: string;
    initialData?: ProfilePreviewData; 
    onBack: () => void;
    
    requestStatus?: RequestStatusUI;
    isFollowing?: boolean;
    requestId?: string;
    friendsCount?: number;
    followersCount?: number;
    followingCount?: number;
}

export function FriendProfileView({
    profileId,
    initialData,
    onBack,
    requestStatus: propRequestStatus = "none",
    isFollowing: propIsFollowing = false,
    requestId,
    friendsCount,
    followersCount,
    followingCount
}: FriendProfileViewProps) {
    const [activeTab, setActiveTab] = useState("Публикации");
    const [isScrolled, setIsScrolled] = useState(false);
    
    const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
    const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);

    const queryClient = useQueryClient();

    const { data: fetchedProfile, isLoading: isProfileLoading } = useProfileById(profileId);

    const profile = { 
        ...initialData, 
        ...fetchedProfile?.data 
    };

    const getComputedStatus = (): RequestStatusUI => {
        if (profile && typeof profile.friendshipStatus === 'number') {
            const status = profile.friendshipStatus;
            const isSender = profile.isFriendRequestSender;

            if (status === FriendshipStatus.Accepted) return 'friend';
            
            if (status === FriendshipStatus.Pending) {
                return isSender ? 'pending_sent' : 'pending_received';
            }
            
            return 'none'; 
        }
        return propRequestStatus;
    };

    const getComputedIsFollowing = (): boolean => {
        if (profile && typeof profile.isFollowed === 'boolean') {
            return profile.isFollowed;
        }
        return propIsFollowing;
    };

    const realStatus = getComputedStatus();
    const realIsFollowing = getComputedIsFollowing();

    const [uiStatus, setUiStatus] = useState<RequestStatusUI>(realStatus);
    const [uiFollowing, setUiFollowing] = useState<boolean>(realIsFollowing);

    useEffect(() => {
        setUiStatus(realStatus);
        setUiFollowing(realIsFollowing);
    }, [realStatus, realIsFollowing]);

    const activeRequestId = profile.friendshipRequestId || requestId;

    const { mutate: sendRequest, isPending: isSendPending } = useMutation({
        mutationFn: async () => {
            await friendsService.sendFriendRequest(profileId);
            if (!uiFollowing) {
                try { await followersService.followUser(profileId); } catch {}
            }
        },
        onMutate: () => {
            setUiStatus("pending_sent");
            setUiFollowing(true); 
        },
        onSuccess: () => {
            toast.success("Поканата е изпратена!");
            queryClient.invalidateQueries({ queryKey: ["user-profile-by-id", profileId] });
            queryClient.invalidateQueries({ queryKey: ["friend-suggestions-infinite"] }); 
        },
        onError: () => {
            setUiStatus("none");
            setUiFollowing(false);
            toast.error("Грешка при изпращане.");
        }
    });

    const { mutate: cancelRequest, isPending: isCancelPending } = useCancelFriendRequest();

    const handleCancelRequest = () => {
        setUiStatus("none");
        setUiFollowing(false);
        cancelRequest(profileId, {
             onError: () => { setUiStatus("pending_sent"); setUiFollowing(true); }
        });
    };

    const { mutate: acceptRequest, isPending: isAcceptPending } = useMutation({
    mutationFn: () => {
        if (!activeRequestId) throw new Error("Липсва ID на заявката!"); 
        return friendsService.acceptFriendRequest(activeRequestId);
    },
        onMutate: () => {
            setUiStatus("friend");
            setUiFollowing(true); 
        },
        onSuccess: () => {
            toast.success("Вече сте приятели!");
            queryClient.invalidateQueries({ queryKey: ["user-profile-by-id", profileId] });
            queryClient.invalidateQueries({ queryKey: ["friends-list"] });
        },
        onError: () => {
            setUiStatus("pending_received");
            toast.error("Грешка при приемане.");
        }
    });

    const { mutate: declineRequest, isPending: isDeclinePending } = useMutation({
        mutationFn: () => {
            const idToUse = activeRequestId || profileId;
            return friendsService.declineFriendRequest(idToUse);
        },
        onMutate: () => setUiStatus("none"), 
        onSuccess: () => {
            toast.success("Заявката е отхвърлена.");
            queryClient.invalidateQueries({ queryKey: ["user-profile-by-id", profileId] });
        },
        onError: () => {
            setUiStatus("pending_received");
            toast.error("Грешка.");
        }
    });

    const { mutate: removeFriend, isPending: isRemovePending } = useMutation({
        mutationFn: () => friendsService.removeFriend(profileId),
        onMutate: () => {
            setShowUnfriendDialog(false);
            setUiStatus("none");
            setUiFollowing(false); 
        },
        onSuccess: () => {
            toast.success("Приятелят е премахнат.");
            queryClient.invalidateQueries({ queryKey: ["user-profile-by-id", profileId] });
            queryClient.invalidateQueries({ queryKey: ["friends-list"] });
        },
        onError: () => {
            setUiStatus("friend");
            toast.error("Грешка при премахване.");
        }
    });

    const { mutate: followUser, isPending: isFollowPending } = useMutation({
        mutationFn: () => followersService.followUser(profileId),
        onMutate: () => setUiFollowing(true),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-profile-by-id", profileId] }),
        onError: () => setUiFollowing(false)
    });

    const { mutate: unfollowUser, isPending: isUnfollowPending } = useMutation({
        mutationFn: () => followersService.unfollowUser(profileId),
        onMutate: () => {
            setShowUnfollowDialog(false);
            setUiFollowing(false);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-profile-by-id", profileId] }),
        onError: () => setUiFollowing(true)
    });


    const displayFriendsCount = profile.friendsCount ?? friendsCount ?? 0;
    const displayFollowersCount = profile.followersCount ?? followersCount ?? 0;
    const displayFollowingCount = profile.followingCount ?? followingCount ?? 0;

    const displayName = 
    (profile as any).fullName || 
    (profile as any).displayFullName || 
    getUserDisplayName(profile) || "Потребител";
    const initials = getInitials(displayName);
    const userName = getUserUsername(profile);
    const profileImage = profile.authorAvatar || undefined;
    const bio = profile.bio || "";

    const { data: postsData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: postsLoading } = useUserPosts(profileId);
    const { ref, entry } = useIntersection({ root: null, threshold: 1 });
    useEffect(() => { if (entry?.isIntersecting && hasNextPage) fetchNextPage(); }, [entry, hasNextPage, fetchNextPage]);
    
    useEffect(() => {
        const scrollableEl = document.querySelector<HTMLElement>(".scroll-smooth") || document.querySelector<HTMLElement>("main");
        const handleScroll = () => setIsScrolled((scrollableEl ? scrollableEl.scrollTop : window.scrollY) > 10);
        if (scrollableEl) scrollableEl.addEventListener("scroll", handleScroll); else window.addEventListener("scroll", handleScroll);
        return () => { if (scrollableEl) scrollableEl.removeEventListener("scroll", handleScroll); else window.removeEventListener("scroll", handleScroll); };
    }, []);

    return (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-300 w-full min-h-screen relative pb-10">
            <div className="sticky top-0 left-0 z-50 pointer-events-none">
                <Button onClick={onBack} className={cn("transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center overflow-hidden group -mt-2 -ml-2 pointer-events-auto h-11 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 text-gray-700 shadow-lg", isScrolled ? "w-11 px-0 justify-center" : "px-6 w-auto")}>
                    <ArrowLeft className={cn("h-5 w-5 transition-transform ml-1 duration-300 group-hover:-translate-x-0.5", isScrolled ? "" : "mr-3")} />
                    <span className={cn("font-medium text-sm whitespace-nowrap", isScrolled ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100")}>Назад</span>
                </Button>
            </div>

            <div className="max-w-5xl mx-auto w-full space-y-6 pt-6"> 
                <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="relative group shrink-0">
                                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-lg ring-1 ring-border/20">
                                    <AvatarImage src={profileImage} className="object-cover" />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">{initials}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-2 mt-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
                                {userName && <p className="text-muted-foreground font-medium">{userName}</p>}
                                <div className="max-w-lg mx-auto md:mx-0 py-2"><p className="text-sm text-foreground/90 leading-relaxed">{bio}</p></div>
                                
                                <div className="flex items-center justify-center md:justify-start gap-5 text-sm font-medium pt-2 text-muted-foreground">
                                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /><strong className="text-foreground">{profile.friendsCount || 0}</strong> Приятели</span>
                                    <span><strong className="text-foreground">{profile.followersCount || 0}</strong> Последователи</span>
                                    <span><strong className="text-foreground">{profile.followingCount || 0}</strong> Последвани</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto min-w-[160px]">
                                
                                {uiStatus === 'pending_received' && (
                                    <>
                                      <Button className="w-full bg-primary hover:bg-primary/90 shadow-sm"
                                            onClick={() => acceptRequest()}
                                            disabled={isAcceptPending || !activeRequestId} >
                                            {isAcceptPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Потвърди"}
                                       </Button>
                                      <Button variant="secondary" className="w-full bg-muted hover:bg-muted/80" onClick={() => declineRequest()} 
                                            disabled={isDeclinePending}>
                                          {isDeclinePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Изтрий"}
                                       </Button>
                                    </>
                                )}

                                {uiStatus === 'none' && (
                                    <Button className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-sm" onClick={() => sendRequest()} disabled={isSendPending}>
                                       {isSendPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Добави</>}
                                    </Button>
                                )}

                                {uiStatus === 'friend' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" className="w-full gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                                                <UserCheck className="h-4 w-4" /> Приятели
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => setShowUnfriendDialog(true)}>
                                                <UserMinus className="mr-2 h-4 w-4" /> Премахни приятел
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                                {uiStatus === 'pending_sent' && (
                                    <Button 
                                        onClick={handleCancelRequest}
                                        disabled={isCancelPending}
                                        className="w-full gap-2 bg-gray-50 text-gray-500 border border-gray-200 shadow-none group hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                                    >
                                       {isCancelPending ? (
                                           <Loader2 className="h-4 w-4 animate-spin" />
                                       ) : (
                                           <>
                                               <span className="flex items-center gap-2 group-hover:hidden">
                                                   <Clock className="h-4 w-4" /> Изпратена
                                               </span>
                                               <span className="hidden group-hover:flex items-center gap-2">
                                                   <X className="h-4 w-4" /> Откажи
                                               </span>
                                           </>
                                       )}
                                    </Button>
                                )}

                                {uiFollowing ? (
                                    <Button variant="secondary" className="w-full gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200" onClick={() => setShowUnfollowDialog(true)}>
                                        <UserCheck className="h-4 w-4" /> Последван
                                    </Button>
                                ) : (
                                    <Button variant="secondary" className="w-full gap-2" onClick={() => followUser()} disabled={isFollowPending}>
                                        {isFollowPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Последвай"}
                                    </Button>
                                )}

                                <div className="flex gap-2 mt-1">
                                    <Button variant="secondary" className="flex-1 gap-2"><MessageCircle className="h-4 w-4" /> Съобщение</Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-muted"><MoreHorizontal className="h-5 w-5" /></Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 border-t flex gap-8 overflow-x-auto scrollbar-hide bg-muted/30">
                        {["Публикации", "Информация", "Приятели", "Снимки"].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("py-3 text-sm font-semibold border-b-[3px] transition-all whitespace-nowrap px-1", activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}>{tab}</button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-1 space-y-6 sticky top-24 h-fit">
                        <ProfileFriendsCard profileId={profileId} />
                        <ProfileMediaCard profileId={profileId} />
                    </div>
                    <div className="lg:col-span-2 space-y-4 pb-10">
                        {activeTab === "Публикации" && (
                            <>
                                {postsLoading ? (<div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>) : (
                                    <div className="space-y-4">
                                        {postsData?.pages[0]?.data?.length === 0 ? (
                                             <div className="bg-background rounded-xl border p-12 shadow-sm text-center flex flex-col items-center justify-center gap-3">
                                                <div className="bg-muted/50 p-4 rounded-full"><ImageIcon className="h-8 w-8 text-muted-foreground/50" /></div>
                                                <div className="space-y-1"><h3 className="font-semibold text-lg">Няма публикации</h3></div>
                                             </div>
                                        ) : (postsData?.pages.map((page: any, i: number) => (<div key={i} className="space-y-4">{page.data?.map((post: any) => (<PostCard key={post.id} post={post} />))}</div>)))}
                                        {isFetchingNextPage && (<div className="flex justify-center p-6"><Loader2 className="animate-spin text-muted-foreground h-6 w-6" /></div>)}
                                        <div ref={ref} className="h-4 w-full" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Спиране на следването?</AlertDialogTitle><AlertDialogDescription>Ако спрете да следвате <strong>{displayName}</strong>, неговите публикации няма да се появяват във вашия фийд.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Отказ</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => unfollowUser()} disabled={isUnfollowPending}>{isUnfollowPending ? "..." : "Спри следването"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Премахване на приятел?</AlertDialogTitle><AlertDialogDescription>Сигурни ли сте, че искате да премахнете <strong>{displayName}</strong>?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Отказ</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => removeFriend()}>Премахни</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}