"use client";

import { FriendRequest } from "@frontend/lib/types/friends"; 
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";

interface FriendRequestCardProps {
  request: FriendRequest;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}

const getInitials = (first: string, last?: string) => {
    return ((first?.charAt(0) || "") + (last?.charAt(0) || "")).toUpperCase();
};

export function FriendRequestCard({ request, onConfirm, onDelete }: FriendRequestCardProps) {
  const initials = getInitials(request.firstName, request.lastName);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="h-48 w-full relative bg-gray-50">
        <Avatar className="h-full w-full rounded-none">
          <AvatarImage src={request.authorAvatar || ""} className="object-cover" />
          <AvatarFallback className="bg-primary text-white text-3xl font-bold rounded-none">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 truncate">
          {request.firstName} {request.lastName}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {request.mutualFriendsCount} общи приятели
        </p>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => onConfirm(request.id)} 
            className="w-full bg-primary text-white py-1.5 rounded-md font-medium hover:bg-primary/90 transition"
          >
            Потвърждаване
          </button>
          <button 
            onClick={() => onDelete(request.id)} 
            className="w-full bg-gray-100 text-gray-800 py-1.5 rounded-md font-medium hover:bg-gray-200 transition"
          >
            Изтриване
          </button>
        </div>
      </div>
    </div>
  );
}