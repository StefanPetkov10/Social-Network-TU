"use client";

import { useState, useEffect, use, useMemo } from "react";
import { notFound } from "next/navigation";
import { 
  UserPlus, 
  UserCheck, 
  MessageCircle, 
  MoreHorizontal, 
  Loader2, 
  ImageIcon,
  Users 
} from "lucide-react";

import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { CreatePost } from "@frontend/components/post-forms/create-post-form";
import { ProfileMediaCard } from "@frontend/components/profile-form/profile-media-card";
import { ProfileFriendsCard } from "@frontend/components/profile-form/profile-friends-card";
import { SiteHeader } from "@frontend/components/site-header"; 
import { SidebarProvider } from "@frontend/components/ui/sidebar";

import { useProfileByUsername, useProfile } from "@frontend/hooks/use-profile";
import { useUserPosts } from "@frontend/hooks/use-post";
import { useIntersection } from "@mantine/hooks";

import { cn, getInitials, getUserDisplayName, getUserUsername } from "@frontend/lib/utils";
import { FriendshipStatus } from "@frontend/lib/types/friends"; 

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function UserProfilePage({ params }: PageProps) {
  const { username: rawUsername } = use(params);
  const username = decodeURIComponent(rawUsername).replace("@", "");
  
  const [activeTab, setActiveTab] = useState("Публикации");

  const { 
    data: response, 
    isLoading: isProfileLoading, 
    isError 
  } = useProfileByUsername(username);

  const { data: myProfileResponse } = useProfile();
  
  const myProfile = myProfileResponse;
  const profile = response?.data; 

  const userForHeader = useMemo(() => ({
    name: myProfile ? getUserDisplayName(myProfile) : "Потребител",
    avatar: myProfile?.authorAvatar || ""
  }), [myProfile]);

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading
  } = useUserPosts(profile?.id || "");

  const { ref, entry } = useIntersection({
    root: null,
    threshold: 1
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
        fetchNextPage();
    }
  }, [entry, hasNextPage, fetchNextPage]);

  if (isProfileLoading) {
    return <ProfilePageSkeleton />;
  }

  if (isError || !profile) {
    return notFound();
  }

  const displayName = getUserDisplayName(profile);
  const initials = getInitials(displayName);
  const displayUsername = getUserUsername(profile);
  const profileImage = profile.authorAvatar || null;

  const isMe = myProfile?.id === profile.id;
  const status = profile.friendshipStatus ?? FriendshipStatus.None;
  const isSender = profile.isFriendRequestSender ?? false;

  const isFriend = status === FriendshipStatus.Accepted;
  const isPendingSent = status === FriendshipStatus.Pending && isSender;
  const isPendingReceived = status === FriendshipStatus.Pending && !isSender;
  
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
                                    {profile.bio && (
                                        <p className="text-sm text-foreground/90 leading-relaxed break-words">
                                            {profile.bio}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-center md:justify-start gap-5 text-sm font-medium pt-2 text-muted-foreground">
                                    <span className="hover:text-foreground cursor-pointer flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <strong className="text-foreground">{profile.friendsCount}</strong> Приятели
                                    </span>
                                    <span className="hover:text-foreground cursor-pointer">
                                        <strong className="text-foreground">{profile.followersCount}</strong> Последователи
                                    </span>
                                    <span className="hover:text-foreground cursor-pointer">
                                        <strong className="text-foreground">{profile.followingCount}</strong> Последвани
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
                                {isMe ? (
                                    <Button className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto h-9 px-4">
                                        Редактирай профил
                                    </Button>
                                ) : (
                                    <>
                                        {isFriend && (
                                            <Button variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 gap-2 h-9">
                                                <UserCheck className="h-4 w-4" /> Приятели
                                            </Button>
                                        )}

                                        {isPendingSent && (
                                            <Button variant="secondary" disabled className="gap-2 opacity-70 h-9">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Изпратена
                                            </Button>
                                        )}

                                        {isPendingReceived && (
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <Button className="bg-primary hover:bg-primary/90 h-9 flex-1">
                                                    Потвърди
                                                </Button>
                                                <Button variant="outline" className="h-9 flex-1">
                                                    Откажи
                                                </Button>
                                            </div>
                                        )}

                                        {(status === FriendshipStatus.None || status === FriendshipStatus.Declined) && (
                                            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-sm h-9">
                                                <UserPlus className="h-4 w-4" /> Добави
                                            </Button>
                                        )}

                                        <Button 
                                            variant="secondary" 
                                            className="gap-2 h-9"
                                            disabled={isFriend} 
                                        >
                                            {isFriend ? "Последван" : "Последвай"}
                                        </Button>

                                        <Button variant="secondary" className="gap-2 h-9">
                                            <MessageCircle className="h-4 w-4" /> 
                                        </Button>
                                        
                                        <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-5 border-t flex gap-6 overflow-x-auto scrollbar-hide">
                        {["Публикации", "Информация", "Приятели", "Медия & Документи"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    
                    <div className="lg:col-span-1 space-y-5 sticky top-24">
                        <ProfileFriendsCard profileId={profile.id} />
                        <ProfileMediaCard profileId={profile.id} />
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

                        {activeTab === "Информация" && (
                             <div className="bg-background rounded-xl border p-8 shadow-sm text-center text-muted-foreground">
                                <p>Информацията за потребителя ще се покаже тук.</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
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