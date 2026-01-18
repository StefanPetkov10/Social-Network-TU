"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { 
  Search, 
  MoreHorizontal, 
  UserCheck,
  Loader2,
  Users2,      
  ListFilter,
  MessageCircle,
  AlertCircleIcon 
} from "lucide-react";

import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@frontend/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@frontend/components/ui/alert-dialog";

import { getInitials, getUserDisplayName, getUserUsername, cn } from "@frontend/lib/utils";
import { useInfiniteFriends, useRemoveFriend } from "@frontend/hooks/use-friends";
import { useProfile } from "@frontend/hooks/use-profile";
import { FriendDto } from "@frontend/lib/types/friends";
import { toast } from "sonner";

interface FriendsListViewProps {
  profileId: string;
}

export function FriendsListView({ profileId }: FriendsListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [friendToRemove, setFriendToRemove] = useState<FriendDto | null>(null);
  
  const { data: currentUserProfile } = useProfile();
  const isMyProfile = currentUserProfile?.id === profileId;

  const { 
      data: friendsListRaw, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage, 
      isLoading 
  } = useInfiniteFriends(profileId);

  const { mutate: removeFriend, isPending: isRemoving } = useRemoveFriend();

  const allFriends = useMemo(() => {
      const list = friendsListRaw as unknown as FriendDto[];
      return list?.filter((f): f is FriendDto => !!f) || [];
  }, [friendsListRaw]);

  const filteredFriends = useMemo(() => {
      if (!searchTerm) return allFriends;
      const lowerTerm = searchTerm.toLowerCase();
      
      return allFriends.filter((f) => {
          const name = getUserDisplayName(f).toLowerCase();
          const username = getUserUsername(f).toLowerCase();
          return name.includes(lowerTerm) || username.includes(lowerTerm);
      });
  }, [allFriends, searchTerm]);

  const { ref, inView } = useInView({ threshold: 0, rootMargin: '100px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const confirmRemoveFriend = () => {
      if (friendToRemove) {
          removeFriend(friendToRemove.profileId, {
              onSuccess: () => {
                  setFriendToRemove(null); 
              },
              onError: () => {
                 setFriendToRemove(null); 
              }
          });
      }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Зареждане на приятели...</p>
      </div>
    );
  }

  const totalCount = allFriends.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 bg-gray-50/50 p-4 md:p-0 rounded-xl">
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-blue-600" />
              Приятели
            </h2>
            <p className="text-sm text-gray-500 ml-7">
               {totalCount} общо
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="w-4 h-4" /></div>
            <Input 
              placeholder="Търсене..." 
              className="pl-9 bg-gray-100 border-transparent focus-visible:ring-blue-500/20 rounded-full h-10 transition-all hover:bg-gray-200/70 focus:bg-white focus:border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-gray-500" />
            Всички приятели
          </h3>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div key={friend.profileId || friend.username} className="p-1 hover:bg-gray-50/80 transition-colors">
                <FriendCard 
                    friend={friend} 
                    isMyProfile={isMyProfile}
                    onRemoveClick={() => setFriendToRemove(friend)}
                />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
                {searchTerm ? "Няма намерени резултати." : "Списъкът е празен."}
            </div>
          )}
        </div>

        {hasNextPage && (
            <div ref={ref} className="py-6 flex flex-col items-center justify-center text-gray-400 gap-2">
            {isFetchingNextPage ? (
                <>
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-sm font-medium">Зареждане на още...</span>
                </>
            ) : (
                <span className="text-sm">Скролнете за още</span>
            )}
            </div>
        )}
      </div>

      <AlertDialog open={!!friendToRemove} onOpenChange={(open) => !open && setFriendToRemove(null)}>
        <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">Премахване на приятел?</AlertDialogTitle>
                <AlertDialogDescription className="text-base text-gray-600">
                    Сигурни ли сте, че искате да премахнете <span className="font-semibold text-gray-900">{friendToRemove ? getUserDisplayName(friendToRemove) : "потребителя"}</span> от приятели?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-xl font-medium border-gray-200 hover:bg-gray-50 hover:text-gray-900">
                    Отказ
                </AlertDialogCancel>
                <AlertDialogAction
                    className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200"
                    onClick={confirmRemoveFriend}
                    disabled={isRemoving}
                >
                    {isRemoving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Премахни
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

interface FriendCardProps {
  friend: FriendDto; 
  isMyProfile: boolean;
  onRemoveClick: () => void;
}

function FriendCard({ friend, isMyProfile, onRemoveClick }: FriendCardProps) {
  const friendId = friend.profileId; 
  
  const displayName = getUserDisplayName(friend);
  const displayUsername = getUserUsername(friend);
  const initials = getInitials(displayName);
  const avatarUrl = friend.authorAvatar || friend.authorAvatar || ""; 
  
  const profileLink = displayUsername ? `/${displayUsername.replace('@', '')}` : `/${friendId}`;
  
  return (
    <div className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-lg transition-all duration-200 group",
        "hover:bg-gray-50"
    )}>
      
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        <Link href={profileLink} className="relative">
          <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-105">
            <AvatarImage src={avatarUrl} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex flex-col min-w-0">
          <Link href={profileLink} className="font-bold truncate text-[15px] md:text-base text-gray-900 hover:text-blue-600 transition-colors">
              {displayName}
          </Link>
          
          <div className="text-sm text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
             <span className="text-xs">{displayUsername}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        
        <Button 
            variant="secondary" 
            size="sm" 
            className={cn(
                "hidden md:flex bg-blue-50 text-blue-600",
                "hover:bg-blue-100 border border-blue-100 shadow-sm font-semibold transition-all"
            )}
            onClick={() => {
                toast.info("Функционалността за чат предстои скоро!");
            }}
        >
            <MessageCircle className="w-4 h-4 mr-2" />
            Съобщение
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            
            <DropdownMenuItem className="cursor-pointer font-medium" asChild>
               <Link href={profileLink}>
                 <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                 Преглед на профил
               </Link>
            </DropdownMenuItem>

            <DropdownMenuItem 
                className="md:hidden cursor-pointer font-medium"
                onClick={() => toast.info("Чатът предстои скоро!")}
            >
                <MessageCircle className="w-4 h-4 mr-2 text-gray-500" />
                Съобщение
            </DropdownMenuItem>
            
            {isMyProfile && (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={onRemoveClick}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 font-medium"
                    >
                        <AlertCircleIcon className="w-4 h-4 mr-2" />
                        Премахни
                    </DropdownMenuItem>
                </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}