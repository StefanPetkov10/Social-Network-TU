"use client";

import { useState, useEffect } from "react";
import {
    ArrowLeft,
    UserPlus,
    UserCheck,
    MessageCircle,
    MoreHorizontal,
    UserMinus,
    Image as ImageIcon,
    Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Loader2 } from "lucide-react";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { ProfileMediaCard } from "@frontend/components/profile-form/profile-media-card";
import { ProfileFriendsCard } from "@frontend/components/profile-form/profile-friends-card";
import { useUserPosts } from "@frontend/hooks/use-post";
import { useIntersection } from "@mantine/hooks";
import { getInitials, getUserDisplayName, getUserUsername, cn } from "@frontend/lib/utils";
import { useProfileById } from "@frontend/hooks/use-profile";

interface FriendProfileViewProps {
    profileId: string;
    initialData?: any;
    onBack: () => void;
    requestStatus?: "pending_received" | "pending_sent" | "friend" | "none";
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
    requestStatus = "none",
    isFollowing = false,
    friendsCount,
    followersCount,
    followingCount
}: FriendProfileViewProps) {
    const [activeTab, setActiveTab] = useState("Публикации");
    const [isScrolled, setIsScrolled] = useState(false);

    const { data: fetchedProfile, isLoading: isProfileLoading } = useProfileById(profileId);

    const profile = fetchedProfile?.data || initialData || {};

    const displayFriendsCount = profile.friendsCount ?? friendsCount ?? 0;
    const displayFollowersCount = profile.followersCount ?? followersCount ?? 0;
    const displayFollowingCount = profile.followingCount ?? followingCount ?? 0;

    const displayName = getUserDisplayName(profile);
    const initials = getInitials(displayName);
    const userName = getUserUsername(profile);
    const profileImage = profile.authorAvatar || profile.avatarUrl || profile.photo || null;
    const bio = profile.bio || "";

    const {
        data: postsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: postsLoading
    } = useUserPosts(profileId);

    const { ref, entry } = useIntersection({
        root: null,
        threshold: 1
    });

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage();
        }
    }, [entry, hasNextPage, fetchNextPage]);

    useEffect(() => {
        const scrollableEl =
            document.querySelector<HTMLElement>(".scroll-smooth") ||
            document.querySelector<HTMLElement>("main");

        const handleScroll = () => {
            const scrollTop = scrollableEl ? scrollableEl.scrollTop : window.scrollY;
            setIsScrolled(scrollTop > 10);
        };

        handleScroll();

        if (scrollableEl) {
            scrollableEl.addEventListener("scroll", handleScroll);
        } else {
            window.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (scrollableEl) {
                scrollableEl.removeEventListener("scroll", handleScroll);
            } else {
                window.removeEventListener("scroll", handleScroll);
            }
        };
    }, []);

    return (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-300 w-full min-h-screen relative pb-10">
            <div className="sticky top-0 left-0 z-50 pointer-events-none">
                <Button 
                    onClick={onBack}
                    className={cn(
                        "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center overflow-hidden group",
                        "-mt-2 -ml-2 pointer-events-auto h-11 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 text-gray-700 shadow-lg",
                        isScrolled ? "w-11 px-0 justify-center" : "px-6 w-auto"
                    )}
                >
                    <ArrowLeft className={cn("h-5 w-5 transition-transform ml-1 duration-300 group-hover:-translate-x-0.5", isScrolled ? "" : "mr-3")} />
                    <span className={cn("font-medium text-sm whitespace-nowrap", isScrolled ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100")}>
                        Назад
                    </span>
                </Button>
            </div>

            <div className="max-w-5xl mx-auto w-full space-y-6 pt-6"> 
                <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="relative group shrink-0">
                                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-lg ring-1 ring-border/20">
                                    <AvatarImage src={profileImage} className="object-cover" />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-2 mt-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                    {displayName}
                                </h1>
                                
                                {userName && (
                                    <p className="text-muted-foreground font-medium">{userName}</p>
                                )}

                                <div className="max-w-lg mx-auto md:mx-0 py-2">
                                    <p className="text-sm text-foreground/90 leading-relaxed">
                                        {bio}
                                    </p>
                                </div>

                                <div className="flex items-center justify-center md:justify-start gap-5 text-sm font-medium pt-2 text-muted-foreground">
                                    <span className="hover:text-foreground cursor-pointer flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <strong className="text-foreground">
                                            {isProfileLoading && !profile.friendsCount ? "..." : displayFriendsCount}
                                        </strong> Приятели
                                    </span>
                                    <span className="hover:text-foreground cursor-pointer">
                                        <strong className="text-foreground">
                                            {isProfileLoading && !profile.followersCount ? "..." : displayFollowersCount}
                                        </strong> Последователи
                                    </span>
                                    <span className="hover:text-foreground cursor-pointer">
                                        <strong className="text-foreground">
                                            {isProfileLoading && !profile.followingCount ? "..." : displayFollowingCount}
                                        </strong> Последвани
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto min-w-[160px]">
                                {requestStatus === 'pending_received' && (
                                    <>
                                       <Button className="w-full bg-primary hover:bg-primary/90 shadow-sm transition-all hover:shadow-md">
                                          Потвърди
                                       </Button>
                                       <Button variant="secondary" className="w-full bg-muted hover:bg-muted/80">
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
                                    <Button variant="secondary" className="w-full gap-2 text-muted-foreground cursor-default" disabled>
                                       <Loader2 className="h-4 w-4 animate-spin" /> Изпратена
                                    </Button>
                                )}

                                {isFollowing ? (
                                    <Button variant="outline" className="w-full gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                                        <UserMinus className="h-4 w-4" /> Отследване
                                    </Button>
                                ) : (
                                    <Button variant="secondary" className="w-full gap-2">
                                        Последвай
                                    </Button>
                                )}

                                <div className="flex gap-2 mt-1">
                                    <Button variant="secondary" className="flex-1 gap-2">
                                        <MessageCircle className="h-4 w-4" /> Съобщение
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-muted">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 border-t flex gap-8 overflow-x-auto scrollbar-hide bg-muted/30">
                        {["Публикации", "Информация", "Приятели", "Снимки"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "py-3 text-sm font-semibold border-b-[3px] transition-all whitespace-nowrap px-1",
                                    activeTab === tab 
                                    ? "border-primary text-primary" 
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                {tab}
                            </button>
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
                                {postsLoading ? (
                                    <div className="flex justify-center p-12">
                                        <Loader2 className="animate-spin text-primary h-8 w-8" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {postsData?.pages[0]?.data?.length === 0 ? (
                                             <div className="bg-background rounded-xl border p-12 shadow-sm text-center flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in duration-300">
                                                <div className="bg-muted/50 p-4 rounded-full">
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
                                            <div className="flex justify-center p-6">
                                                <Loader2 className="animate-spin text-muted-foreground h-6 w-6" />
                                            </div>
                                        )}
                                        
                                        <div ref={ref} className="h-4 w-full" />
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