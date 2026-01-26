"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Edit, Users, Loader2, Save, X, ImageIcon, FileText } from "lucide-react";
import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";
import { useProfile, useUpdateBio } from "@frontend/hooks/use-profile"; 
import { useUserPosts } from "@frontend/hooks/use-post";
import { CreatePost } from "@frontend/components/post-forms/create-post-form"; 
import { PostCard } from "@frontend/components/post-forms/post-card"; 
import { ProfileMediaCard } from "@frontend/components/profile-form/profile-media-card"; 
import { ProfileFriendsCard } from "@frontend/components/profile-form/profile-friends-card";
import { useIntersection } from "@mantine/hooks";
import { Input } from "@frontend/components/ui/input"; 
import { EditProfileDialog } from "@frontend/components/profile-form/profile-edit-dialog";
import { getInitials, getUserDisplayName, getUserUsername, cn } from "@frontend/lib/utils";
import { MediaGalleryView } from "@frontend/components/media/media-gallery-view";
import { DocumentsListView } from "@frontend/components/media/documents-list-view";
import { FriendsListView } from "@frontend/components/profile-form/friends-list-view";
import { FollowersListDialog, FollowingListDialog } from "@frontend/components/profile-form/follows-lists";

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

export default function ProfilePage() {
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
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddingBio, setIsAddingBio] = useState(false);
    const [bioInput, setBioInput] = useState("");

    const [showFollowersDialog, setShowFollowersDialog] = useState(false);
    const [showFollowingDialog, setShowFollowingDialog] = useState(false);

    const { data: profile, isLoading, isError, error } = useProfile();
    const { mutate: updateBio, isPending: isUpdatingBio } = useUpdateBio();

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
        if (entry?.isIntersecting && hasNextPage && activeTab === "Публикации") {
            fetchNextPage();
        }
    }, [entry, hasNextPage, fetchNextPage, activeTab]);

    useEffect(() => {
        if (isError) {
            const status = (error as any)?.response?.status || (error as any)?.status;
            if (status === 401) {
                localStorage.removeItem("token");
                router.push("/auth/login");
            }
        }
    }, [isError, error, router]);

    const handleSaveBio = () => {
        if (!bioInput.trim()) return;
        updateBio(bioInput, {
            onSuccess: () => {
                setIsAddingBio(false);
            }
        });
    };

    if (isLoading) return <LoadingScreen />;

    if (isError || !profile) {
        const status = (error as any)?.response?.status || (error as any)?.status;
        if (status === 401) return null;
        return <ErrorScreen message={(error as any)?.message} />;
    }

    const displayName = getUserDisplayName(profile);
    const initials = getInitials(displayName);
    const username = getUserUsername(profile);
    
    const bio = profile.bio || "";

    const userDataForPost = {
        firstName: profile.firstName,
        lastName: profile.lastName ?? "",
        photo: profile.authorAvatar ?? null
    };

    const userForLayout = {
        name: displayName,
        avatar: profile.authorAvatar || ""
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
                                            <AvatarImage src={profile.authorAvatar || ""} className="object-cover" />
                                            <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className="flex-1 text-center md:text-left space-y-1.5 mt-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
                                        <p className="text-muted-foreground font-medium">{username}</p>

                                        <div className="max-w-lg mx-auto md:mx-0 mt-2 min-h-[40px]">
                                            {bio ? (
                                                <p className="text-sm text-foreground/90 leading-relaxed break-words">
                                                    {bio}
                                                </p>
                                            ) : isAddingBio ? (
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
                                            ) : (
                                                <div 
                                                    onClick={() => setIsAddingBio(true)}
                                                    className="cursor-pointer group flex items-center justify-center md:justify-start gap-2"
                                                >
                                                    <p className="text-sm text-muted-foreground/60 italic border-b border-transparent group-hover:border-muted-foreground/60 transition-all">
                                                        Добавете кратко описание за себе си...
                                                    </p>
                                                    <Edit className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}
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
                                                className="hover:text-foreground cursor-pointer transition-colors"
                                                onClick={() => setShowFollowersDialog(true)}
                                            >
                                                <strong className="text-foreground">{profile.followersCount}</strong> Последователи
                                            </span>

                                            <span 
                                                className="hover:text-foreground cursor-pointer transition-colors"
                                                onClick={() => setShowFollowingDialog(true)}
                                            >
                                                <strong className="text-foreground">{profile.followingCount}</strong> Последвани
                                            </span>
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 h-9 px-4"
                                        onClick={() => setIsEditModalOpen(true)}
                                    >
                                        <Edit className="h-4 w-4" /> Редактирай профил
                                    </Button>
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

                        <EditProfileDialog 
                            isOpen={isEditModalOpen} 
                            onClose={() => setIsEditModalOpen(false)} 
                            profile={profile} 
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                            <div className={cn(
                                "lg:col-span-1 space-y-6",
                                "sticky bottom-6", 
                                "self-end",    
                                "h-fit"        
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
                                        {userDataForPost && <CreatePost user={userDataForPost} />}
                                        {postsLoading ? (
                                            <div className="flex justify-center p-4">
                                                <Loader2 className="animate-spin text-primary" />
                                            </div>
                                        ) : (
                                            <>
                                                {postsData?.pages[0]?.data && postsData.pages[0].data.length === 0 ? (
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
                                                                <PostCard key={post.id} post={post} authorProfile={profile} />
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
                                            </>
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
                </div>

                {profile && profile.id && (
                    <>
                        <FollowersListDialog 
                            open={showFollowersDialog} 
                            onOpenChange={setShowFollowersDialog} 
                            profileId={profile.id}
                            isMyProfile={true} 
                        />
                        <FollowingListDialog 
                            open={showFollowingDialog} 
                            onOpenChange={setShowFollowingDialog} 
                            profileId={profile.id}
                            isMyProfile={true} 
                        />
                    </>
                )}

            </MainLayout>
        </ProtectedRoute>
    );
}