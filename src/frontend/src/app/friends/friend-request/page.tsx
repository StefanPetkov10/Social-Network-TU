"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer'; 
import { Mail, BellRing } from "lucide-react"; 

import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";

import { FriendsSidebar } from "@frontend/components/friends-forms/friends-sidebar";
import { FriendRequestCard } from "@frontend/components/friends-forms/friend-request-card";
import { FriendProfileView } from "@frontend/components/friends-forms/friend-profile-view";

import { 
  useInfiniteFriendRequests, 
  useAcceptFriendRequest, 
  useDeclineFriendRequest 
} from "@frontend/hooks/use-friends";
import { useProfile } from "@frontend/hooks/use-profile";

export default function FriendRequestsPage() {
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  const { ref, inView } = useInView();

  const { data: profile } = useProfile();
  
  const { 
    data: requests = [], 
    isLoading: isLoadingRequests,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteFriendRequests();

  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !selectedProfile) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, selectedProfile]);

  const userForLayout = useMemo(() => ({
    name: profile ? `${profile.firstName} ${profile.lastName || ""}` : "Потребител",
    avatar: profile?.photo || ""
  }), [profile]);

  const handleViewProfile = (req: any) => {
    setSelectedProfile(req);
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
  };

  const handleResetView = () => {
    if (selectedProfile) {
      setSelectedProfile(null);
    }
  };

  const handleConfirm = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    acceptRequest.mutate(id);
    if (selectedProfile?.pendingRequestId === id) setSelectedProfile(null);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    declineRequest.mutate(id);
    if (selectedProfile?.pendingRequestId === id) setSelectedProfile(null);
  };

  const NotificationBadge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    const displayCount = count > 99 ? '99+' : count;
    
    return (
      <span className="flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white ml-2 animate-in zoom-in-50 duration-300">
        {displayCount}
      </span>
    );
  };

  const renderGrid = () => {
    if (isLoadingRequests) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-xl shadow-sm" />
                ))}
            </div>
        );
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-gray-100 p-6 rounded-full mb-4 text-gray-400">
                    <BellRing className="size-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Няма покани за сега!</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Нямате нови покани за приятелство. Когато получите такива, те ще се появят тук.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                {requests.filter((req) => req !== undefined).map((req) => (
                    <div 
                        key={req.pendingRequestId} 
                        onClick={() => handleViewProfile(req)} 
                        className="cursor-pointer group relative transition-all duration-200 hover:-translate-y-1 hover:shadow-md rounded-xl"
                    >
                        <FriendRequestCard 
                            request={req} 
                            onConfirm={(pendingRequestId) => handleConfirm(pendingRequestId)} 
                            onDelete={(pendingRequestId) => handleDelete(pendingRequestId)} 
                        />
                    </div>
                ))}
            </div>

            <div ref={ref} className="h-20 w-full flex items-center justify-center py-4">
                 {isFetchingNextPage && <span className="loading-spinner text-blue-500 opacity-75">Зареждане на още...</span>}
            </div>
        </>
    );
  };

  return (
    <SidebarProvider>
      <div className="h-screen w-full bg-[#f0f2f5] overflow-hidden flex flex-col text-foreground">
        
        <SiteHeader user={userForLayout} />

        <div className="flex flex-1 overflow-hidden pt-16">
          
          <div onClickCapture={handleResetView} className="h-full overflow-y-auto shrink-0 hidden md:block">
            <FriendsSidebar />
          </div>

          <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            
            {selectedProfile ? (
                <div className="animate-in slide-in-from-right-4 duration-300 ease-out">
                    <FriendProfileView 
                        profileId={selectedProfile.profileId}
                        initialData={selectedProfile}
                        onBack={handleBackToList}
                        requestId={selectedProfile.pendingRequestId}
                    />
                </div>
            ) : (
                <div className="animate-in fade-in-50 duration-300 pb-20">
                    
                    <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100/80 rounded-full text-blue-600 shadow-sm">
                                <Mail className="h-7 w-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center relative">
                                    Покани за приятелство
                                    <NotificationBadge count={requests.length} />
                                </h1>
                                <p className="text-gray-500 mt-1 text-sm font-medium">
                                    {requests.length > 0
                                        ? `Имате ${requests.length} чакащи заявки за преглед.` 
                                        : "Управлявайте вашите входящи покани."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {renderGrid()}
                </div>
            )}

          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}