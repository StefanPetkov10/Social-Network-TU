"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { getInitials } from "@frontend/lib/utils";
import { FriendRequest } from "@frontend/lib/types/friends"; 

interface FriendRequestCardProps {
  request: FriendRequest; 
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FriendRequestCard({ request, onConfirm, onDelete }: FriendRequestCardProps) {
  const displayName = request.displayFullName || "Unknown";
  const initials = getInitials(displayName);
  const avatarUrl = request.authorAvatar;
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col h-full">
      <div className="h-48 w-full relative bg-gray-50 cursor-pointer group">
        <Avatar className="h-full w-full rounded-none">
          <AvatarImage src={avatarUrl || ""} className="object-cover group-hover:opacity-95 transition" />
          <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white text-3xl font-bold rounded-none">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 truncate cursor-pointer hover:underline hover:text-primary transition">
          {displayName}
        </h3>
        
        <p className="text-sm text-gray-500 mb-3">
           Покана от @{request.username}
        </p>
        
        <div className="mt-auto flex flex-col gap-2">
          <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                onConfirm(request.pendingRequestId); 
            }} 
            className="w-full bg-primary text-white py-1.5 rounded-md font-medium hover:bg-primary/90 transition"
          >
            Потвърждаване
          </button>
          
          <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                onDelete(request.pendingRequestId); 
            }} 
            className="w-full bg-gray-100 text-gray-800 py-1.5 rounded-md font-medium hover:bg-gray-200 transition"
          >
            Изтриване
          </button>
        </div>
      </div>
    </div>
  );
}