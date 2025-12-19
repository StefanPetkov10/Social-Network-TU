"use client";

import { useState } from "react";
import { ArrowLeft, UserPlus, UserCheck, MessageCircle, MoreHorizontal, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Loader2 } from "lucide-react";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { ProfileMediaCard } from "@frontend/components/profile-form/profile-media-card";
import { useUserPosts } from "@frontend/hooks/use-post";
import { useIntersection } from "@mantine/hooks";
import { useEffect } from "react";

interface FriendProfileViewProps {
    profileId: string;
    initialData?: any;
    onBack: () => void;
    requestStatus?: 'pending_received' | 'pending_sent' | 'friend' | 'none';
    isFollowing?: boolean;
    requestId?: string;
}

const getInitials = (name: string) => {
    return name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2) : "??";
};

export function FriendProfileView({ 
    profileId, 
    initialData, 
    onBack, 
    requestStatus = 'none',
    isFollowing = false
}: FriendProfileViewProps) {
    const [activeTab, setActiveTab] = useState("Публикации");
    
    const profile = initialData || {
        displayFullName: "Зареждане...",
        userName: "user",
        bio: "",
        photo: null,
        friendsCount: 0,
        followersCount: 0,
        followingCount: 0
    };

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

    const initials = getInitials(profile.displayFullName);

    return (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-300 w-full bg-gray-100 min-h-screen">
            
            <div className="sticky top-0 z-30 bg-gray-100/80 backdrop-blur-md px-4 py-2 mb-4 border-b">
                <Button 
                    variant="ghost" 
                    onClick={onBack} 
                    className="gap-2 pl-0 hover:bg-transparent hover:text-primary transition-colors text-gray-700 font-medium"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Назад към списъка
                </Button>
            </div>

            <div className="max-w-5xl mx-auto w-full px-4 space-y-5 pb-10">
                <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-5 md:p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="relative group shrink-0">
                                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-lg ring-2 ring-muted">
                                    <AvatarImage src={profile.avatarUrl || profile.photo} className="object-cover" />
                                    <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-2 mt-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile.displayFullName}</h1>
                                <p className="text-muted-foreground font-medium">@{profile.userName}</p>

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
                        
                        <div className="bg-background rounded-xl border p-4 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-foreground">Приятели</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 cursor-pointer group">
                                        <div className="w-full aspect-square rounded-lg bg-gray-200 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                        <span className="text-xs font-medium text-center truncate w-full px-1 text-gray-700 group-hover:text-primary transition-colors">
                                            Приятел {i}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Button variant="secondary" className="w-full mt-4 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
                                Виж всички приятели
                            </Button>
                        </div>

                        <ProfileMediaCard profileId={profileId} />
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
                                        {postsData?.pages.map((page: any, i: number) => (
                                            <div key={i} className="space-y-4">
                                                {page.data?.length === 0 && i === 0 ? (
                                                    <div className="text-center p-12 text-muted-foreground bg-white rounded-xl border border-dashed shadow-sm flex flex-col items-center gap-2">
                                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                                            <MoreHorizontal className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                        <p className="font-medium text-gray-900">Няма публикации</p>
                                                        <p className="text-sm">Потребителят все още не е публикувал нищо.</p>
                                                    </div>
                                                ) : (
                                                    page.data?.map((post: any) => (
                                                        <PostCard key={post.id} post={post} />
                                                    ))
                                                )}
                                            </div>
                                        ))}
                                        
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