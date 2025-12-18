"use client";

import { FriendRequest } from "@frontend/lib/types/friends"; 

interface FriendRequestCardProps {
  request: FriendRequest;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FriendRequestCard({ request, onConfirm, onDelete }: FriendRequestCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="aspect-square w-full relative">
        <img 
          src={request.authorAvatar || "/default-avatar.png"} 
          alt={`${request.firstName} ${request.lastName}`} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 truncate text-base">
          {request.firstName} {request.lastName}
        </h3>
        {request.mutualFriendsCount > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            {request.mutualFriendsCount} общи приятели
          </p>
        )}
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => onConfirm(request.id)} 
            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Потвърждаване
          </button>
          <button 
            onClick={() => onDelete(request.id)} 
            className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Изтриване
          </button>
        </div>
      </div>
    </div>
  );
}