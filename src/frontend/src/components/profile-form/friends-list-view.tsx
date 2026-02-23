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
  AlertCircleIcon,
  UserPlus,
  Clock,
  X
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

import { getInitials, cn } from "@frontend/lib/utils";
import { 
    useInfiniteFriends, 
    useRemoveFriend, 
    useSendFriendRequest, 
    useCancelFriendRequest, 
    useAcceptFriendRequest, 
    useDeclineFriendRequest,
    useSearchFriends 
} from "@frontend/hooks/use-friends";
import { useDebounce } from "@frontend/hooks/use-debounce";
import { useProfile } from "@frontend/hooks/use-profile";
import { FriendDto } from "@frontend/lib/types/friends";
import { toast } from "sonner";

interface FriendsListViewProps {
  profileId: string;
}

export function FriendsListView({ profileId }: FriendsListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const [friendToRemove, setFriendToRemove] = useState<FriendDto | null>(null);
  
  const { data: currentUserProfile } = useProfile();
  const isViewingMyProfile = currentUserProfile?.id === profileId;

  const { 
      data, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage, 
      isLoading 
  } = useInfiniteFriends(profileId);

  const { 
      data: searchResults, 
      isFetching: isSearching 
  } = useSearchFriends(profileId, debouncedSearch);

  const { mutate: removeFriend, isPending: isRemoving } = useRemoveFriend();

  const allFriends = useMemo(() => {
      if (!data || !data.pages) return [];
      
      return data.pages.flatMap((page: any) => {
          return page.data || page.friends || page || [];
      }) as FriendDto[];
  }, [data]);

  const totalCount = useMemo(() => {
      if (!data || !data.pages || data.pages.length === 0) return 0;
      
      const firstPage = data.pages[0] as any;
      return firstPage.meta?.totalCount ?? firstPage.totalCount ?? firstPage.total ?? allFriends.length;
  }, [data, allFriends.length]);

  const displayFriends = useMemo(() => {
      if (debouncedSearch.length > 0 && searchResults?.data) {
          return searchResults.data;
      }
      return allFriends;
  }, [allFriends, searchResults, debouncedSearch]);

  const { ref, inView } = useInView({ threshold: 0, rootMargin: '100px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !debouncedSearch) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, debouncedSearch]);

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">Зареждане на приятели...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 bg-gray-50/50 p-4 md:p-0 rounded-xl">

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-primary" />
              Приятели
            </h2>
            <p className="text-sm text-gray-500 ml-7">
               {totalCount} общо
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
            </div>
            <Input 
              placeholder="Търсене..." 
              className="pl-9 bg-gray-100 border-transparent focus-visible:ring-primary/20 rounded-full h-10 transition-all hover:bg-gray-200/70 focus:bg-white focus:border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
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
          {displayFriends.length > 0 ? (
            displayFriends.map((friend) => (
              <div key={friend.profileId || friend.username} className="p-1 hover:bg-gray-50/80 transition-colors">
                <FriendCard 
                    friend={friend} 
                    isViewingMyProfile={isViewingMyProfile}
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

        {hasNextPage && !debouncedSearch && (
            <div ref={ref} className="py-6 flex flex-col items-center justify-center text-gray-400 gap-2">
            {isFetchingNextPage ? (
                <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                    Сигурни ли сте, че искате да премахнете <span className="font-semibold text-gray-900">{friendToRemove?.displayFullName || "потребителя"}</span> от приятели?
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
  isViewingMyProfile: boolean; 
  onRemoveClick: () => void;
}

function FriendCard({ friend, isViewingMyProfile, onRemoveClick }: FriendCardProps) {
  const friendId = friend.profileId; 
  
  const displayName = friend.displayFullName || "Unknown";
  const displayUsername = friend.username ? `@${friend.username}` : "";
  const initials = getInitials(displayName);
  const avatarUrl = friend.authorAvatar || ""; 
  
  const profileLink = friend.username ? `/${friend.username}` : `/${friendId}`;
  
  const [status, setStatus] = useState<'none' | 'sent' | 'received' | 'friend'>(
        friend.isFriend ? 'friend' : 
        friend.hasSentRequest ? 'sent' : 
        friend.hasReceivedRequest ? 'received' : 'none'
  );

  useEffect(() => {
    setStatus(
        friend.isFriend ? 'friend' : 
        friend.hasSentRequest ? 'sent' : 
        friend.hasReceivedRequest ? 'received' : 'none'
    );
  }, [friend.isFriend, friend.hasSentRequest, friend.hasReceivedRequest]);

  const { mutate: sendRequest, isPending: isSending } = useSendFriendRequest();
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelFriendRequest();
  const { mutate: acceptRequest, isPending: isAccepting } = useAcceptFriendRequest();
  const { mutate: declineRequest } = useDeclineFriendRequest();

  const handleAddFriend = () => {
    sendRequest(friendId, { onSuccess: () => setStatus('sent') });
  };

  const handleCancel = () => {
    cancelRequest(friendId, { onSuccess: () => setStatus('none') });
  };

  const handleConfirm = () => {
      if (friend.pendingRequestId) {
          acceptRequest(friend.pendingRequestId, { onSuccess: () => setStatus('friend') });
      }
  };

  const handleDecline = () => {
      if (friend.pendingRequestId) {
          declineRequest(friend.pendingRequestId, { onSuccess: () => setStatus('none') });
      }
  };

  return (
    <div className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-lg transition-all duration-200 group",
        friend.isMe 
            ? "bg-gray-50 border border-primary/10 hover:bg-gray-100" 
            : "hover:bg-gray-50"
    )}>
      
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        <Link href={profileLink} className="relative">
          <Avatar className={cn(
              "h-12 w-12 md:h-14 md:w-14 border-2 shadow-sm cursor-pointer transition-transform hover:scale-105",
              friend.isMe ? "border-primary/20" : "border-white"
          )}>
            <AvatarImage src={avatarUrl} className="object-cover" />
            <AvatarFallback className={cn(
                "font-bold text-lg",
                friend.isMe ? "bg-primary text-white" : "bg-gradient-to-br from-primary/80 to-primary text-white"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex flex-col min-w-0">
          <Link href={profileLink} className={cn(
              "font-bold truncate text-[15px] md:text-base transition-colors text-gray-900 hover:text-primary"
          )}>
              {displayName} {friend.isMe && "(Ти)"}
          </Link>
          
          <div className="text-sm text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
             {friend.mutualFriendsCount > 0 && !isViewingMyProfile && !friend.isMe && (
                <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                    <Users2 className="w-3 h-3" /> {friend.mutualFriendsCount} общи
                </span>
             )}
             {(friend.mutualFriendsCount === 0 || isViewingMyProfile || friend.isMe) && (
                 <span className="text-xs">{displayUsername}</span>
             )}
          </div>
        </div>
      </div>

      {!friend.isMe && (
        <div className="flex items-center gap-2 shrink-0">
            
            {status === 'friend' && (
                <Button 
                    variant="secondary" 
                    size="sm" 
                    className={cn(
                        "hidden md:flex bg-primary/5 text-primary",
                        "hover:bg-primary/10 border border-primary/10 shadow-sm font-semibold transition-all"
                    )}
                    onClick={() => toast.info("Чатът предстои скоро!")}
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Съобщение
                </Button>
            )}

            {status === 'sent' && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="hidden md:flex group/pending bg-gray-100 text-gray-500 border border-gray-200 shadow-none hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-medium w-[125px] justify-center"
                >
                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                            <span className="flex items-center group-hover/pending:hidden">
                                <Clock className="w-4 h-4 mr-2" /> Изпратено
                            </span>
                            <span className="hidden group-hover/pending:flex items-center">
                                <X className="w-4 h-4 mr-2" /> Откажи
                            </span>
                        </>
                    )}
                </Button>
            )}

            {status === 'received' && (
                <Button 
                    size="sm" 
                    onClick={handleConfirm}
                    disabled={isAccepting}
                    className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
                >
                    {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><UserCheck className="w-4 h-4 mr-2" /> Потвърди</>
                    )}
                </Button>
            )}

            {status === 'none' && (
                <Button 
                    size="sm" 
                    onClick={handleAddFriend}
                    disabled={isSending}
                    className="hidden md:flex bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/10 shadow-sm font-semibold transition-all"
                >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><UserPlus className="w-4 h-4 mr-2" /> Добави</>
                    )}
                </Button>
            )}

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
                
                {status === 'sent' && (
                    <DropdownMenuItem onClick={handleCancel} className="cursor-pointer text-red-600 font-medium md:hidden">
                        <X className="w-4 h-4 mr-2" /> Отмени поканата
                    </DropdownMenuItem>
                )}
                
                {status === 'received' && (
                    <>
                        <DropdownMenuItem onClick={handleConfirm} className="cursor-pointer text-green-600 font-medium md:hidden">
                            <UserCheck className="w-4 h-4 mr-2" /> Потвърди
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDecline} className="cursor-pointer font-medium md:hidden">
                            <X className="w-4 h-4 mr-2" /> Отхвърли
                        </DropdownMenuItem>
                    </>
                )}

                {status === 'none' && (
                    <DropdownMenuItem onClick={handleAddFriend} className="cursor-pointer font-medium md:hidden">
                        <UserPlus className="w-4 h-4 mr-2" /> Изпрати покана
                    </DropdownMenuItem>
                )}

                {isViewingMyProfile && status === 'friend' && (
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
      )}
    </div>
  );
}