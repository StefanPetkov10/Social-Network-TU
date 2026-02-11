"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { usePathname } from "next/navigation";
import { cn } from "@frontend/lib/utils";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@frontend/components/ui/input";
import { useConversations } from "@frontend/hooks/use-chat-query";
import { getInitials } from "@frontend/lib/utils";


export function MessageList() {
  const pathname = usePathname();
  
  const { data: conversations, isLoading, isError } = useConversations();

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b">
         <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Търсене..." className="pl-8 bg-slate-50 border-none rounded-full h-9" />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        
        {isLoading && (
            <div className="flex justify-center py-4">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
        )}

        {isError && (
            <div className="text-center text-red-500 text-sm py-4">
                Грешка при зареждане.
            </div>
        )}

        {!isLoading && conversations?.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8 px-4">
                Нямате активни чатове. <br/> Намерете приятел и му пишете!
            </div>
        )}

        {conversations?.map((chat) => {
           const isActive = pathname === `/messages/${chat.id}`;
           const time = chat.lastMessageTime 
                ? new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "";
           const initials = getInitials(chat.name);

           return (
            <Link 
              key={chat.id} 
              href={`/messages/${chat.id}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-slate-100",
                isActive ? "bg-slate-100 border-l-4 border-primary pl-2 shadow-sm" : "border-l-4 border-transparent"
              )}
            >
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage 
                    src={chat.authorAvatar || ""} 
                    className="object-cover" 
                />
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white font-bold text-sm">
                    {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className={cn("font-semibold text-sm truncate", isActive ? "text-primary" : "text-foreground")}>
                    {chat.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate opacity-80 font-medium">
                  {chat.lastMessage || "Start a conversation"}
                </p>
              </div>
            </Link>
           )
        })}
      </div>
    </div>
  );
}