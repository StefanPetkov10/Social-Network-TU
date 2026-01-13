"use client";

import Link from "next/link";
import { Users, Lock, Globe, Sparkles, UserPlus } from "lucide-react";
import { GroupDto } from "@frontend/lib/types/groups";
import { Card, CardContent, CardFooter } from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { getInitials } from "@frontend/lib/utils";
import { useJoinGroup } from "@frontend/hooks/use-group-members";

interface DiscoverGroupCardProps {
  group: GroupDto;
  isTopResult?: boolean;
}

export function DiscoverGroupCard({ group, isTopResult = false }: DiscoverGroupCardProps) {
  const { mutate: joinGroup, isPending } = useJoinGroup();
  
  const memberLabel = group.membersCount === 1 ? "член" : "членове";
  const hasMutuals = group.mutualFriendsCount && group.mutualFriendsCount > 0;
  
  const friends = group.mutualFriends || [];

  const privacyIcon = group.isPrivate ? <Lock className="w-3 h-3 text-gray-500" /> : <Globe className="w-3 h-3 text-blue-500" />;
  const privacyLabel = group.isPrivate ? "Частна" : "Публична";

  const handleJoin = () => {
      joinGroup(group.id);
  };

  return (
    <Card className={`transition-all duration-300 flex flex-col h-full group relative overflow-visible bg-white ${
        isTopResult 
        ? "border-blue-200 shadow-md ring-1 ring-blue-50" 
        : "border-gray-200 hover:shadow-md"
    }`}>
      
      {isTopResult && hasMutuals && (
         <div className="absolute -top-3 right-4 z-10">
            <Badge className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-0 shadow-md px-3 py-1 gap-1.5 hover:from-indigo-600 hover:to-cyan-600 transition-all">
                <Sparkles className="w-3.5 h-3.5 text-white fill-current" /> 
                <span className="tracking-wide font-bold text-[11px] uppercase">Препоръчана</span>
            </Badge>
         </div>
      )}

      <CardContent className="pt-7 flex-1">
        
        <div className="flex justify-between items-start mb-4">
            <Link href={`/groups/${group.name}`}>
                <div className="relative group-hover:scale-105 transition-transform duration-300 ease-out cursor-pointer">
                    <div className="h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm bg-gradient-to-br from-blue-500 to-purple-600">
                        {getInitials(group.name)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                        <div className={group.isPrivate ? "bg-gray-100 p-1 rounded-full" : "bg-blue-50 p-1 rounded-full"}>
                            {privacyIcon}
                        </div>
                    </div>
                </div>
            </Link>

            <div className={`flex flex-col items-end gap-1 ${isTopResult && hasMutuals ? 'mt-6' : 'mt-1'}`}>
                <Badge variant="secondary" className="bg-gray-50 text-gray-500 border-0 font-normal text-xs px-2">
                    {group.isPrivate ? "Частна" : "Публична"}
                </Badge>
            </div>
        </div>

        <div className="space-y-3">
          <Link href={`/groups/${group.name}`} className="block">
            <h3 className="font-bold text-lg leading-tight text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors" title={group.name}>
                {group.name}
            </h3>
          </Link>
          
          {hasMutuals ? (
              <div className={`flex items-center gap-3 p-2 rounded-xl border ${
                  isTopResult 
                  ? "bg-blue-50/50 border-blue-100" 
                  : "bg-gray-50/50 border-gray-100"
              }`}>
                  <div className="flex -space-x-3 overflow-hidden shrink-0 pl-1">
                      {friends.length > 0 ? (
                          friends.map((friend, i) => (
                            <Avatar key={i} className="h-7 w-7 border-2 border-white ring-1 ring-gray-100">
                                <AvatarImage src={friend.authorAvatar || ""} className="object-cover" />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-[9px] font-bold">
                                    {getInitials(friend.fullName)}
                                </AvatarFallback>
                            </Avatar>
                          ))
                      ) : (
                          [1, 2, 3].slice(0, Math.min(3, group.mutualFriendsCount!)).map(i => (
                             <div key={i} className="h-7 w-7 rounded-full bg-blue-200 border-2 border-white" />
                          ))
                      )}
                  </div>
                  <span className={`text-xs font-semibold ${isTopResult ? "text-blue-700" : "text-gray-600"}`}>
                      {group.mutualFriendsCount} общи приятели
                  </span>
              </div>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2 h-[38px] leading-relaxed">
                {group.description || "Няма описание за тази група."}
            </p>
          )}

          <div className="flex items-center text-xs text-gray-400 font-medium pt-1">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            <span>{group.membersCount} {memberLabel}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-5 px-6 border-t border-gray-50 bg-gray-50/30">
         <Button 
            className="w-full font-semibold bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all shadow-sm h-10"
            variant="outline"
            onClick={handleJoin}
            disabled={isPending || group.hasRequestedJoin || group.isMember}
         >
            {group.hasRequestedJoin ? (
                "Заявено"
            ) : group.isMember ? (
                "Вие сте член"
            ) : (
                <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Присъедини се
                </>
            )}
         </Button>
      </CardFooter>
    </Card>
  );
}