"use client";

import { useQuery } from "@tanstack/react-query";
import { friendsService } from "@frontend/services/friends-service"; 
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { Users } from "lucide-react";
import { getInitials, getUserUsername, getUserDisplayName } from "@frontend/lib/utils";
import Link from "next/link"; 

interface ProfileFriendsCardProps {
  profileId: string;
}

export function ProfileFriendsCard({ profileId }: ProfileFriendsCardProps) {
  // Използваме profileId като част от queryKey, за да се кешира отделно за всеки потребител
  const { data: response, isLoading } = useQuery({
    queryKey: ["profile-friends-widget", profileId],
    queryFn: () => friendsService.getFriendsList(profileId, null, 9), 
    enabled: !!profileId, // Заявката се прави само ако имаме валидно ID
  });

  const friends = response?.data || [];

  if (isLoading) {
    return <FriendsSkeleton />;
  }

  return (
    <div className="bg-background rounded-xl border p-4 shadow-sm h-fit">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="font-bold text-lg leading-none">Приятели</h3>
           {friends.length > 0 && (
             <span className="text-xs text-muted-foreground">{friends.length} (показани)</span>
           )}
        </div>
        {friends.length > 0 && (
            <Link href={`/profile/${profileId}/friends`} className="text-primary text-sm font-semibold hover:underline">
                Виж всички
            </Link>
        )}
      </div>

      {friends.length === 0 ? (
         <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            <Users className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">Няма добавени приятели</p>
         </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
            {friends.map((friend: any) => {
                const name = getUserDisplayName(friend);
                const initials = getInitials(name);
                const authorAvatar = friend.authorAvatar || friend.avatarUrl || friend.photo || "";

                return (
                    <Link 
                        key={friend.userName} 
                        href={`/profile/${friend.userName}`} 
                        className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                        <div className="w-full aspect-square rounded-lg overflow-hidden relative border border-border/50 bg-gray-100">
                            <Avatar className="h-full w-full rounded-none">
                                <AvatarImage 
                                    src={authorAvatar} 
                                    alt={name}
                                    className="object-cover transition-transform group-hover:scale-105 duration-300" 
                                />
                                <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold text-sm flex items-center justify-center h-full w-full">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                        </div>

                        <div className="w-full text-center">
                            <p className="text-xs font-semibold text-foreground/90 truncate w-full px-0.5 group-hover:text-primary transition-colors leading-tight">
                                {name}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
      )}

      {friends.length > 0 && (
        <Link href={`/profile/${profileId}/friends`} className="w-full mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors bg-muted/50 hover:bg-muted text-foreground h-10 px-4 py-2">
            Виж всички
        </Link>
      )}
    </div>
  );
}

function FriendsSkeleton() {
    return (
        <div className="bg-background rounded-xl border p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="aspect-square rounded-lg w-full" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                ))}
            </div>
             <Skeleton className="h-9 w-full rounded-md mt-2" />
        </div>
    )
}