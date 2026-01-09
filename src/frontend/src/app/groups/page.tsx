"use client";

import { useEffect } from "react";
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { SiteHeader } from "@frontend/components/site-header";
import ProtectedRoute from "@frontend/components/protected-route";
import { CreatePost } from "@frontend/components/post-forms/create-post-form";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { useProfile } from "@frontend/hooks/use-profile";
import { useFeedGroups, useMyGroups } from "@frontend/hooks/use-groups"; 
import { useIntersection } from "@mantine/hooks";
import { Loader2, Newspaper } from "lucide-react";
import { getUserDisplayName } from "@frontend/lib/utils";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";
import { GroupsSidebar } from "@frontend/components/groups-forms/groups-sidebar";

export default function GroupsPage() {
  const { data: profile, isLoading: isProfileLoading, isError, error } = useProfile();
  
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPostsLoading
  } = useFeedGroups(); 

  const { ref, entry } = useIntersection({ root: null, threshold: 1 });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, fetchNextPage]);

  if (isProfileLoading) return <LoadingScreen />;
  if (isError || !profile) return <ErrorScreen message={(error as any)?.message} />;

  const userForLayout = {
    name: getUserDisplayName(profile),
    avatar: profile.authorAvatar || ""
  };

  const userDataForPost = {
    firstName: profile.firstName,
    lastName: profile.lastName ?? "",
    photo: profile.authorAvatar ?? null
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="h-screen w-full bg-[#f0f2f5] overflow-hidden flex flex-col text-foreground">
          <SiteHeader user={userForLayout} />

          <div className="flex flex-1 overflow-hidden pt-16">
            <div className="h-full overflow-y-auto shrink-0 hidden md:block">
              <GroupsSidebar />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-center pt-6 px-4 pb-10">
                <main className="w-full max-w-2xl flex flex-col gap-5">
                  <div className="mb-2">
                    <h1 className="text-xl font-bold text-gray-800">Скорошна дейност</h1>
                    <p className="text-sm text-gray-500">Публикации от групите, в които членувате</p>
                  </div>

                  {isPostsLoading && !postsData ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="animate-spin text-primary h-8 w-8" />
                    </div>
                  ) : (
                    postsData?.pages.map((page, i) => (
                      <div key={i} className="space-y-5">
                        {page.data?.map((post) => (
                          <PostCard key={post.id} post={post} authorProfile={profile}/>
                        ))}
                      </div>
                    ))
                  )}

                  {postsData?.pages[0]?.data?.length === 0 && (
                    <div className="text-center p-12 text-muted-foreground bg-white rounded-xl border border-dashed shadow-sm">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Newspaper className="text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Няма нови публикации</h3>
                      <p className="text-sm mt-1">Присъединете се към повече групи, за да виждате активност тук.</p>
                    </div>
                  )}

                  {isFetchingNextPage && (
                    <div className="flex justify-center p-4">
                      <Loader2 className="animate-spin text-muted-foreground" />
                    </div>
                  )}

                  <div ref={ref} className="h-4" />
                </main>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}