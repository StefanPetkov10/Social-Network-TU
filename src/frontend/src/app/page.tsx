"use client";

import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";
import { CreatePost } from "@frontend/components/create-post";
import { useProfile } from "@frontend/hooks/use-profile";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@frontend/components/ui/button";

export default function Home() {
  const { data: profile, isLoading, isError, error } = useProfile();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Зареждане на съдържанието...</p>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/10">
        <div className="text-center space-y-4 max-w-md p-6 bg-background rounded-xl border shadow-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Възникна грешка</h2>
          <p className="text-muted-foreground">
            {(error as any)?.message || "Неуспешно зареждане на потребителските данни."}
          </p>
          <Button onClick={() => window.location.reload()}>Опитай отново</Button>
        </div>
      </div>
    );
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
                     <p className="text-xs text-muted-foreground">Рекламно съдържание или информация за събития.</p>
                 </div>
              </aside>
          </div>

      </MainLayout>
    </ProtectedRoute>
  );
}