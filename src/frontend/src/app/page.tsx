"use client";

import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";

export default function Home() {
  const user = { 
      name: "Стефан Петков", 
      avatar: "" 
  }; 

  return (
    <ProtectedRoute>
      <MainLayout user={user}>
          
          <div className="flex justify-center w-full">
              
              <main className="flex flex-col gap-4 p-4 w-full max-w-2xl">
                 
                 <div className="bg-background rounded-xl border p-8 text-center text-muted-foreground shadow-sm">
                     Тук ще бъде формата: "За какво мислите, Стефан?"
                 </div>

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