"use client";

import { SidebarProvider } from "@frontend/components/ui/sidebar";
import { SiteHeader } from "@frontend/components/site-header";
import ProtectedRoute from "@frontend/components/protected-route";
import { useProfile } from "@frontend/hooks/use-profile";
import { useMyGroups } from "@frontend/hooks/use-groups"; 
import { GroupCard } from "@frontend/components/groups-forms/group-card";
import { CreateGroupDialog } from "@frontend/components/groups-forms/create-group-dialog";
import { GroupsSidebar } from "@frontend/components/groups-forms/groups-sidebar";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";
import { getUserDisplayName } from "@frontend/lib/utils";
import { Loader2, Users } from "lucide-react";

export default function MyGroupsPage() {
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useProfile();
  
  const { data: groupsData, isLoading: isGroupsLoading, isError: isGroupsError } = useMyGroups();
  const groups = groupsData?.data || [];

  const userForLayout = {
    name: getUserDisplayName(profile),
    avatar: profile?.authorAvatar || ""
  };

  return (
    <ProtectedRoute>
      {isProfileLoading ? (
        <LoadingScreen />
      ) : isProfileError || !profile ? (
        <ErrorScreen message={(profileError as any)?.message} />
      ) : (
        <SidebarProvider>
          <div className="h-screen w-full bg-[#f0f2f5] overflow-hidden flex flex-col text-foreground">

            <SiteHeader user={userForLayout} />

          <div className="flex flex-1 overflow-hidden pt-16">
            
            <div className="h-full overflow-y-auto shrink-0 hidden md:block">
              <GroupsSidebar />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-center pt-6 px-4 pb-10">
                <main className="w-full max-w-5xl flex flex-col gap-6">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Вашите групи</h1>
                      <p className="text-sm text-gray-500 mt-1">
                        Управлявайте групите, в които членувате или притежавате.
                      </p>
                    </div>
                    <div className="w-full md:w-xs">
                        <CreateGroupDialog />
                    </div>
                  </div>

                  {isGroupsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">Зареждане на вашите групи...</p>
                    </div>
                  ) : isGroupsError ? (
                    <div className="text-center py-10 text-red-500 bg-white rounded-xl border border-red-100">
                      Възникна грешка при зареждането на групите. Моля, опитайте отново по-късно.
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                      <div className="bg-gray-50 p-4 rounded-full inline-flex mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Все още нямате групи</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Когато се присъедините към група или създадете нова, тя ще се появи тук.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {groups.map((group) => (
                        <GroupCard key={group.id} group={group} />
                      ))}
                    </div>
                  )}

                </main>
              </div>
            </div>
          </div>
        </div>
        </SidebarProvider>
      )}
    </ProtectedRoute> 
  )};