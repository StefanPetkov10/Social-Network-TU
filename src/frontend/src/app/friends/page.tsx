"use client";

import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";

import { FriendRequestCard } from "@frontend/components/friends-forms/friend-request-card";
import { SuggestionCard } from "@frontend/components/friends-forms/suggestion-card";
import { FriendsSidebar } from "@frontend/components/friends-forms/friends-sidebar";

import { useFriendRequests, useInfiniteSuggestions } from "@frontend/hooks/use-friends";
import { useProfile } from "@frontend/hooks/use-profile";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const { ref, inView } = useInView();

  const { data: profile } = useProfile();
  const { data: requests = [], isLoading: isLoadingRequests } = useFriendRequests();
  const [visibleRequestsCount, setVisibleRequestsCount] = useState<number>(5);

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

  const userForLayout = {
    name: profile ? `${profile.firstName} ${profile.lastName || ""}` : "Потребител",
    avatar: profile?.photo || ""
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
                <span className="text-primary font-medium cursor-pointer hover:underline">Вижте всички</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {!isLoadingRequests && requests.slice(0, visibleRequestsCount).map((req) => (
                  <FriendRequestCard 
                    key={req.id} 
                    request={req} 
                    onConfirm={(id) => console.log(id)} 
                    onDelete={(id) => console.log(id)} 
                  />
                ))}
              </div>

              {visibleRequestsCount < requests.length && (
                <button 
                  onClick={() => setVisibleRequestsCount(prev => prev + 5)}
                  className="w-full mt-4 py-2 bg-gray-200 hover:bg-gray-300 font-semibold rounded-md transition"
                >
                  Виж още покани
                </button>
              )}
            </div>

            <div className="border-t border-gray-300 my-8"></div>

            <div>
              <h2 className="text-xl font-bold mb-4">Хора, които може би познавате</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {suggestions?.filter((person): person is NonNullable<typeof person> => person != null).map((person) => (
                  <SuggestionCard 
                    key={person.profileId} 
                    person={person} 
                    onAdd={(id) => console.log(id)} 
                    onRemove={(id) => console.log(id)} 
                  />
                ))}
                {isFetchingNextPage && [...Array(5)].map((_, i) => (
                  <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-xl" />
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