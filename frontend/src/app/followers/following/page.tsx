"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Search, UserCheck, Users, Loader2 } from "lucide-react"; 

import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { Input } from "@frontend/components/ui/input";

import { FollowersSidebar } from "@frontend/components/followers-forms/followers-sidebar";
import { FollowingCard } from "@frontend/components/followers-forms/following-card";
import { FriendProfileView } from "@frontend/components/friends-forms/friend-profile-view";

import { useProfile } from "@frontend/hooks/use-profile";
import { useInfiniteFollowing, useUnfollowUser, useSearchFollowing } from "@frontend/hooks/use-followers"; 
import { useDebounce } from "@frontend/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from '@frontend/components/protected-route';
import { FollowUser } from "@frontend/lib/types/followers";

export default function FollowingPage() {
  const [selectedProfile, setSelectedProfile] = useState<FollowUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  const { 
    data: rawFollowing = [], 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading 
  } = useInfiniteFollowing(profile?.id || ""); 
  
  const { 
    data: searchResults, 
    isFetching: isSearching 
  } = useSearchFollowing(profile?.id || "", debouncedSearch);
  
  const { ref, inView } = useInView();
  
  const unfollowMutation = useUnfollowUser();

  const followingList = useMemo(() => {
    const list = rawFollowing as unknown as FollowUser[];
    return list?.filter((f): f is FollowUser => !!f) || [];
  }, [rawFollowing]);

  const displayFollowing = useMemo(() => {
    if (debouncedSearch.length > 0 && searchResults?.data) {
        return searchResults.data;
    }
    return followingList;
  }, [followingList, searchResults, debouncedSearch]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !selectedProfile && !debouncedSearch) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, selectedProfile, debouncedSearch]);

  const userForLayout = useMemo(() => ({
    name: profile ? `${profile.fullName || ""}` : "Потребител",
    avatar: profile?.authorAvatar || ""
  }), [profile]);

  const handleViewProfile = (person: FollowUser) => setSelectedProfile(person);
  const handleBackToList = () => setSelectedProfile(null);

  const handleUnfollow = (id: string) => {
      unfollowMutation.mutate(id, {
          onSuccess: () => {
              if (selectedProfile?.profileId === id) setSelectedProfile(null);
              queryClient.invalidateQueries({ queryKey: ["following-list"] });
              queryClient.invalidateQueries({ queryKey: ["feed"] });
              queryClient.invalidateQueries({ queryKey: ["search-following"] });
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
              <FollowersSidebar />
          </div>

          <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            
            {selectedProfile ? (
                <div className="animate-in slide-in-from-right-4 duration-300">
                      <FriendProfileView 
                        profileId={selectedProfile.profileId}
                        initialData={selectedProfile}
                        onBack={handleBackToList}
                        isFollowing={true} 
                        requestStatus={selectedProfile.isFriend ? "friend" : "none"}
                    />
                </div>
            ) : (
                <div className="animate-in fade-in duration-300 max-w-7xl mx-auto pb-20">
                    
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <UserCheck className="h-7 w-7 text-indigo-600" />
                                    Последвани
                                    <span className="text-gray-400 font-normal text-lg ml-2">
                                        ({displayFollowing.length})
                                    </span>
                                </h1>
                                <p className="text-gray-500 mt-1">Хората, чието съдържание виждате във вашия фийд.</p>
                            </div>
                            
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="Търсене..." 
                                    className="pl-9 bg-white border-gray-200 focus-visible:ring-indigo-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600 animate-spin" />
                                )}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : displayFollowing.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-70">
                            <div className="bg-gray-100 p-6 rounded-full mb-4">
                                <Users className="size-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700">Не следвате никого</h3>
                            <p className="text-gray-500 mt-2 text-center max-w-sm">
                                {searchQuery 
                                    ? `Няма резултати за "${searchQuery}"` 
                                    : "Използвайте страницата с предложения, за да намерите интересни хора."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {displayFollowing.map((person: FollowUser) => (
                                <FollowingCard 
                                    key={person.profileId || Math.random()} 
                                    person={person}
                                    onViewProfile={handleViewProfile}
                                    onUnfollow={handleUnfollow}
                                />
                            ))}
                            
                            {isFetchingNextPage && !debouncedSearch && [...Array(4)].map((_, i) => (
                                <div key={`loader-${i}`} className="h-72 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    )}
                    
                    {!debouncedSearch && <div ref={ref} className="h-10 w-full mt-4" />}
                </div>
            )} 
          </div>
        </div>
      </div>
     </SidebarProvider>
    </ProtectedRoute>
  );
}