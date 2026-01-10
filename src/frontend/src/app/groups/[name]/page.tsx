"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Loader2, 
  Users, 
  Lock, 
  Globe, 
  ChevronDown,
  LogOut,
  Clock,
  Info
} from "lucide-react";
import { useIntersection } from "@mantine/hooks";

import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@frontend/components/ui/dropdown-menu";

import { PostCard } from "@frontend/components/post-forms/post-card";
import { CreatePost } from "@frontend/components/post-forms/create-post-form";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";

import { useGroupByName, useGroupPosts } from "@frontend/hooks/use-groups";
import { useProfile } from "@frontend/hooks/use-profile"; 
import { getInitials } from "@frontend/lib/utils";
import ProtectedRoute from "@frontend/components/protected-route";
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { SiteHeader } from "@frontend/components/site-header";
import { GroupsSidebar } from "@frontend/components/groups-forms/groups-sidebar";
import { getUserDisplayName } from "@frontend/lib/utils";

export default function GroupPage() {
    const params = useParams();
    const groupName = decodeURIComponent(params.name as string);

    const [activeTab, setActiveTab] = useState("Публикации");

    const { data: groupData, isLoading: isGroupLoading, isError } = useGroupByName(groupName);
    const group = groupData?.data;

    const { data: currentUser } = useProfile();

    const {
        data: postsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isPostsLoading
    } = useGroupPosts(group?.id || "");

    const { ref, entry } = useIntersection({
        root: null,
        threshold: 1,
    });

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage();
        }
    }, [entry, hasNextPage, fetchNextPage]);

    if (isGroupLoading) return <LoadingScreen />;
    if (isError || !group) return <ErrorScreen message="Групата не е намерена или възникна грешка." />;

    const isMember = group.isMember;
    const isOwner = group.isOwner;
    const isAdmin = group.isAdmin;
    const canViewContent = !group.isPrivate || isMember; 

    const baseTabs = ["Публикации", "Хора", "Медия", "Файлове"];
    const tabs = (isOwner || isAdmin) ? [...baseTabs, "Чакащи"] : baseTabs;

    const hasPendingRequests = true; 

    const userForLayout = {
        name: getUserDisplayName(currentUser),
        avatar: currentUser?.authorAvatar || ""
    };
      
    const userDataForPost = currentUser ? {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName ?? "",
        photo: currentUser.authorAvatar ?? null
    } : null;

    const memberLabel = group.membersCount === 1 ? "член" : "членове";

    return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="h-screen w-full bg-[#f0f2f5] overflow-hidden flex flex-col text-foreground">
          <SiteHeader user={userForLayout} />

          <div className="flex flex-1 overflow-hidden pt-16">
            <div className="h-full overflow-y-auto shrink-0 hidden md:block z-20">
              <GroupsSidebar />
            </div>

            <div className="flex-1 overflow-y-auto bg-[#f0f2f5] pb-10">
                <div className="max-w-7xl mx-auto w-full p-4 space-y-5">
                    
                    <div className="bg-gradient-to-b from-white to-blue-50/20 rounded-xl shadow-sm overflow-hidden border border-white">
                        <div className="p-5 md:p-8">
                            <div className="flex flex-col md:flex-row items-center md:items-center gap-6">
                                
                                <div className="shrink-0">
                                    <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-white shadow-lg">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 text-white text-4xl font-bold">
                                            {getInitials(group.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex-1 flex flex-col md:flex-row md:justify-between md:items-center gap-4 w-full text-center md:text-left">
                                    <div className="space-y-1">
                                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight -mt-1">
                                            {group.name}
                                        </h1>
                                        
                                        <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 text-sm font-medium pt-1">
                                            {group.isPrivate ? (
                                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    <Lock className="w-3.5 h-3.5" />
                                                    <span>Частна група</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                                    <Globe className="w-3.5 h-3.5" />
                                                    <span>Публична група</span>
                                                </div>
                                            )}
                                            <span className="text-gray-300">|</span>
                                            <span className="text-gray-900 font-semibold">
                                                {group.membersCount} {memberLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center">
                                        {isMember ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 gap-2 font-semibold px-6 h-11 rounded-lg transition-all shadow-sm">
                                                        <Users className="w-5 h-5" />
                                                        Присъединил се
                                                        <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="text-red-600 cursor-pointer font-medium focus:bg-red-50 focus:text-red-700">
                                                        <LogOut className="w-4 h-4 mr-2" />
                                                        Напусни групата
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <>
                                                {group.hasRequestedJoin ? (
                                                    <Button disabled className="bg-gray-100 text-gray-500 gap-2 px-8 h-11 rounded-lg font-medium">
                                                        <Clock className="w-5 h-5" />
                                                        Заявката е изпратена
                                                    </Button>
                                                ) : (
                                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-10 h-11 rounded-lg font-bold shadow-md shadow-blue-200 transition-all hover:scale-105 active:scale-95">
                                                        <Users className="w-5 h-5" />
                                                        Присъедини се
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="max-w-4xl mx-auto pt-6 border-t mt-6 border-gray-100">
                                <p className="text-gray-700 text-base md:text-lg text-center font-medium leading-relaxed max-w-2xl mx-auto">
                                     {group.description || "Няма добавено описание за тази група."}
                                </p>
                            </div>
                        </div>
                        
                        <div className="px-5 border-t flex gap-1 overflow-x-auto scrollbar-hide bg-white">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative py-4 px-6 text-[15px] font-semibold border-b-[3px] transition-all whitespace-nowrap flex items-center gap-2 ${
                                        activeTab === tab 
                                            ? "border-blue-600 text-blue-600" 
                                            : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                    }`}
                                >
                                    {tab}
                                    {tab === "Чакащи" && hasPendingRequests && (
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        
                        <div className="lg:col-span-2 space-y-5">
                            {activeTab === "Публикации" && (
                                <>
                                    {!canViewContent ? (
                                        <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-5 border border-gray-200">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                                <Lock className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Тази група е частна</h2>
                                                <p className="text-gray-500 text-lg">
                                                    Присъединете се към групата, за да разглеждате публикациите.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {isMember && userDataForPost && (
                                                <CreatePost user={userDataForPost} /> 
                                            )}

                                            {isPostsLoading ? (
                                                <div className="flex justify-center p-8 bg-white rounded-xl shadow-sm">
                                                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                                                </div>
                                            ) : (
                                                <>
                                                    {postsData?.pages.map((page, i) => (
                                                        <div key={i} className="space-y-5">
                                                            {page.data && page.data.length === 0 && i === 0 ? (
                                                                <div className="text-center p-12 text-gray-500 bg-white rounded-xl shadow-sm">
                                                                    <p className="font-semibold text-lg">Все още няма публикации.</p>
                                                                    <p>Споделете нещо с групата!</p>
                                                                </div>
                                                            ) : (
                                                                page.data?.map((post) => (
                                                                    <PostCard 
                                                                        key={post.id}
                                                                        post={post}
                                                                        authorProfile={currentUser || undefined}
                                                                        hideGroupInfo={true} 
                                                                    />
                                                                ))
                                                            )}
                                                        </div>
                                                    ))}
                                                    
                                                    {isFetchingNextPage && (
                                                        <div className="flex justify-center p-4">
                                                            <Loader2 className="animate-spin text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div ref={ref} className="h-4" />
                                                </>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                             {activeTab === "Чакащи" && (isAdmin || isOwner) && (
                                <div className="bg-white p-6 rounded-xl shadow-sm">
                                    <h3 className="text-lg font-bold mb-4">Чакащи заявки</h3>
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                        {hasPendingRequests ? "Списък със заявки..." : "Няма чакащи заявки."}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-1 space-y-5 sticky top-20 h-fit">
                            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">Информация</h3>
                                <div className="space-y-5">
                                    <div className="flex items-start gap-3 text-gray-700">
                                        {group.isPrivate ? <Lock className="w-6 h-6 text-gray-400 shrink-0" /> : <Globe className="w-6 h-6 text-blue-500 shrink-0" />}
                                        <div>
                                            <p className="font-bold text-gray-900 text-base">{group.isPrivate ? "Частна" : "Публична"}</p>
                                            <p className="text-sm text-gray-500 leading-snug mt-1">
                                                {group.isPrivate 
                                                    ? "Само членове могат да виждат кой е в групата и какво публикуват." 
                                                    : "Всеки може да вижда кой е в групата и какво публикуват."}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3 text-gray-700">
                                        <Info className="w-6 h-6 text-blue-500 shrink-0" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-base">За групата</p>
                                            <p className="text-sm text-gray-500 leading-snug mt-1 break-words">
                                                {group.description || "Няма описание"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {canViewContent && (
                                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                                     <div className="flex justify-between items-center mb-4">
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-gray-900 text-lg">Членове</h3>
                                            <span className="text-xs text-gray-500">{group.membersCount} общо</span>
                                        </div>
                                        <Link href="#" className="text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                            Виж всички
                                        </Link>
                                     </div>
                                     
                                     <div className="flex flex-wrap gap-2">
                                        {[1,2,3,4,5,6].map((i) => (
                                            <div key={i} className="h-11 w-11 rounded-full bg-gray-200 border-2 border-white shadow-sm" />
                                        ))}
                                     </div>
                                </div>
                            )}

                            <div className="text-xs text-gray-400 px-2 text-center">
                                <p>TU Social © 2025</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
    );
}