"use client";

import { UserCheck, UserMinus, ArrowRightLeft, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";
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
import { FollowUser } from "@frontend/lib/types/followers";
import { getInitials, getUserDisplayName, getUserUsername } from "@frontend/lib/utils";

interface FollowingCardProps {
  person: FollowUser;
  onViewProfile: (person: FollowUser) => void;
  onUnfollow: (id: string) => void;
}

export function FollowingCard({ person, onViewProfile, onUnfollow }: FollowingCardProps) {
  const initials = getInitials(person.displayFullName || "");
  const displayName = getUserDisplayName(person);
  const username = getUserUsername(person);

  return (
    <div 
        onClick={() => onViewProfile(person)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col items-center text-center h-full cursor-pointer group hover:shadow-md transition-all hover:-translate-y-1 relative"
    >
      <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
         {person.isFriend && (
             <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 text-[10px] px-1.5 py-0 h-5 gap-1">
                 <Users className="w-3 h-3" /> Приятели
             </Badge>
         )}
         {person.isFollower && (
             <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-[10px] px-1.5 py-0 h-5 gap-1">
                 <ArrowRightLeft className="w-3 h-3" /> Следва те
             </Badge>
         )}
      </div>

      <Avatar className="h-20 w-20 shadow-sm rounded-full mb-3 border-2 border-gray-50 mt-4">
        <AvatarImage src={person.authorAvatar || ""} className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-xl font-bold">
            {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col flex-1 w-full">
        <div className="mb-3">
            <h3 className="font-semibold text-gray-900 truncate text-base group-hover:text-primary transition-colors">
                {displayName}
            </h3>
            {username && (
                <p className="text-xs text-gray-500 truncate">{username}</p>
            )}
             {person.bio && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 min-h-[2.5em]">
                    {person.bio}
                </p>
            )}
        </div>

        <div className="mt-auto w-full grid grid-cols-2 gap-2">
           <Button 
            variant="outline" 
            className="w-full text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200"
            onClick={(e) => {
                e.stopPropagation();
                onViewProfile(person);
            }}
          >
            Преглед
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="outline"
                    className="w-full text-xs text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors group/btn"
                    onClick={(e) => e.stopPropagation()}
                >
                    <UserCheck className="h-3 w-3 mr-1 group-hover/btn:hidden" />
                    <UserMinus className="h-3 w-3 mr-1 hidden group-hover/btn:block" />
                    <span className="group-hover/btn:hidden">Следваш</span>
                    <span className="hidden group-hover/btn:inline">Спри</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Спиране на следването?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ако спрете да следвате <strong>{displayName}</strong>, неговите публикации вече няма да се появяват във вашия фийд.
                        {person.isFriend && " Вие ще останете приятели."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отказ</AlertDialogCancel>
                    <AlertDialogAction 
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUnfollow(person.profileId);
                        }}
                    >
                        Спри следването
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}