"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, UserPlus, UserCheck, MessageCircle, MoreHorizontal, UserMinus, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Loader2 } from "lucide-react";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { ProfileMediaCard } from "@frontend/components/profile-form/profile-media-card";
import { ProfileFriendsCard } from "@frontend/components/profile-form/profile-friends-card";
import { useUserPosts } from "@frontend/hooks/use-post";
import { useIntersection } from "@mantine/hooks";
import { getInitials, getUserDisplayName, getUserUsername } from "@frontend/lib/utils";


interface FriendProfileViewProps {
    profileId: string;
    initialData?: any;
    onBack: () => void;
    requestStatus?: 'pending_received' | 'pending_sent' | 'friend' | 'none';
    isFollowing?: boolean;
    requestId?: string;
}

export function FriendProfileView({ 
    profileId, 
    initialData, 
    onBack, 
    requestStatus = 'none',
    isFollowing = false
}: FriendProfileViewProps) {
    const [activeTab, setActiveTab] = useState("Публикации");
    
    const profile = initialData || {};
    
    const displayName = getUserDisplayName(profile);
    const initials = getInitials(displayName);
    const userName = getUserUsername(profile);

    const { 
        data: postsData, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage,
        isLoading: postsLoading 
    } = useUserPosts(profileId);

    const { ref, entry } = useIntersection({
        root: null,
        threshold: 1,
    });

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage();
        }
    }, [entry, hasNextPage, fetchNextPage]);

    return (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-300 w-full bg-gray-100 min-h-screen relative">
            
            <div className="sticky top-4 left-4 z-50 w-full px-4 pointer-events-none h-0 overflow-visible">
                <Button 
                    size="icon"
                    onClick={onBack} 
                    className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-md shadow-md border hover:bg-white text-gray-700 pointer-events-auto transition-all hover:scale-105"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>

            <div className="max-w-5xl mx-auto w-full px-4 space-y-5 pb-10 pt-14"> 
                <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-5 md:p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="relative group shrink-0">
                                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-lg ring-2 ring-muted">
                                    <AvatarImage src={profile.avatarUrl || profile.authorAvatar || profile.photo} className="object-cover" />
                                    <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-2 mt-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                    {displayName}
                                </h1>
                                
                                {userName && (
                                    <p className="text-muted-foreground font-medium">@{userName}</p>
                                )}

                                <div className="max-w-lg mx-auto md:mx-0 py-2">
                                    {profile.bio ? (
                                        <p className="text-sm text-foreground/90 leading-relaxed">
                                            {profile.bio}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Потребителят няма добавено описание.
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-center md:justify-start gap-6 text-sm font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors">
                                        <strong className="text-foreground">{profile.friendsCount || 0}</strong> Приятели
                                    </span>
                                    <span className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors">
                                        <strong className="text-foreground">{profile.followersCount || 0}</strong> Последователи
                                    </span>
                                    <span className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors">
                                        <strong className="text-foreground">{profile.followingCount || 0}</strong> Последвани
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto min-w-[160px]">
                                {requestStatus === 'pending_received' && (
                                    <>
                                       <Button className="w-full bg-primary hover:bg-primary/90 shadow-sm transition-all hover:shadow-md">
                                          Потвърди
                                       </Button>
                                       <Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800">
                                          Изтрий
                                       </Button>
                                    </>
                                )}

                                {requestStatus === 'none' && (
                                    <Button className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-sm transition-all hover:shadow-md">
                                       <UserPlus className="h-4 w-4" /> Добави
                                    </Button>
                                )}

                                {requestStatus === 'friend' && (
                                    <Button variant="secondary" className="w-full gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                                       <UserCheck className="h-4 w-4" /> Приятели
                                    </Button>
                                )}

                                {requestStatus === 'pending_sent' && (
                                    <Button variant="secondary" className="w-full gap-2 text-muted-foreground" disabled>
                                       <Loader2 className="h-4 w-4 animate-spin" /> Изпратена
                                    </Button>
                                )}

                                {isFollowing ? (
                                    <Button variant="outline" className="w-full gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                                        <UserMinus className="h-4 w-4" /> Отследване
                                    </Button>
                                ) : (
                                    <Button variant="secondary" className="w-full gap-2 hover:bg-gray-200 text-gray-800">
                                        Последвай
                                    </Button>
                                )}

                                <div className="flex gap-2 mt-1">
                                    <Button variant="secondary" className="flex-1 gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800">
                                        <MessageCircle className="h-4 w-4" /> Съобщение
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 border-t flex gap-8 overflow-x-auto scrollbar-hide bg-gray-50/50">
                        {["Публикации", "Информация", "Приятели", "Снимки"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-3 text-sm font-semibold border-b-[3px] transition-all whitespace-nowrap px-1 ${
                                    activeTab === tab 
                                    ? "border-primary text-primary" 
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    
                    <div className="lg:col-span-1 space-y-5 sticky top-20 h-fit">
                        {/* МЕДИЯТА Е ПЪРВА */}
                        <ProfileMediaCard profileId={profileId} />
                        <ProfileFriendsCard profileId={profileId} />
                    </div>

                    <div className="lg:col-span-2 space-y-4 pb-20">
                        {activeTab === "Публикации" && (
                            <>
                                {postsLoading ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="animate-spin text-primary h-8 w-8" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {postsData?.pages[0]?.data?.length === 0 ? (
                                             <div className="bg-background rounded-xl border p-12 shadow-sm text-center flex flex-col items-center justify-center gap-3">
                                                <div className="bg-muted/30 p-4 rounded-full">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold text-lg">Няма публикации</h3>
                                                    <p className="text-muted-foreground text-sm max-w-[250px]">
                                                        {displayName} все още не е споделил нищо във фийда си.
                                                    </p>
                                                </div>
                                             </div>
                                        ) : (
                                            postsData?.pages.map((page: any, i: number) => (
                                                <div key={i} className="space-y-4">
                                                    {page.data?.map((post: any) => (
                                                        <PostCard key={post.id} post={post} />
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                        
                                        {isFetchingNextPage && (
                                            <div className="flex justify-center p-4">
                                                <Loader2 className="animate-spin text-muted-foreground h-6 w-6" />
                                            </div>
                                        )}
                                        
                                        <div ref={ref} className="h-10 w-full" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}