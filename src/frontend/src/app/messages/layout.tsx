"use client";

import { MessageList } from "@frontend/components/chat/message-list";
import ProtectedRoute from "@frontend/components/protected-route";
import { MainLayout } from "@frontend/components/main-layout";
import { useProfile } from "@frontend/hooks/use-profile"; 

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { data: profile } = useProfile();

  const user = {
    name: profile ? `${profile.firstName} ${profile.lastName}` : "Loading...",
    avatar: profile?.authorAvatar || ""
  };

  return (
    <ProtectedRoute>
      <MainLayout user={user}>
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
          <aside className="w-full md:w-[350px] border-r border-border flex flex-col bg-white z-10">
            <div className="p-4 border-b flex justify-between items-center h-[60px]">
              <h1 className="font-bold text-xl">Chats</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <MessageList />
            </div>
          </aside>

          <main className="flex-1 flex flex-col relative bg-white/50">
            {children}
          </main>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}