"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { UserPlus, X } from "lucide-react";
import { getInitials, getUserDisplayName } from "@frontend/lib/utils";
import { FollowSuggestion } from "@frontend/lib/types/followers"; 

interface FollowSuggestionCardProps {
  person: FollowSuggestion; 
  onFollow: () => void;
  onRemove: () => void;
}

export function FollowSuggestionCard({ person, onFollow, onRemove }: FollowSuggestionCardProps) {
  const displayName = getUserDisplayName(person);
  const initials = getInitials(displayName);
  const avatarUrl = person.authorAvatar || "";
  const reason = person.reason || "Популярен потребител";
  const mutualCount = person.mutualFollowersCount || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full relative group">
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onRemove();
            }}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
        >
            <X className="h-4 w-4" />
        </button>

      <div className="p-4 flex flex-col items-center flex-1">
        <div className="relative mb-3">
            <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
            <AvatarImage src={avatarUrl} className="object-cover" />
            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-bold">
                {initials}
            </AvatarFallback>
            </Avatar>
        </div>

        <h3 className="font-bold text-gray-900 text-center truncate w-full px-2">
          {displayName}
        </h3>
        
        <p className="text-sm text-gray-500 text-center mb-1">
          @{person.userName}
        </p>

        <p className="text-xs text-indigo-600 font-medium text-center mt-1 px-2 line-clamp-2 min-h-[2.5em]">
           {mutualCount > 0 ? `${mutualCount} общи последователи` : reason}
        </p>
      </div>

      <div className="p-4 pt-0 mt-auto">
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onFollow();
          }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Последвай
        </Button>
      </div>
    </div>
  );
}