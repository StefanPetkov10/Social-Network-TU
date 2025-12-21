"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Search, Users, Ghost } from "lucide-react"; 

import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { Input } from "@frontend/components/ui/input";
import { Button } from "@frontend/components/ui/button";

import { FriendCard } from "@frontend/components/friends-forms/friend-card";
import { FriendsSidebar } from "@frontend/components/friends-forms/friends-sidebar";
import { FriendProfileView } from "@frontend/components/friends-forms/friend-profile-view";

import { useProfile } from "@frontend/hooks/use-profile";
import { useInfiniteFriends, useRemoveFriend } from "@frontend/hooks/use-friends"; 
import { useQueryClient } from "@tanstack/react-query";

export default function AllFriendsPage() {
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  // 1. Използваме твоя hook (няма аргументи, връща директно масив заради select)
  const { 
    data: friendsList = [], // Default value, защото може да е undefined в началото
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading 
  } = useInfiniteFriends(); 
  
  const { ref, inView } = useInView();
  const removeFriendMutation = useRemoveFriend();

  // Локално филтриране, тъй като API-то в момента не поддържа сървърно търсене
  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friendsList;
    return friendsList.filter((friend: any) => 
       (friend.displayFullName || friend.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friendsList, searchQuery]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !selectedProfile && !searchQuery) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, selectedProfile, searchQuery]);

  const userForLayout = useMemo(() => ({
    name: profile ? `${profile.fullName || ""}` : "Потребител",
    avatar: profile?.photo || ""
  }), [profile]);

  const handleViewProfile = (friend: any) => {
    setSelectedProfile(friend);
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
  };

  const handleRemoveFriend = (id: string) => {
    removeFriendMutation.mutate(id, {
        onSuccess: () => {
            // При успех затваряме профила, ако е отворен
            if (selectedProfile?.id === id || selectedProfile?.profileId === id) {
                setSelectedProfile(null);
            }
            // invalidateQueries се случва автоматично в hook-а ти
        }
    });
  };

  return (
     <SidebarProvider>
      <div className="h-screen w-full bg-[#f0f2f5] overflow-hidden flex flex-col text-foreground">
        
        <SiteHeader user={userForLayout} />

        <div className="flex flex-1 overflow-hidden pt-16">
          
          <div className="h-full overflow-y-auto shrink-0 hidden md:block" onClick={() => setSelectedProfile(null)}>
              <FriendsSidebar/>
          </div>

          <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            
            {selectedProfile ? (
                // --- ИЗГЛЕД: Профил ---
                <div className="animate-in slide-in-from-right-4 duration-300">
                      <FriendProfileView 
                        profileId={selectedProfile.profileId || selectedProfile.id}
                        initialData={selectedProfile}
                        onBack={handleBackToList}
                        requestStatus="friend" 
                        isFollowing={true}
                    />
                </div>
            ) : (
                // --- ИЗГЛЕД: Списък с приятели ---
                <div className="animate-in fade-in duration-300 max-w-7xl mx-auto pb-20">
                    
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="h-7 w-7 text-primary" />
                                    Всички приятели
                                    <span className="text-gray-400 font-normal text-lg ml-2">
                                        ({filteredFriends.length})
                                    </span>
                                </h1>
                                <p className="text-gray-500 mt-1">Управлявайте списъка си с приятели тук.</p>
                            </div>
                            
                            {/* Търсачка */}
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="Търсене на приятели..." 
                                    className="pl-9 bg-white border-gray-200 focus-visible:ring-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : filteredFriends.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-70">
                            <div className="bg-gray-100 p-6 rounded-full mb-4">
                                <Ghost className="size-12 text-gray-400" />
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
                            {filteredFriends.map((friend: any) => (
                                <FriendCard 
                                    key={friend.profileId || friend.id || Math.random()} 
                                    friend={friend} 
                                    onViewProfile={handleViewProfile}
                                    onRemove={handleRemoveFriend}
                                />
                            ))}
                            
                            {/* Лоудър за следващи страници (само ако не търсим) */}
                            {isFetchingNextPage && !searchQuery && [...Array(4)].map((_, i) => (
                                <div key={`loader-${i}`} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    )}
                    
                    {/* Trigger element за Infinite Scroll (скрит при търсене) */}
                    {!searchQuery && <div ref={ref} className="h-10 w-full mt-4" />}
                </div>
            )} 
          </div>
        </div>
      </div>
     </SidebarProvider>
  );
}