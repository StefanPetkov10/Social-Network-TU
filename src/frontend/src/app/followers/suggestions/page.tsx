"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { UserSearch, SearchX } from "lucide-react";

import { SiteHeader } from '@frontend/components/site-header';
import { SidebarProvider } from "@frontend/components/ui/sidebar";

import { FollowersSidebar } from "@frontend/components/followers-forms/followers-sidebar";
import { FollowSuggestionCard } from "@frontend/components/followers-forms/follow-suggestion-card";
import { FriendProfileView } from "@frontend/components/friends-forms/friend-profile-view";

import { 
  useInfiniteFollowerSuggestions, 
  useFollowUser 
} from "@frontend/hooks/use-followers";

import { useProfile } from "@frontend/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from '@frontend/components/protected-route';
import { getUserDisplayName } from "@frontend/lib/utils";

export default function FollowSuggestionsPage() {
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
  } = useInfiniteFollowerSuggestions();

  const followUserMutation = useFollowUser();

  const uniqueSuggestions = useMemo(() => {
    if (!suggestions) return [];
    
    const seen = new Set<string>();
    return suggestions.filter((person: any) => {
      const id = person.profileId || person.id;
      if (!id) return false;
      
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [suggestions]);

  const removePersonFromSuggestions = (profileId: string) => {
    queryClient.setQueryData(["follower-suggestions"], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((p: any) => {
              const pId = p.profileId || p.id;
              return pId !== profileId;
          }),
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
    name: profile ? getUserDisplayName(profile) : "Потребител",
    avatar: profile?.authorAvatar || ""
  }), [profile]);

  const handleViewProfile = (person: any) => {
    const normalizedProfile = {
        ...person,
        profileId: person.profileId || person.id
    };
    setSelectedProfile({ ...normalizedProfile, _viewType: 'follow_suggestion' });
  };

  const handleBackToList = () => {
    setSelectedProfile(null);
  };

  const handleResetView = () => {
    if (selectedProfile) setSelectedProfile(null);
  };

  const handleFollow = (id: string) => {
    removePersonFromSuggestions(id);

    followUserMutation.mutate(id, {
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["follower-suggestions"] });
             queryClient.invalidateQueries({ queryKey: ["following-list"] });
             queryClient.invalidateQueries({ queryKey: ["user"] });
        },
        onError: () => {
            console.error("Грешка при последване");
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
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 text-center shadow-sm">
      <div className="bg-indigo-50 p-6 rounded-full mb-4 text-indigo-400">
        <SearchX className="size-10" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Няма нови предложения
      </h3>
      <p className="text-gray-500 max-w-md">
        Прегледали сте всички предложения за последване към момента.
      </p>
    </div>
  );

  const renderGrid = () => {
    if (isLoading) return renderLoading();
    if (!uniqueSuggestions || uniqueSuggestions.length === 0) return renderEmpty();

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
        {uniqueSuggestions.map((person: any) => {
          const id = person.profileId || person.id;
          return (
            <div
              key={id}
              onClick={() => handleViewProfile(person)}
              className="cursor-pointer transition-all hover:-translate-y-1"
            >
              <FollowSuggestionCard
                person={person}
                onFollow={() => handleFollow(id)}
                onRemove={() => handleRemoveSuggestion(id)}
              />
            </div>
          );
        })}

        {isFetchingNextPage &&
          [...Array(5)].map((_, i) => (
            <div key={`loading-${i}`} className="h-80 bg-gray-100 animate-pulse rounded-xl" />
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
            <FollowersSidebar />
          </div>

          <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            {selectedProfile ? (
              <FriendProfileView
                profileId={selectedProfile.profileId}
                initialData={selectedProfile}
                onBack={handleBackToList}
                isFollowing={false} 
                requestStatus="none"
              />
            ) : (
              <div className="space-y-6 pb-20">
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                    <UserSearch className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Предложения за вас
                    </h1>
                    <p className="text-gray-500 text-sm">
                      Открийте интересни профили в TU Social
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