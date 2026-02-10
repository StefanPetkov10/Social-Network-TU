"use client";

import { FriendSuggestion } from "@frontend/lib/types/friends"; 
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { getInitials, getUserDisplayName } from "@frontend/lib/utils";

interface SuggestionCardProps {
  person: FriendSuggestion;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}


export function SuggestionCard({ person, onAdd, onRemove }: SuggestionCardProps) {
  const initials = getInitials(person.displayFullName);
  const displayName = getUserDisplayName(person);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="h-48 w-full relative bg-gray-50">
        <Avatar className="h-full w-full rounded-none">
          <AvatarImage src={person.authorAvatar || ""} className="object-cover" />
          {/*<AvatarFallback className="bg-primary text-white text-3xl font-bold rounded-none">*/}
          <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white text-3xl font-bold rounded-none">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 truncate">
          {displayName}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {person.mutualFriendsCount > 0 
            ? `${person.mutualFriendsCount} общи приятели` 
            : "Нов в TU Social"}
        </p>
        <div className="flex flex-col gap-2">
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onAdd(person.profileId);
            }} 
            className="w-full bg-primary/10 text-primary py-1.5 rounded-md font-medium hover:bg-primary/20 transition"
          >
            Добавяне
          </button>
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onRemove(person.profileId);
            }} 
            className="w-full bg-gray-100 text-gray-800 py-1.5 rounded-md font-medium hover:bg-gray-200 transition"
          >
            Премахване
          </button>
        </div>
      </div>
    </div>
  );
}