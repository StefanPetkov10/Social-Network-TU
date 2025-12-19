"use client";

import { FriendRequest } from "@frontend/lib/types/friends"; 
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";

interface FriendRequestCardProps {
  request: any; 
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FriendRequestCard({ request, onConfirm, onDelete }: FriendRequestCardProps) {
  const initials = request.displayFullName
    ? request.displayFullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="h-48 w-full relative bg-gray-50">
        <Avatar className="h-full w-full rounded-none">
          <AvatarImage src={request.avatarUrl || ""} className="object-cover" />
          <AvatarFallback className="bg-primary text-white text-3xl font-bold rounded-none">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 truncate">
          {request.displayFullName}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
           Покана от @{request.userName}
        </p>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => onConfirm(request.pendingRequestId)} 
            className="w-full bg-primary text-white py-1.5 rounded-md font-medium hover:bg-primary/90 transition"
          >
            Потвърждаване
          </button>
          <button 
            onClick={() => onDelete(request.pendingRequestId)} 
            className="w-full bg-gray-100 text-gray-800 py-1.5 rounded-md font-medium hover:bg-gray-200 transition"
          >
            Изтриване
          </button>
          {/*<button 
            onClick={onDelete} 
            className="w-full bg-gray-100 text-gray-800 py-1.5 rounded-md font-medium hover:bg-gray-200 transition"
          ></button>}*/}
        </div>
      </div>
    </div>
  );
}