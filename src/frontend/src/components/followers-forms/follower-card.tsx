"use client";

import { UserPlus, UserCheck, MoreHorizontal, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import { getInitials } from "@frontend/lib/utils";
import { FollowUser } from "@frontend/lib/types/followers";

interface FollowerCardProps {
  follower: FollowUser;
  isFollowingBack: boolean; 
  onViewProfile: (follower: FollowUser) => void;
  onFollowBack: (id: string) => void;
  onRemove: (id: string) => void; 
}

export function FollowerCard({ 
  follower, 
  isFollowingBack, 
  onViewProfile, 
  onFollowBack, 
  onRemove 
}: FollowerCardProps) {
  const displayName = follower.displayFullName || "Unknown";
  const initials = getInitials(displayName);
  const username = follower.userName;
  const profileId = follower.profileId;
  const avatarUrl = follower.authorAvatar;

  return (
    <div 
        onClick={() => onViewProfile(follower)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col items-center text-center h-full cursor-pointer group hover:shadow-md transition-all hover:-translate-y-1 relative"
    >
      <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
                onClick={() => onRemove(profileId)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <X className="mr-2 h-4 w-4" /> Премахни последовател
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Avatar className="h-20 w-20 shadow-sm rounded-full mb-3 border-2 border-gray-50 mt-2">
        <AvatarImage src={avatarUrl || ""} className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
            {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col flex-1 w-full">
        <div className="mb-3">
            <h3 className="font-semibold text-gray-900 truncate text-base group-hover:text-primary transition-colors">
                {displayName}
            </h3>
            {username && (
                <p className="text-xs text-gray-500 truncate">@{username}</p>
            )}
        </div>

        <div className="mt-auto w-full space-y-2">
          {isFollowingBack ? (
             <Button 
                variant="outline"
                className="w-full bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 cursor-default"
                onClick={(e) => e.stopPropagation()} 
             >
                <UserCheck className="h-4 w-4 mr-2" />
                Последван
             </Button>
          ) : (
             <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onFollowBack(profileId);
                }}
             >
                <UserPlus className="h-4 w-4 mr-2" />
                Последвай също
             </Button>
          )}
          
          <Button 
            variant="ghost" 
            className="w-full text-xs text-gray-400 hover:text-gray-700 h-8"
            onClick={(e) => {
                e.stopPropagation();
                onViewProfile(follower);
            }}
          >
            Преглед на профил
          </Button>
        </div>
      </div>
    </div>
  );
}