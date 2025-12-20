"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { UserSearch, SearchX, Import } from "lucide-react";

import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";

import { FriendsSidebar } from "@frontend/components/friends-forms/friends-sidebar";
import { SuggestionCard } from "@frontend/components/friends-forms/suggestion-card";
import { FriendProfileView } from "@frontend/components/friends-forms/friend-profile-view";

import { 
  useInfiniteSuggestions, 
  useSendFriendRequest 
} from "@frontend/hooks/use-friends";

import { useProfile } from "@frontend/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";
import { getInitials } from '@frontend/lib/utils';
import ProtectedRoute from '@frontend/components/protected-route';

export default function FriendSuggestionsPage() {
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const { ref, inView } = useInView();

  const { 
    data: suggestions, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading 
  } = useInfiniteSuggestions();

  const sendFriendRequestMutation = useSendFriendRequest();

  const removePersonFromSuggestions = (profileId: string) => {
    queryClient.setQueryData(["friend-suggestions-infinite"], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((p: any) => p.profileId !== profileId),
        })),
      };
    });
  };

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !selectedProfile) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, selectedProfile]);

  const userForLayout = useMemo(() => ({
    name: profile ? `${profile.fullName || ""}` : "Потребител",
    avatar: profile?.photo || ""
  }), [profile]);

  const handleViewProfile = (person: any) => {
    setSelectedProfile({ ...person, _viewType: 'suggestion' });
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
  };

  const handleResetView = () => {
    if (selectedProfile) setSelectedProfile(null);
  };

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

  const renderLoading = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl" />
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 text-center">
      <div className="bg-blue-50 p-6 rounded-full mb-4 text-blue-400">
        <SearchX className="size-10" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Няма намерени предложения
      </h3>
      <p className="text-gray-500 max-w-md">
        В момента нямаме нови предложения за приятелство.
      </p>
    </div>
  );

  const renderGrid = () => {
    if (isLoading) return renderLoading();
    if (!suggestions || suggestions.length === 0) return renderEmpty();

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
        {suggestions.filter(Boolean).map((person: any) => (
          <div
            key={person.profileId}
            onClick={() => handleViewProfile(person)}
            className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg rounded-xl"
          >
            <SuggestionCard
              person={person}
              onAdd={() => handleAddFriend(person.profileId)}
              onRemove={() => handleRemoveSuggestion(person.profileId)}
            />
          </div>
        ))}

        {isFetchingNextPage &&
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-xl" />
          ))}
      </div>
    );
  };

  return (
    <ProtectedRoute>
     <SidebarProvider>
      <div className="h-screen w-full bg-[#f0f2f5] overflow-hidden flex flex-col text-foreground">
        <SiteHeader user={userForLayout} />

        <div className="flex flex-1 overflow-hidden pt-16">
          <div
            onClickCapture={handleResetView}
            className="h-full overflow-y-auto shrink-0 hidden md:block"
          >
            <FriendsSidebar />
          </div>

          <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            {selectedProfile ? (
              <FriendProfileView
                profileId={selectedProfile.profileId}
                initialData={selectedProfile}
                onBack={handleBackToList}
              />
            ) : (
              <div className="space-y-6 pb-20">
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                    <UserSearch className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Хора, които може би познавате
                    </h1>
                    <p className="text-gray-500 text-sm">
                      Разширете кръга си от приятели
                    </p>
                  </div>
                </div>

                {renderGrid()}

                <div ref={ref} className="h-20 w-full" />
              </div>
            )}
          </div>
        </div>
      </div>
     </SidebarProvider>
    </ProtectedRoute>
  );
}
