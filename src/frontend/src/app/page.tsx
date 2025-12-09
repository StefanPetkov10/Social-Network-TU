"use client";

import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";
import { CreatePost } from "@frontend/components/create-post";
import { useProfile } from "@frontend/hooks/use-profile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";

export default function Home() {
  const router = useRouter();
  const { data: profile, isLoading, isError, error } = useProfile();

  useEffect(() => {
    if (isError) {
        const status = (error as any)?.response?.status || (error as any)?.status;
        if (status === 401) {
            localStorage.removeItem("token");
            router.push("/auth/login");
        }
    }
  }, [isError, error, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !profile) {
    const status = (error as any)?.response?.status || (error as any)?.status;
    
    if (status === 401) {
        return null;
    }

    return <ErrorScreen message={(error as any)?.message} />;
  }

  const displayName = profile.fullName || profile.firstName;
  
  const userForLayout = {
    name: displayName,
    avatar: profile.photo || ""
  };

  const userDataForPost = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    photo: profile.photo
  };

  return (
    <ProtectedRoute>
      <MainLayout user={userForLayout}>
          <div className="flex justify-center w-full">
              <main className="flex flex-col gap-4 p-4 w-full max-w-2xl">
                 <CreatePost user={userDataForPost} />
                 {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-background aspect-video rounded-xl border shadow-sm flex items-center justify-center text-muted-foreground">
                           Пост номер {i}
                      </div>
                 ))}
              </main>

              <aside className="hidden xl:block w-80 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                 <div className="rounded-xl border bg-background p-4 shadow-sm">
                      <h3 className="font-semibold mb-2 text-sm">Спонсорирано</h3>
                      <div className="aspect-video bg-muted rounded-md mb-2"></div>
                      <p className="text-xs text-muted-foreground">Рекламно съдържание.</p>
                 </div>
              </aside>
          </div>
      </MainLayout>
    </ProtectedRoute>
  );
}