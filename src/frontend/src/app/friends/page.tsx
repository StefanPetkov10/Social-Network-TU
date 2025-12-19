"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { UserX } from "lucide-react"; 
import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";

import { FriendRequestCard } from "@frontend/components/friends-forms/friend-request-card";
import { SuggestionCard } from "@frontend/components/friends-forms/suggestion-card";
import { FriendsSidebar } from "@frontend/components/friends-forms/friends-sidebar";

import { useFriendRequests, 
  useInfiniteSuggestions, 
  useSendFriendRequest, 
  useAcceptFriendRequest, 
  useDeclineFriendRequest } from "@frontend/hooks/use-friends";

import { useProfile } from "@frontend/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();

  const { data: profile } = useProfile();
  const { data: requests = [], isLoading: isLoadingRequests } = useFriendRequests();
  const [visibleRequestsCount, setVisibleRequestsCount] = useState<number>(5);
  const sendFriendRequestMutation = useSendFriendRequest();

  const { 
    data: suggestions, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteSuggestions();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const userForLayout = useMemo(() => ({
    name: profile ? `${profile.firstName} ${profile.lastName || ""}` : "Потребител",
    avatar: profile?.photo || ""
  }), [profile]);

  const acceptFriendRequestMutation = useAcceptFriendRequest();
  const declineFriendRequestMutation = useDeclineFriendRequest();

  const handleConfirmRequest = (id: string) => {
    acceptFriendRequestMutation.mutate(id);
  }
  const handleDeleteRequest = (id: string) => {
    declineFriendRequestMutation.mutate(id);
  }

  const handleAddFriend = (id: string) => {
    sendFriendRequestMutation.mutate(id);
  };

  const handleRemoveSuggestion = (id: string) => {
    queryClient.setQueryData(["friend-suggestions-infinite"], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((person: any) => person.profileId !== id),
        })),
      };
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#f0f2f5] w-full text-foreground">
        <SiteHeader user={userForLayout} />

        <div className="flex pt-16 min-h-screen">
          <FriendsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="flex-1 p-8 min-w-0">
            
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Покани за приятелство</h2>
              </div>

              {isLoadingRequests ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={`req-loader-${i}`} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : requests.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {requests && requests.length > 0 && requests.slice(0, visibleRequestsCount).map((req) => {
                  if (!req || !req.profileId) return null;
                  return (
                    <FriendRequestCard 
                      key={req.pendingRequestId} 
                      request={req} 
                      onConfirm={(pendingRequestId) => handleConfirmRequest(pendingRequestId)} 
                      onDelete={(pendingRequestId) => handleDeleteRequest(pendingRequestId)} 
                    />
                  );
                })}
              </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 opacity-60">
                  <UserX className="size-8 text-gray-400 mb-2" />
                  <p className="text-gray-500 font-medium">Нямате нови покани</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-300 my-8"></div>

            <div>
              <h2 className="text-xl font-bold mb-4">Хора, които може би познавате</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {suggestions?.filter((person) => person !== undefined).map((person) => (
                  <SuggestionCard 
                    key={person.profileId || `sug-${Math.random()}`} 
                    person={person} 
                    onAdd={() => handleAddFriend(person.profileId)} 
                    onRemove={() => handleRemoveSuggestion(person.profileId)} 
                  />
                ))}
                
                {isFetchingNextPage && [...Array(5)].map((_, i) => (
                  <div key={`sugg-loader-${i}`} className="h-72 bg-gray-200 animate-pulse rounded-xl" />
                ))}
              </div>
              <div ref={ref} className="h-20" />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}