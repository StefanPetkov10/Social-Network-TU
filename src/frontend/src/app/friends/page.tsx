"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { UserX, UserPlus, UserSearch, ArrowRight } from "lucide-react"; 
import Link from 'next/link'; 

import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { Button } from "@frontend/components/ui/button";
import { Separator } from "@frontend/components/ui/separator";

import { FriendRequestCard } from "@frontend/components/friends-forms/friend-request-card";
import { SuggestionCard } from "@frontend/components/friends-forms/suggestion-card";
import { FriendsSidebar } from "@frontend/components/friends-forms/friends-sidebar";
import { FriendProfileView } from "@frontend/components/friends-forms/friend-profile-view";

import { 
  useInfiniteFriendRequests, 
  useInfiniteSuggestions, 
  useSendFriendRequest, 
  useAcceptFriendRequest, 
  useDeclineFriendRequest 
} from "@frontend/hooks/use-friends";

import { useProfile } from "@frontend/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from '@frontend/components/protected-route';

export default function FriendsPage() {
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const { ref: suggestionsRef, inView: suggestionsInView } = useInView();

  const { 
      data: requests = [], 
      isLoading: isLoadingRequests 
  } = useInfiniteFriendRequests();
  
  const { 
    data: suggestions, 
    fetchNextPage: fetchNextSuggestions, 
    hasNextPage: hasNextSuggestions, 
    isFetchingNextPage: isFetchingNextSuggestions 
  } = useInfiniteSuggestions();
  
  const sendFriendRequestMutation = useSendFriendRequest();
  const acceptFriendRequestMutation = useAcceptFriendRequest();
  const declineFriendRequestMutation = useDeclineFriendRequest();

  const removePersonFromSuggestions = (profileId: string) => {
    queryClient.setQueryData(["friend-suggestions-infinite"], (oldData: any) => {
        if (!oldData) return oldData;
        
        let found = false;
        for (const page of oldData.pages) {
            if (page.data.some((p: any) => p.profileId === profileId)) {
                found = true;
                break;
            }
        }
        if (!found) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((person: any) => person.profileId !== profileId),
          })),
        };
      });
  };

  
  useEffect(() => {
    if (requests && requests.length > 0) {
        requests.filter((req) => req !== undefined).forEach((req) => {
            const senderId = req.profileId; 
            
            if (senderId) {
                removePersonFromSuggestions(senderId);
            }
        });
    }
  }, [requests]);

  useEffect(() => {
    if (suggestionsInView && hasNextSuggestions && !isFetchingNextSuggestions && !selectedProfile) {
      fetchNextSuggestions();
    }
  }, [suggestionsInView, hasNextSuggestions, isFetchingNextSuggestions, fetchNextSuggestions, selectedProfile]);

  const userForLayout = useMemo(() => ({
    name: profile ? `${profile.fullName || ""}` : "Потребител",
    avatar: profile?.photo || ""
  }), [profile]);

  const handleViewProfile = (person: any, type: 'request' | 'suggestion', e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setSelectedProfile({ ...person, _viewType: type });
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
  };

  const handleResetView = () => {
    if (selectedProfile) setSelectedProfile(null);
  };


  const handleConfirmRequest = (id: string) => {
    removePersonFromSuggestions(id);

    acceptFriendRequestMutation.mutate(id, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["friend-requests-infinite"] });
            queryClient.invalidateQueries({ queryKey: ["friends-list"] });
            if (selectedProfile?.pendingRequestId === id) setSelectedProfile(null);
        }
    });
  }

  const handleDeleteRequest = (id: string) => {
    declineFriendRequestMutation.mutate(id, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["friend-requests-infinite"] });
            if (selectedProfile?.pendingRequestId === id) setSelectedProfile(null);
        }
    });
  }

  const handleAddFriend = (id: string) => {
    removePersonFromSuggestions(id);

    sendFriendRequestMutation.mutate(id, {
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["friend-suggestions-infinite"] });
        },
        onError: () => {
            console.error("Грешка при добавяне");
        }
    });
  };

  const handleRemoveSuggestion = (id: string) => {
    removePersonFromSuggestions(id);
  };

  const renderRequestsSection = () => {
    if (isLoadingRequests) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
               {[...Array(5)].map((_, i) => <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-xl" />)}
            </div>
        );
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 opacity-60">
                <UserX className="size-8 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">Нямате нови покани</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {requests.filter((req) => req !== undefined).map((req) => (
                <div 
                    key={req.pendingRequestId} 
                    onClick={(e) => handleViewProfile(req, 'request', e)}
                    className="cursor-pointer group relative transition-all hover:-translate-y-1 hover:shadow-md rounded-xl"
                >
                    <FriendRequestCard 
                        request={req} 
                        onConfirm={() => handleConfirmRequest(req.pendingRequestId)} 
                        onDelete={() => handleDeleteRequest(req.pendingRequestId)} 
                    />
                </div>
            ))}
        </div>
    );
  };

  const renderSuggestionsSection = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {suggestions?.filter((person) => person !== undefined).map((person) => (
            <div 
                key={person.profileId || `sug-${Math.random()}`}
                onClick={(e) => handleViewProfile(person, 'suggestion', e)}
                className="cursor-pointer group relative transition-all hover:-translate-y-1 hover:shadow-md rounded-xl"
            >
                <SuggestionCard 
                    person={person} 
                    onAdd={() => handleAddFriend(person.profileId)} 
                    onRemove={() => handleRemoveSuggestion(person.profileId)} 
                />
            </div>
        ))}
        
        {isFetchingNextSuggestions && [...Array(5)].map((_, i) => (
            <div key={`sugg-loader-${i}`} className="h-72 bg-gray-200 animate-pulse rounded-xl" />
        ))}
    </div>
  );

  return (
    <ProtectedRoute>
     <SidebarProvider>

      <div className="h-screen w-full bg-[#f0f2f5] overflow-hidden flex flex-col text-foreground">
        
        <SiteHeader user={userForLayout} />

        <div className="flex flex-1 overflow-hidden pt-16">
          
          <div onClickCapture={handleResetView} className="h-full overflow-y-auto shrink-0 hidden md:block">
              <FriendsSidebar/>
          </div>

          <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            
            {selectedProfile ? (
                <div className="animate-in slide-in-from-right-4 duration-300">
                      <FriendProfileView 
                        profileId={selectedProfile.profileId || selectedProfile.id}
                        initialData={selectedProfile}
                        onBack={handleBackToList}
                        requestId={selectedProfile.pendingRequestId}
                    />
                </div>
            ) : (
                <div className="animate-in fade-in duration-300 space-y-8 pb-20">
                    
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                                <UserPlus className="h-6 w-6 text-blue-600" />
                                Покани за приятелство
                                {requests && requests.length > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {requests.length}
                                    </span>
                                )}
                            </h2>
                            {requests && requests.length > 0 && (
                                <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                    <Link href="/friends/friend-request" className="flex items-center">
                                        Виж всички <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                        {renderRequestsSection()}
                    </section>

                    <Separator className="bg-gray-200" />

                    <section>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                                <UserSearch className="h-6 w-6 text-purple-600" />
                                Хора, които може би познавате
                            </h2>
                        </div>
                        
                        {renderSuggestionsSection()}
                        
                        <div ref={suggestionsRef} className="h-10 w-full" />
                    </section>

                </div>
            )} 
          </div>
        </div>
      </div>
     </SidebarProvider>
    </ProtectedRoute>
  );
}