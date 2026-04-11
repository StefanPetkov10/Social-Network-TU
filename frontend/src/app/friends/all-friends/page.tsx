"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Search, Users, UserX, Loader2 } from "lucide-react"; 

import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { Input } from "@frontend/components/ui/input";

import { FriendCard } from "@frontend/components/friends-forms/friend-card";
import { FriendsSidebar } from "@frontend/components/friends-forms/friends-sidebar";
import { FriendProfileView } from "@frontend/components/friends-forms/friend-profile-view";

import { useProfile } from "@frontend/hooks/use-profile";
import { useInfiniteFriends, useRemoveFriend, useSearchFriends } from "@frontend/hooks/use-friends"; 
import { useDebounce } from "@frontend/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";

import { FriendDto } from "@frontend/lib/types/friends";
import ProtectedRoute from '@frontend/components/protected-route';

export default function AllFriendsPage() {
  const [selectedProfile, setSelectedProfile] = useState<FriendDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  const { 
    data,
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading 
  } = useInfiniteFriends(profile?.id || ""); 

  const { 
    data: searchResults, 
    isFetching: isSearching 
  } = useSearchFriends(profile?.id || "", debouncedSearch);
  
  const { ref, inView } = useInView();
  const removeFriendMutation = useRemoveFriend();

  const friendsList = useMemo(() => {
      if (!data || !data.pages) return [];
      
      return data.pages.flatMap((page: any) => {
          return page.data || page.friends || (Array.isArray(page) ? page : []) || [];
      }) as FriendDto[];
  }, [data]);

  const totalCount = useMemo(() => {
      if (!data || !data.pages || data.pages.length === 0) return 0;
      
      const firstPage = data.pages[0] as any;
      return firstPage.meta?.totalCount ?? firstPage.totalCount ?? friendsList.length;
  }, [data, friendsList.length]);

  const displayFriends = useMemo(() => {
    if (debouncedSearch.length > 0 && searchResults?.data) {
        return searchResults.data;
    }
    return friendsList;
  }, [friendsList, searchResults, debouncedSearch]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !selectedProfile && !searchQuery) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, selectedProfile, searchQuery]);

  const userForLayout = useMemo(() => ({
    name: profile ? `${profile.fullName || ""}` : "Потребител",
    avatar: profile?.authorAvatar || ""
  }), [profile]);

  const handleViewProfile = (friend: FriendDto) => {
    setSelectedProfile(friend);
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
  };

  const handleRemoveFriend = (id: string) => {
    removeFriendMutation.mutate(id, {
        onSuccess: () => {
            const currentId = (selectedProfile as any)?.profileId || (selectedProfile as any)?.id;
            
            if (currentId === id) {
                setSelectedProfile(null);
            }
            queryClient.invalidateQueries({ queryKey: ["friends-list"] });
            queryClient.invalidateQueries({ queryKey: ["my-friends-infinite"] });
            queryClient.invalidateQueries({ queryKey: ["search-friends"] });
        }
    });
  };

  return (
    <ProtectedRoute>
     <SidebarProvider>
      <div className="h-screen w-full bg-[#f0f2f5] overflow-hidden flex flex-col text-foreground">
        
        <SiteHeader user={userForLayout} />

        <div className="flex flex-1 overflow-hidden pt-16">
          
          <div className="h-full overflow-y-auto shrink-0 hidden md:block" onClick={() => setSelectedProfile(null)}>
              <FriendsSidebar/>
          </div>

          <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            
            {selectedProfile ? (
                <div className="animate-in slide-in-from-right-4 duration-300">
                      <FriendProfileView 
                        profileId={(selectedProfile as FriendDto).profileId || (selectedProfile as any).id}
                        initialData={selectedProfile}
                        onBack={handleBackToList}
                        requestStatus="friend" 
                        isFollowing={true} 
                    />
                </div>
            ) : (
                <div className="animate-in fade-in duration-300 max-w-7xl mx-auto pb-20">
                    
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="h-7 w-7 text-primary" />
                                    Всички приятели
                                    <span className="text-gray-400 font-normal text-lg ml-2">
                                        ({searchQuery ? displayFriends.length : totalCount})
                                    </span>
                                </h1>
                                <p className="text-gray-500 mt-1">Управлявайте списъка си с приятели тук.</p>
                            </div>
                            
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="Търсене на приятели..." 
                                    className="pl-9 bg-white border-gray-200 focus-visible:ring-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                                )}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : displayFriends.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-70">
                            <div className="bg-gray-100 p-6 rounded-full mb-4">
                                <UserX className="size-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700">Няма намерени приятели</h3>
                            <p className="text-gray-500 mt-2 text-center max-w-sm">
                                {searchQuery 
                                    ? `Няма резултати за "${searchQuery}"` 
                                    : "Все още нямате добавени приятели."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {displayFriends.map((friend) => (
                                <FriendCard 
                                    key={friend?.profileId} 
                                    friend={friend} 
                                    onViewProfile={handleViewProfile}
                                    onRemove={handleRemoveFriend}
                                />
                            ))}
                            
                            {isFetchingNextPage && !searchQuery && [...Array(4)].map((_, i) => (
                                <div key={`loader-${i}`} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    )}
                    
                    {!searchQuery && <div ref={ref} className="h-10 w-full mt-4" />}
                </div>
            )} 
          </div>
        </div>
      </div>
     </SidebarProvider>
    </ProtectedRoute>
  );
}