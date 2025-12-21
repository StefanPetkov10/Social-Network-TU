"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query"; 
import { useIntersection } from "@mantine/hooks";
import { Edit, Users, Loader2 } from "lucide-react";

import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Skeleton } from "@frontend/components/ui/skeleton"; 
import { MainLayout } from "@frontend/components/main-layout";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";
import ProtectedRoute from "@frontend/components/protected-route";

import { CreatePost } from "@frontend/components/post-forms/create-post-form"; 
import { PostCard } from "@frontend/components/post-forms/post-card"; 
import { ProfileMediaCard } from "@frontend/components/profile-form/profile-media-card"; 

import { useProfile } from "@frontend/hooks/use-profile";
import { useUserPosts } from "@frontend/hooks/use-post";
import { friendsService } from "@frontend/services/friends-service"; 

import { getInitials, getUserUsername, getUserDisplayName } from "@frontend/lib/utils";


function ProfileFriendsCard({ profileId }: { profileId: string }) {
  const { data: response, isLoading } = useQuery({
    queryKey: ["profile-friends-widget", profileId],
    queryFn: () => friendsService.getFriendsList(null, 9), 
    enabled: !!profileId,
  });

  const friends = response?.data || [];

  return (
    <div className="bg-background rounded-xl border p-4 shadow-sm h-fit">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="font-bold text-lg leading-none">Приятели</h3>
           {friends.length > 0 && (
             <span className="text-xs text-muted-foreground">{friends.length} (общо)</span>
           )}
        </div>
        {friends.length > 0 && (
            <Button variant="link" className="text-primary p-0 h-auto font-semibold">Виж всички</Button>
        )}
      </div>

      {friends.length === 0 ? (
         <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            <Users className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">Няма добавени приятели</p>
         </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
            {friends.map((friend: any) => {
                const name = getUserDisplayName(friend);
                const username = getUserUsername(friend);
                const initials = getInitials(name);
                const avatarSrc = friend.authorAvatar || friend.avatarUrl || friend.photo || "";

                return (
                    <div key={friend.profileId || Math.random()} className="flex flex-col items-center gap-1 cursor-pointer group">
                        
                        <div className="w-full aspect-square rounded-lg overflow-hidden relative border border-border/50 bg-gray-100">
                            <Avatar className="h-full w-full rounded-none">
                                <AvatarImage 
                                    src={avatarSrc} 
                                    className="object-cover transition-transform group-hover:scale-105 duration-300" 
                                />
                                <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold text-sm flex items-center justify-center h-full w-full">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                        </div>

                        <div className="w-full text-center">
                            <p className="text-xs font-semibold text-foreground/90 truncate w-full px-0.5 group-hover:text-primary transition-colors leading-tight">
                                {name}
                            </p>
                            {username && (
                                <p className="text-[10px] text-muted-foreground truncate w-full px-0.5 leading-tight">
                                    {username}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {friends.length > 0 && (
        <Button variant="secondary" className="w-full mt-4 text-sm bg-muted/50 hover:bg-muted text-foreground font-medium transition-colors">
            Виж всички приятели
        </Button>
      )}
    </div>
  );
}

export default function ProfilePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Публикации");

    const { data: profile, isLoading, isError, error } = useProfile();

    const {
        data: postsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: postsLoading
    } = useUserPosts(profile?.id || "");

    const { ref, entry } = useIntersection({
        root: null,
        threshold: 1,
    });

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage();
        }
    }, [entry, hasNextPage, fetchNextPage]);

    useEffect(() => {
        if (isError) {
            const status = (error as any)?.response?.status || (error as any)?.status;
            if (status === 401) {
                localStorage.removeItem("token");
                router.push("/auth/login");
            }
        }
    }, [isError, error, router]);

    if (isLoading) return <LoadingScreen />;

    if (isError || !profile) {
        const status = (error as any)?.response?.status || (error as any)?.status;
        if (status === 401) return null;
        return <ErrorScreen message={(error as any)?.message} />;
    }

    const displayName = profile.fullName || profile.firstName || "";
    const initials = getInitials(displayName);
    const bio = profile.bio || "";

    const userDataForPost = {
        firstName: profile.firstName,
        lastName: profile.lastName ?? "",
        photo: profile.photo ?? null
    };

    const userForLayout = {
        name: displayName,
        avatar: profile.photo || ""
    };

    return (
        <ProtectedRoute>
            <MainLayout user={userForLayout}>
                <div className="min-h-screen bg-gray-100 pb-10">
                    
                    <div className="max-w-5xl ml-36 mx-auto w-full p-4 space-y-5">

                        <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-5 md:p-6">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
                                    <div className="relative group">
                                        <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-lg ring-2 ring-muted">
                                            <AvatarImage src={profile.photo || ""} className="object-cover" />
                                            <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className="flex-1 text-center md:text-left space-y-1.5 mt-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
                                        <p className="text-muted-foreground font-medium">@{profile.userName}</p>

                                        <div className="max-w-lg mx-auto md:mx-0 mt-2">
                                            {bio ? (
                                                <p className="text-sm text-foreground/90 leading-relaxed">
                                                    {bio}
                                                </p>
                                            ) : (
                                                <div className="cursor-pointer group flex items-center justify-center md:justify-start gap-2">
                                                    <p className="text-sm text-muted-foreground/60 italic border-b border-transparent group-hover:border-muted-foreground/60 transition-all">
                                                        Добавете кратко описание за себе си...
                                                    </p>
                                                    <Edit className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
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

                                    <Button className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 h-9 px-4">
                                        <Edit className="h-4 w-4" /> Редактиране
                                    </Button>
                                </div>
                            </div>

                            <div className="px-5 border-t flex gap-6 overflow-x-auto scrollbar-hide">
                                {["Публикации", "Информация", "Приятели", "Медия & Документи"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                            activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                            <div className="lg:col-span-1 space-y-5 sticky top-20 h-fit">
                                <ProfileFriendsCard profileId={profile.id} />
                                <ProfileMediaCard profileId={profile.id} />
                            </div>

                            <div className="lg:col-span-2 space-y-4">

                                {userDataForPost && <CreatePost user={userDataForPost} />}

                                {postsLoading ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="animate-spin text-primary" />
                                    </div>
                                ) : (
                                    postsData?.pages.map((page, i) => (
                                        <div key={i} className="space-y-4">
                                            {page.data && page.data.length === 0 && i === 0 ? (
                                                <div className="text-center p-8 text-muted-foreground bg-white rounded-xl border border-dashed shadow-sm">
                                                    Все още няма публикации.
                                                </div>
                                            ) : (
                                                page.data?.map((post) => (
                                                    <PostCard key={post.id} post={post} />
                                                ))
                                            )}
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
                        </div>
                    </div>
                </div>
            </MainLayout>
        </ProtectedRoute>
    );
}