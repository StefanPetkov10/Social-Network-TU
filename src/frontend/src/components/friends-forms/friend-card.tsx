"use client";

import { UserCheck, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@frontend/components/ui/alert-dialog";
import { getInitials, getUserDisplayName, getUserUsername } from "@frontend/lib/utils";
import { FriendDto } from "@frontend/lib/types/friends";

interface FriendCardProps {
  friend: FriendDto;
  onViewProfile: (friend: FriendDto) => void;
  onRemove: (id: string) => void;
}

export function FriendCard({ friend, onViewProfile, onRemove }: FriendCardProps) {
  const initials = getInitials(friend.displayFullName);
  const displayName = getUserDisplayName(friend);
  const username = getUserUsername(friend);
  const profileId = friend.profileId;

  return (
    <div 
        onClick={() => onViewProfile(friend)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center h-full cursor-pointer group hover:shadow-md transition-all hover:-translate-y-1"
    >
      <Avatar className="h-24 w-24 shadow-sm rounded-full mb-4 border-2 border-gray-50">
        <AvatarImage src={friend.authorAvatar || ""} className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold rounded-none">
            {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col flex-1 w-full">
        <div className="mb-4">
            <h3 className="font-semibold text-gray-900 truncate text-lg group-hover:text-primary transition-colors">
            {displayName}
            </h3>
            {username && (
                <p className="text-sm text-gray-500 truncate">{username}</p>
            )}
             <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                <UserCheck className="w-3 h-3" /> Приятели
            </p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 w-full">
          <Button 
            variant="outline"
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
            onClick={(e) => {
                e.stopPropagation();
                onViewProfile(friend);
            }}
          >
            Преглед
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => e.stopPropagation()}
                >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Изтрий
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Премахване на приятел?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Сигурни ли сте, че искате да премахнете {displayName} от списъка с приятели?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отказ</AlertDialogCancel>
                    <AlertDialogAction 
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(profileId);
                        }}
                    >
                        Премахни
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}