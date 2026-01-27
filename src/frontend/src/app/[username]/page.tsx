"use client";

import { useState, useEffect, use, useMemo } from "react";
import { notFound, useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  UserPlus, 
  UserCheck, 
  MessageCircle, 
  MoreHorizontal, 
  Loader2, 
  ImageIcon, 
  Users,
  Check,
  UserMinus,
  ArrowLeft,
  Clock,
  X,
  FileText,
  Edit, 
  Save 
} from "lucide-react";

import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { CreatePost } from "@frontend/components/post-forms/create-post-form";
import { ProfileMediaCard } from "@frontend/components/profile-form/profile-media-card";
import { ProfileFriendsCard } from "@frontend/components/profile-form/profile-friends-card";
import { SiteHeader } from "@frontend/components/site-header"; 
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@frontend/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";

import { useProfileByUsername, useProfile, useUpdateBio } from "@frontend/hooks/use-profile"; 
import { useUserPosts } from "@frontend/hooks/use-post";
import { useIntersection } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { friendsService } from "@frontend/services/friends-service";
import { followersService } from "@frontend/services/followers-servise";
import { cn, getInitials, getUserDisplayName, getUserUsername } from "@frontend/lib/utils";
import { FriendshipStatus } from "@frontend/lib/types/enums"; 
import { toast } from "sonner";
import { useCancelFriendRequest } from "@frontend/hooks/use-friends";

import { MediaGalleryView } from "@frontend/components/media/media-gallery-view";
import { DocumentsListView } from "@frontend/components/media/documents-list-view";
import { FriendsListView } from "@frontend/components/profile-form/friends-list-view";
import { FollowersListDialog, FollowingListDialog } from "@frontend/components/profile-form/follows-lists";
import { EditProfileDialog } from "@frontend/components/profile-form/profile-edit-dialog"; 

type RequestStatusUI = "pending_received" | "pending_sent" | "friend" | "none";

const TAB_MAP: Record<string, string> = {
    "posts": "Публикации",
    "friends": "Приятели",
    "media": "Медия",
    "documents": "Документи"
};

const REVERSE_TAB_MAP: Record<string, string> = {
    "Публикации": "posts",
    "Приятели": "friends",
    "Медия": "media",
    "Документи": "documents"
};

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function UserProfilePage({ params }: PageProps) {
  const { username: rawUsername } = use(params);
  const username = decodeURIComponent(rawUsername).replace("@", "");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentTabParam = searchParams.get("tab") || "posts";
  const activeTab = TAB_MAP[currentTabParam] || "Публикации";

  const handleTabChange = (tabName: string) => {
      const urlKey = REVERSE_TAB_MAP[tabName] || "posts";
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("tab", urlKey);
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  };
  
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddingBio, setIsAddingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");

  const queryClient = useQueryClient();

  const { data: myProfile, isLoading: isMeLoading } = useProfile();

  const { 
    data: response, 
    isLoading: isProfileLoading, 
    isError 
  } = useProfileByUsername(username);

  const { mutate: updateBio, isPending: isUpdatingBio } = useUpdateBio(); 

  const profile = response?.data; 

  useEffect(() => {
    if (!isMeLoading && myProfile) {
        const isMyOwnProfile = 
            myProfile.username.toLowerCase() === username.toLowerCase() || 
            (profile && myProfile.id === profile.id);

        if (isMyOwnProfile) {
            router.replace("/profile"); 
        }
    }
  }, [isMeLoading, myProfile, username, profile, router]);

  const getComputedStatus = (): RequestStatusUI => {
      if (profile && typeof profile.friendshipStatus === 'number') {
          const status = profile.friendshipStatus;
          const isSender = profile.isFriendRequestSender;

          if (status === FriendshipStatus.Accepted) return 'friend';
          if (status === FriendshipStatus.Pending) return isSender ? 'pending_sent' : 'pending_received';
          return 'none';
      }
      return 'none';
  };

  const computedStatus = getComputedStatus();
  const computedIsFollowing = profile?.isFollowed ?? false;

  const [uiStatus, setUiStatus] = useState<RequestStatusUI>(computedStatus);
  const [uiFollowing, setUiFollowing] = useState<boolean>(computedIsFollowing);

  useEffect(() => {
      setUiStatus(computedStatus);
      setUiFollowing(computedIsFollowing);
  }, [computedStatus, computedIsFollowing]);

  const activeRequestId = profile?.friendshipRequestId;
  const profileId = profile?.id || "";

  const handleSaveBio = () => {
    if (!bioInput.trim()) return;
    updateBio(bioInput, {
        onSuccess: () => {
            setIsAddingBio(false);
            queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", username] });
        }
    });
  };

  const { mutate: sendRequest, isPending: isSendPending } = useMutation({
      mutationFn: async () => {
          await friendsService.sendFriendRequest(profileId);
          if (!uiFollowing) try { await followersService.followUser(profileId); } catch {}
      },
      onMutate: () => { setUiStatus("pending_sent"); setUiFollowing(true); },
      onSuccess: () => {
          toast.success("Поканата е изпратена!");
          queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", username] });
      },
      onError: () => { setUiStatus("none"); setUiFollowing(false); toast.error("Грешка."); }
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
          if (!activeRequestId) throw new Error("No ID");
          return friendsService.acceptFriendRequest(activeRequestId);
      },
      onMutate: () => { setUiStatus("friend"); setUiFollowing(true); },
      onSuccess: () => {
          toast.success("Вече сте приятели!");
          queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", username] });
      },
      onError: () => { setUiStatus("pending_received"); toast.error("Грешка."); }
  });

  const { mutate: declineRequest, isPending: isDeclinePending } = useMutation({
      mutationFn: () => {
          if (!activeRequestId) throw new Error("No ID");
          return friendsService.declineFriendRequest(activeRequestId);
      },
      onMutate: () => setUiStatus("none"),
      onSuccess: () => {
          toast.success("Отхвърлена.");
          queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", username] });
      },
      onError: () => { setUiStatus("pending_received"); toast.error("Грешка."); }
  });

  const { mutate: removeFriend, isPending: isRemovePending } = useMutation({
      mutationFn: () => friendsService.removeFriend(profileId),
      onMutate: () => { setShowUnfriendDialog(false); setUiStatus("none"); setUiFollowing(false); },
      onSuccess: () => {
          toast.success("Премахнат.");
          queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", username] });
      },
      onError: () => { setUiStatus("friend"); toast.error("Грешка."); }
  });

  const { mutate: followUser, isPending: isFollowPending } = useMutation({
      mutationFn: () => followersService.followUser(profileId),
      onMutate: () => setUiFollowing(true),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", username] }),
      onError: () => setUiFollowing(false)
  });

  const { mutate: unfollowUser, isPending: isUnfollowPending } = useMutation({
      mutationFn: () => followersService.unfollowUser(profileId),
      onMutate: () => { setShowUnfollowDialog(false); setUiFollowing(false); },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-profile-by-username", username] }),
      onError: () => setUiFollowing(true)
  });

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading
  } = useUserPosts(profile?.id || "");

  const { ref, entry } = useIntersection({ root: null, threshold: 1 });
  
  useEffect(() => { 
      if (entry?.isIntersecting && hasNextPage && activeTab === "Публикации") 
        {
            fetchNextPage(); 
        }
  }, [entry, hasNextPage, fetchNextPage, activeTab]);

  const userForHeader = useMemo(() => ({
    name: myProfile ? getUserDisplayName(myProfile) : "Потребител",
    avatar: myProfile?.authorAvatar || ""
  }), [myProfile]);

  if (isMeLoading) return <ProfilePageSkeleton />;
  if (myProfile && myProfile.username.toLowerCase() === username.toLowerCase()) {
      return <ProfilePageSkeleton />;
  }

  if (isProfileLoading) return <ProfilePageSkeleton />;
  if (isError || !profile) return notFound();

  const displayName = getUserDisplayName(profile);
  const initials = getInitials(displayName);
  const displayUsername = getUserUsername(profile);
  const profileImage = profile.authorAvatar || null;
  const isMe = myProfile?.id === profile.id;

  const userDataForPost = isMe ? {
      firstName: profile.firstName,
      lastName: profile.lastName,
      photo: profile.authorAvatar || null
  } : null;

  return (
    <SidebarProvider>
    <div className="min-h-screen w-full bg-gray-100 flex flex-col text-foreground">
        
        <SiteHeader user={userForHeader} />

        <main className="flex-1 w-full pb-10 pt-24">
            <div className="max-w-5xl mx-auto px-4 space-y-5">
        
                <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-5 md:p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
                        
                            <div className="relative group shrink-0">
                                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-lg ring-2 ring-muted">
                                    <AvatarImage src={profileImage || ""} className="object-cover" />
                                    <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-1.5 mt-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                    {displayName}
                                </h1>
                                <p className="text-muted-foreground font-medium">
                                    {displayUsername}
                                </p>

                                <div className="max-w-lg mx-auto md:mx-0 mt-2 min-h-[40px]">
                                    {profile.bio ? (
                                        <p className="text-sm text-foreground/90 leading-relaxed break-words">
                                            {profile.bio}
                                        </p>
                                    ) : isMe && isAddingBio ? (
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                value={bioInput}
                                                onChange={(e) => setBioInput(e.target.value)}
                                                placeholder="Напишете нещо за себе си..."
                                                className="h-8 text-sm"
                                                maxLength={500}
                                                autoFocus
                                            />
                                            <Button 
                                                size="icon" 
                                                className="h-8 w-8 bg-green-600 hover:bg-green-700"
                                                onClick={handleSaveBio}
                                                disabled={isUpdatingBio}
                                            >
                                                {isUpdatingBio ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-muted-foreground"
                                                onClick={() => setIsAddingBio(false)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : isMe ? (
                                        <div 
                                            onClick={() => setIsAddingBio(true)}
                                            className="cursor-pointer group flex items-center justify-center md:justify-start gap-2"
                                        >
                                            <p className="text-sm text-muted-foreground/60 italic border-b border-transparent group-hover:border-muted-foreground/60 transition-all">
                                                Добавете кратко описание за себе си...
                                            </p>
                                            <Edit className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex items-center justify-center md:justify-start gap-5 text-sm font-medium pt-2 text-muted-foreground">
                                    <span 
                                            className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleTabChange("Приятели")}
                                    >
                                            <Users className="h-4 w-4" />
                                            <strong className="text-foreground">{profile.friendsCount}</strong> Приятели
                                    </span>
                                    <span 
                                            className="cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => setShowFollowersDialog(true)}
                                    >
                                            <strong className="text-foreground">{profile.followersCount}</strong> Последователи
                                    </span>
                                    <span 
                                            className="cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => setShowFollowingDialog(true)}
                                    >
                                            <strong className="text-foreground">{profile.followingCount}</strong> Последвани
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0 min-w-[160px]">
                                {isMe ? (
                                    <Button 
                                        className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto h-9 px-4 gap-2"
                                        onClick={() => setIsEditModalOpen(true)}
                                    >
                                        <Edit className="h-4 w-4" /> Редактирай профил
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-2 w-full">
                                        
                                        {uiStatus === 'pending_received' && (
                                            <div className="flex gap-2 w-full">
                                                <Button className="bg-primary hover:bg-primary/90 h-9 flex-1" onClick={() => acceptRequest()} disabled={isAcceptPending || !activeRequestId}>
                                                    {isAcceptPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Потвърди"}
                                                </Button>
                                                <Button variant="outline" className="h-9 flex-1" onClick={() => declineRequest()} disabled={isDeclinePending || !activeRequestId}>
                                                    {isDeclinePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Откажи"}
                                                </Button>
                                            </div>
                                        )}

                                        {uiStatus === 'none' && (
                                            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-sm h-9 w-full" onClick={() => sendRequest()} disabled={isSendPending}>
                                                {isSendPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Добави</>}
                                            </Button>
                                        )}

                                        {uiStatus === 'friend' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 gap-2 h-9 w-full">
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
                                                className="group bg-gray-50 text-gray-500 border border-gray-200 shadow-none hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all h-9 w-full"
                                            >
                                                {isCancelPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 group-hover:hidden">
                                                            <Clock className="h-4 w-4" /> 
                                                            <span>Изпратена</span>
                                                        </div>
                                                        <div className="hidden group-hover:flex items-center gap-2">
                                                            <X className="h-4 w-4" /> 
                                                            <span>Откажи</span>
                                                        </div>
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        <div className="flex gap-2 w-full">
                                            {uiFollowing ? (
                                                <Button variant="secondary" className="flex-1 h-9 bg-gray-100 border border-gray-200" onClick={() => setShowUnfollowDialog(true)}>
                                                    <UserCheck className="h-4 w-4 mr-1" /> Последван
                                                </Button>
                                            ) : (
                                                <Button variant="secondary" className="flex-1 h-9" onClick={() => followUser()} disabled={isFollowPending}>
                                                    {isFollowPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Последвай"}
                                                </Button>
                                            )}
                                            
                                            <Button variant="secondary" className="h-9 w-9 p-0 shrink-0">
                                                <MessageCircle className="h-4 w-4" /> 
                                            </Button>
                                            <Button variant="ghost" className="h-9 w-9 p-0 shrink-0">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-5 border-t flex gap-6 overflow-x-auto scrollbar-hide">
                        {["Публикации", "Приятели", "Медия", "Документи"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={cn(
                                    "py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap px-1",
                                    activeTab === tab 
                                    ? "border-blue-600 text-blue-600" 
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                
                {isMe && profile && (
                    <EditProfileDialog 
                        isOpen={isEditModalOpen} 
                        onClose={() => setIsEditModalOpen(false)} 
                        profile={profile} 
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    <div className={cn(
                        "lg:col-span-1 space-y-6",
                        "h-fit",
                        activeTab === "Публикации"
                            ? "sticky bottom-6 self-end"   
                            : "sticky top-28 self-start"  
                    )}>
                        {activeTab !== "Приятели" && (
                                    <ProfileFriendsCard 
                                    profileId={profile.id} 
                                    currentUsername={profile.username} 
                                    loggedInUsername={profile?.username} 
                                />                      
                             )}      
                        {activeTab !== "Медия" && activeTab !== "Документи" && (
                            <ProfileMediaCard profileId={profile.id} />
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {activeTab === "Публикации" && (
                            <>
                                {isMe && userDataForPost && (
                                    <CreatePost user={userDataForPost} />
                                )}

                                {postsLoading ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {postsData?.pages[0]?.data?.length === 0 ? (
                                            <div className="text-center p-8 text-muted-foreground bg-white rounded-xl border border-dashed shadow-sm">
                                                <div className="bg-muted/50 p-4 rounded-full w-fit mx-auto mb-3">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                                </div>
                                                Все още няма публикации.
                                            </div>
                                        ) : (
                                            postsData?.pages.map((page: any, i: number) => (
                                                <div key={i} className="space-y-4">
                                                    {page.data?.map((post: any) => (
                                                        <PostCard 
                                                            key={post.id} 
                                                            post={post} 
                                                            authorProfile={profile} 
                                                        />
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                        {isFetchingNextPage && (
                                            <div className="flex justify-center p-4">
                                                <Loader2 className="animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                        <div ref={ref} className="h-10" />
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "Приятели" && (
                             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                 <FriendsListView profileId={profile.id} />
                             </div>
                        )}

                        {activeTab === "Медия" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                 <div className="bg-white rounded-xl border p-4 shadow-sm mb-4">
                                     <h2 className="text-lg font-bold flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-primary" /> 
                                        Галерия
                                     </h2>
                                 </div>
                                 <MediaGalleryView id={profile.id} type="user" />
                            </div>
                        )}
                        
                        {activeTab === "Документи" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="bg-white rounded-xl border p-4 shadow-sm mb-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Файлове
                                    </h2>
                                </div>
                                <DocumentsListView id={profile.id} type="user" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>

        <AlertDialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Спиране на следването?</AlertDialogTitle><AlertDialogDescription>Ако спрете да следвате <strong>{displayName}</strong>, неговите публикации няма да се появяват във вашия фийд.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Отказ</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => unfollowUser()} disabled={isUnfollowPending}>{isUnfollowPending ? "..." : "Спри следването"}</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Премахване на приятел?</AlertDialogTitle><AlertDialogDescription>Сигурни ли сте, че искате да премахнете <strong>{displayName}</strong> от приятели?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Отказ</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => removeFriend()}>Премахни</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        {profile && (
            <>
                <FollowersListDialog 
                    open={showFollowersDialog} 
                    onOpenChange={setShowFollowersDialog} 
                    profileId={profile.id}
                    isMyProfile={isMe} 
                />
                <FollowingListDialog 
                    open={showFollowingDialog} 
                    onOpenChange={setShowFollowingDialog} 
                    profileId={profile.id}
                    
                    isMyProfile={isMe}
                />
            </>
        )}  
    </div>
    </SidebarProvider>
  );
}

function ProfilePageSkeleton() {
    return (
        <div className="w-full min-h-screen bg-gray-100 pt-24">
            <div className="max-w-5xl mx-auto px-4 space-y-5">
                <div className="bg-background rounded-xl border shadow-sm p-6 h-[250px]">
                     <div className="flex gap-6">
                        <Skeleton className="h-36 w-36 rounded-full" />
                        <div className="flex-1 space-y-4 pt-4">
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-6 w-1/2" />
                        </div>
                     </div>
                </div>
            </div>
        </div>
    )
}