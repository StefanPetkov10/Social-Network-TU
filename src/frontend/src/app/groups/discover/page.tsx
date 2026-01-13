"use client";

import { useEffect } from "react";
import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { SiteHeader } from "@frontend/components/site-header";
import ProtectedRoute from "@frontend/components/protected-route";
import { useProfile } from "@frontend/hooks/use-profile";
import { useDiscoverGroups } from "@frontend/hooks/use-groups"; 
import { DiscoverGroupCard } from "@frontend/components/groups-forms/discover-group-card";
import { GroupsSidebar } from "@frontend/components/groups-forms/groups-sidebar";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";
import { getUserDisplayName } from "@frontend/lib/utils";
import { Loader2, Compass, Sparkles } from "lucide-react";
import { useIntersection } from "@mantine/hooks";

export default function DiscoverGroupsPage() {
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useProfile();
  
  const { 
      data: groupsData, 
      isLoading: isGroupsLoading, 
      isError: isGroupsError,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage
  } = useDiscoverGroups();

  const { ref, entry } = useIntersection({
      root: null,
      threshold: 1,
  });

  useEffect(() => {
      if (entry?.isIntersecting && hasNextPage) {
          fetchNextPage();
      }
  }, [entry, hasNextPage, fetchNextPage]);


  if (isProfileLoading) return <LoadingScreen />;
  if (isProfileError || !profile) return <ErrorScreen message={(profileError as any)?.message} />;

  const userForLayout = {
    name: getUserDisplayName(profile),
    avatar: profile.authorAvatar || ""
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
              <div className="flex justify-center pt-6 px-4 pb-20">
                <main className="w-full max-w-6xl flex flex-col gap-6">
                  
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-center">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <Compass className="w-5 h-5 text-blue-200" />
                            <span className="uppercase tracking-widest text-xs font-bold">Откриване</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Намерете своята общност</h1>
                        <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
                            Разгледайте групи, препоръчани специално за вас на базата на вашите приятели.
                        </p>
                      </div>
                  </div>

                  {isGroupsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                      <p className="text-gray-500 font-medium">Търсим най-добрите групи за вас...</p>
                    </div>
                  ) : isGroupsError ? (
                    <div className="text-center py-10 text-red-500 bg-white rounded-xl border border-red-100 shadow-sm">
                      Възникна грешка при зареждането на предложенията.
                    </div>
                  ) : !groupsData?.pages?.[0]?.data?.length ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                      <div className="bg-gray-50 p-4 rounded-full inline-flex mb-4">
                        <Sparkles className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Няма намерени предложения</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Опитайте да добавите още приятели, за да видите къде членуват те.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                            {groupsData.pages.map((page, pageIndex) => (
                                page.data?.map((group, index) => {
                                    const isTopResult = pageIndex === 0 && index < 3;
                                    
                                    return (
                                        <DiscoverGroupCard 
                                            key={group.id} 
                                            group={group} 
                                            isTopResult={isTopResult} 
                                        />
                                    );
                                })
                            ))}
                        </div>

                        <div ref={ref} className="h-10 flex items-center justify-center">
                            {isFetchingNextPage && <Loader2 className="animate-spin text-blue-600" />}
                        </div>
                    </div>
                  )}

                </main>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}