"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation"; 
import { 
  Loader2, 
  Users, 
  Lock, 
  Globe, 
  ChevronDown,
  LogOut,
  Clock,
  Info,
  FileText, 
  Image as ImageIcon,
  ShieldAlert,
  Trash2 
} from "lucide-react";
import { useIntersection } from "@mantine/hooks";

import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar"; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@frontend/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@frontend/components/ui/alert-dialog";

import { PostCard } from "@frontend/components/post-forms/post-card";
import { CreatePost } from "@frontend/components/post-forms/create-post-form";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";

import { useGroupByName, useGroupPosts, useDeleteGroup } from "@frontend/hooks/use-groups";
import { 
    useJoinGroup, 
    useLeaveGroup, 
    useGroupRequests,
    useGroupMembers 
} from "@frontend/hooks/use-group-members";
import { useProfile } from "@frontend/hooks/use-profile"; 
import { getInitials, getUserDisplayName } from "@frontend/lib/utils";
import ProtectedRoute from "@frontend/components/protected-route";
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { SiteHeader } from "@frontend/components/site-header";
import { GroupsSidebar } from "@frontend/components/groups-forms/groups-sidebar";
import { GroupRequestsView } from "@frontend/components/groups-forms/group-requests-view";
import { GroupMembersView } from "@frontend/components/groups-forms/group-members-view";
import { MediaGalleryView } from "@frontend/components/media/media-gallery-view";
import { DocumentsListView } from "@frontend/components/media/documents-list-view";


const TAB_MAP: Record<string, string> = {
    "posts": "Публикации",
    "people": "Хора",
    "media": "Медия",
    "files": "Документи",
    "requests": "Чакащи"
};

const REVERSE_TAB_MAP: Record<string, string> = {
    "Публикации": "posts",
    "Хора": "people",
    "Медия": "media",
    "Документи": "files",
    "Чакащи": "requests"
};

export default function GroupPage() {
    const params = useParams();
    const groupName = decodeURIComponent(params.name as string);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentTabParam = searchParams.get("tab") || "posts";
    const initialTab = TAB_MAP[currentTabParam] || "Публикации";

    const [activeTab, setActiveTab] = useState(initialTab);

    const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { data: groupData, isLoading: isGroupLoading, isError } = useGroupByName(groupName);
    const group = groupData?.data;

    const { data: currentUser } = useProfile();

    const { mutate: joinGroup, isPending: isJoining } = useJoinGroup();
    const { mutate: leaveGroup, isPending: isLeaving } = useLeaveGroup();
    const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();

    const { data: membersData } = useGroupMembers(group?.id || "");
    
    const previewMembers = membersData?.pages[0]?.data?.slice(0, 6) || [];

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

    useEffect(() => {
        const tabParam = searchParams.get("tab") || "posts";
        const tabName = TAB_MAP[tabParam] || "Публикации";
        setActiveTab(tabName);
    }, [searchParams]);

    const isMember = group?.isMember;
    const isOwner = group?.isOwner;
    const isAdmin = group?.isAdmin;
    const isPending = group?.hasRequestedJoin;

    const canModerate = isOwner || isAdmin;

    const shouldFetchRequests = !!group?.id && group.isPrivate && (isOwner || isAdmin);
    
    const { data: requestsData } = useGroupRequests(group?.id || "", { 
        enabled: shouldFetchRequests 
    }); 
    const pendingCount = requestsData?.data?.length || 0;

    const handleTabChange = (tabName: string) => {
        setActiveTab(tabName);
        
        const urlKey = REVERSE_TAB_MAP[tabName] || "posts";
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("tab", urlKey);
        router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    };

    if (isGroupLoading) return <LoadingScreen />;
    if (isError || !group) return <ErrorScreen message="Групата не е намерена или възникна грешка." />;

    const canViewContent = !group.isPrivate || isMember; 
    const baseTabs = ["Публикации", "Хора", "Медия", "Документи"];
    
    const showRequestsTab = group.isPrivate && (isOwner || isAdmin);
    const tabs = showRequestsTab ? [...baseTabs, "Чакащи"] : baseTabs;


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
                                                        {isOwner ? "Собственик" : "Присъединил се"}
                                                        <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    
                                                    <DropdownMenuItem 
                                                        className="text-red-600 cursor-pointer font-medium focus:bg-red-50 focus:text-red-700"
                                                        onSelect={(e) => {
                                                            e.preventDefault();
                                                            setIsLeaveDialogOpen(true);
                                                        }}
                                                    >
                                                        <LogOut className="w-4 h-4 mr-2" />
                                                        Напусни групата
                                                    </DropdownMenuItem>

                                                    {isOwner && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className="text-red-600 cursor-pointer font-bold focus:bg-red-50 focus:text-red-700 mt-1"
                                                                onSelect={(e) => {
                                                                    e.preventDefault();
                                                                    setIsDeleteDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Изтрий групата
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <>
                                                {isPending ? (
                                                    <Button disabled className="bg-gray-100 text-gray-500 gap-2 px-8 h-11 rounded-lg font-medium border border-gray-200">
                                                        <Clock className="w-5 h-5" />
                                                        Заявката е изпратена
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        onClick={() => joinGroup(group.id)}
                                                        disabled={isJoining}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-10 h-11 rounded-lg font-bold shadow-md shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        {isJoining ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Users className="w-5 h-5" />
                                                        )}
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
                                    onClick={() => handleTabChange(tab)}
                                    className={`relative py-4 px-6 text-[15px] font-semibold border-b-[3px] transition-all whitespace-nowrap flex items-center gap-2 ${
                                        activeTab === tab 
                                            ? "border-blue-600 text-blue-600" 
                                            : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                    }`}
                                >
                                    {tab}
                                    
                                    {tab === "Чакащи" && pendingCount > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
                                            {pendingCount > 99 ? "99+" : pendingCount}
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
                                        <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-5 border border-gray-200 animate-in fade-in zoom-in-95 duration-300">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                                <Lock className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Тази група е частна</h2>
                                                <p className="text-gray-500 text-lg max-w-md mx-auto">
                                                    {isPending 
                                                        ? "Вашата заявка за присъединяване се разглежда. Ще получите достъп, когато администратор я одобри."
                                                        : "Присъединете се към групата, за да разглеждате публикациите и да видите кой членува в нея."}
                                                </p>
                                            </div>
                                            {!isPending && (
                                                <Button onClick={() => joinGroup(group.id)} disabled={isJoining} className="font-semibold">
                                                    Присъедини се към групата
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {isMember && userDataForPost && (
                                                <CreatePost 
                                                    user={userDataForPost} 
                                                    groupId={group.id} 
                                                /> 
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
                                                                        isGroupAdmin={canModerate} 
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
                            
                           {activeTab === "Хора" && canViewContent && (
                                <GroupMembersView 
                                    groupId={group.id}
                                />
                            )}

                            {activeTab === "Медия" && canViewContent && (
                                <div className="space-y-4">
                                     <div className="bg-white rounded-xl border p-4 shadow-sm">
                                        <h2 className="text-lg font-bold flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5 text-primary" />
                                            Медия от групата
                                        </h2>
                                     </div>
                                     <MediaGalleryView id={group.id} type="group" />
                                </div>
                            )}

                            {activeTab === "Документи" && canViewContent && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                                        <h2 className="text-lg font-bold flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-primary" />
                                            Файлове
                                        </h2>
                                    </div>
                                    <DocumentsListView id={group.id} type="group" />
                                </div>
                            )}
                            
                            {activeTab === "Чакащи" && showRequestsTab && (
                                <GroupRequestsView 
                                    groupId={group.id} 
                                    requests={requestsData?.data || []} 
                                />
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
                                        <button 
                                            onClick={() => handleTabChange("Хора")} 
                                            className="text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Виж всички
                                        </button>
                                     </div>
                                     
                                     <div className="flex flex-wrap gap-2">
                                        {previewMembers.length > 0 ? (
                                            previewMembers.map((member) => (
                                                <Link key={member.profileId} href={`/${member.username}`}>
                                                    <Avatar className="h-11 w-11 border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-105">
                                                        <AvatarImage src={member.authorAvatar || ""} className="object-cover" />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold">
                                                            {getInitials(member.fullName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </Link>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm">Няма намерени членове.</span>
                                        )}
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

          <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
            <AlertDialogContent className="rounded-2xl">
                {isOwner ? (
                     <>
                        <AlertDialogHeader>
                            <div className="flex items-center gap-2 text-amber-600 mb-2">
                                <ShieldAlert className="w-6 h-6" />
                                <span className="font-bold text-sm uppercase tracking-wide">Изисква се действие</span>
                            </div>
                            <AlertDialogTitle className="text-xl font-bold">Не можете да напуснете групата</AlertDialogTitle>
                            <AlertDialogDescription className="text-base text-gray-600 mt-2">
                                Като <strong>Собственик</strong> на тази група, вие не можете да я напуснете директно.
                                <br/><br/>
                                Трябва първо да направите някой друг член <strong>Собственик (Owner)</strong> от менюто "Хора", или да изтриете групата.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 border-0">
                                Разбрах
                            </AlertDialogCancel>
                        </AlertDialogFooter>
                    </>
                ) : (
                    <>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">Напускане на групата?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base text-gray-600">
                                Сигурни ли сте, че искате да напуснете <span className="font-semibold text-gray-900">{group.name}</span>?
                                <br/><br/>
                                {group.isPrivate 
                                    ? "Тъй като групата е частна, вече няма да имате достъп до съдържанието, файловете и дискусиите в нея."
                                    : "Тъй като групата е публична, все още ще виждате съдържанието, но няма да можете да публикувате."
                                }
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="rounded-xl font-medium border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                                Отказ
                            </AlertDialogCancel>
                            <AlertDialogAction
                                className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200"
                                onClick={() => {
                                    leaveGroup(group.id);
                                    setIsLeaveDialogOpen(false);
                                }}
                                disabled={isLeaving}
                            >
                                {isLeaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Напусни
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </>
                )}
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <Trash2 className="w-6 h-6" />
                        <span className="font-bold text-sm uppercase tracking-wide">Внимание: Необратимо действие</span>
                    </div>
                    <AlertDialogTitle className="text-xl font-bold">Изтриване на групата?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-gray-600 mt-2">
                        Сигурни ли сте, че искате да изтриете <span className="font-bold text-gray-900">{group.name}</span>?
                        <br/><br/>
                        Това действие ще премахне завинаги всички публикации, снимки, файлове и членове свързани с тази група. <br/>
                        <span className="font-semibold text-red-600">Това действие не може да бъде отменено.</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="rounded-xl font-medium border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                        Отказ
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200"
                        onClick={() => {
                            deleteGroup(group.id);
                            setIsDeleteDialogOpen(false);
                        }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Изтрий завинаги
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </SidebarProvider>
    </ProtectedRoute>
    );
}