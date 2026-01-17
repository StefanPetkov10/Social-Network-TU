"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  MessageCircle, 
  ShieldCheck, 
  Crown,
  UserCheck,
  Loader2,
  ShieldAlert, 
  Users2,      
  ListFilter,
  UserCircle2,
  Star, 
  AlertCircleIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  X
} from "lucide-react";

import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Badge } from "@frontend/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@frontend/components/ui/dropdown-menu";
import { getInitials } from "@frontend/lib/utils";

import { 
    useGroupMembers, 
    useGroupAdmins, 
    useGroupFriends, 
    useGroupMutualFriends,
    useRemoveMember
} from "@frontend/hooks/use-group-members";
import { useSendFriendRequest } from "@frontend/hooks/use-friends";
import { MemberDto } from "@frontend/lib/types/groups";
// import { GroupRole } from "@frontend/lib/types/enums"; 

interface GroupMembersViewProps {
  groupId: string;
}

export function GroupMembersView({ groupId }: GroupMembersViewProps) {
  
  const [showAllAdmins, setShowAllAdmins] = useState(false);
  const [showAllMutuals, setShowAllMutuals] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: adminsResponse, isLoading: isLoadingAdmins } = useGroupAdmins(groupId);
  const admins = useMemo(() => {
    return (adminsResponse?.data || []).sort((a, b) => a.role - b.role);
  }, [adminsResponse]);

  const { data: friendsResponse, isLoading: isLoadingFriends } = useGroupFriends(groupId);
  const friends = friendsResponse?.data || [];

  const { data: mutualsResponse, isLoading: isLoadingMutuals } = useGroupMutualFriends(groupId);
  const mutuals = mutualsResponse?.data || [];

  const { 
      data: membersData, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage, 
      isLoading: isLoadingAll 
  } = useGroupMembers(groupId);

  const allMembersRaw = useMemo(() => {
      return membersData?.pages.flatMap((page) => page.data ?? []) || [];
  }, [membersData]);

  const { ref, inView } = useInView({ threshold: 0, rootMargin: '100px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);


  const currentUserMember = useMemo(() => {
      return admins.find(m => m.isMe) || 
             friends.find(m => m.isMe) || 
             mutuals.find(m => m.isMe) ||
             allMembersRaw.find(m => m.isMe);
  }, [admins, friends, mutuals, allMembersRaw]);

  const masterList = useMemo(() => {
    return allMembersRaw.filter(m => !m.isMe);
  }, [allMembersRaw]);

  const totalMembersCount = membersData?.pages[0]?.meta?.totalCount ?? 0;
  const visibleAdmins = showAllAdmins ? admins : admins.slice(0, 3);
  const visibleFriends = friends.slice(0, 3);
  const visibleMutuals = showAllMutuals ? mutuals : mutuals.slice(0, 3);

  const isInitialLoading = isLoadingAdmins && isLoadingFriends && isLoadingAll;

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Зареждане на членовете...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 bg-gray-50/50 p-4 md:p-0 rounded-xl">
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-blue-600" />
              Членове
            </h2>
            <p className="text-sm text-gray-500 ml-7">
               {totalMembersCount > 0 ? totalMembersCount : "..."} общо
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="w-4 h-4" /></div>
            <Input 
              placeholder="Търсене на член..." 
              className="pl-9 bg-gray-100 border-transparent focus-visible:ring-blue-500/20 rounded-full h-10 transition-all hover:bg-gray-200/70 focus:bg-white focus:border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

       {currentUserMember && (
         <div className="bg-white rounded-xl shadow-sm border border-blue-100/50 p-1">
          <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2">
            <UserCircle2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Ти (Твоят профил)</span>
          </div>
          <MemberCard member={currentUserMember} groupId={groupId} showBadges={true} />
        </div>
       )}

      {admins.length > 0 && (
        <MemberSection 
          title="Администратори и модератори" 
          icon={<ShieldAlert className="w-5 h-5 text-indigo-500" />}
          count={admins.length}
          action={
            admins.length > 3 ? (
              <Button variant="ghost" size="sm" onClick={() => setShowAllAdmins(!showAllAdmins)} className="text-xs h-7">
                {showAllAdmins ? "Скрий" : "Виж всички"} 
                {showAllAdmins ? <ChevronUp className="w-3 h-3 ml-1"/> : <ChevronDown className="w-3 h-3 ml-1"/>}
              </Button>
            ) : null
          }
        >
          {visibleAdmins.map((member) => (
            <MemberCard 
                key={member.profileId} 
                member={member} 
                groupId={groupId} 
                showBadges={true} 
            />
          ))}
        </MemberSection>
      )}

      {visibleFriends.length > 0 && (
        <MemberSection 
          title="Топ Приятели" 
          icon={<Star className="w-5 h-5 text-blue-400 fill-sky-200" />} 
          subtitle="Хора, с които вече сте свързани"
          count={friends.length} 
        >
          {visibleFriends.map((member) => (
            <MemberCard key={member.profileId} member={member} groupId={groupId} />
          ))}
        </MemberSection>
      )}

      {mutuals.length > 0 && (
        <MemberSection 
          title="С общи приятели"
          icon={<Users2 className="w-5 h-5 text-cyan-600" />}
          count={mutuals.length}
          subtitle="Хора, които може би познавате"
          action={
            mutuals.length > 3 ? (
              <Button variant="ghost" size="sm" onClick={() => setShowAllMutuals(!showAllMutuals)} className="text-xs h-7">
                {showAllMutuals ? "Скрий" : "Виж всички"} 
                {showAllMutuals ? <ChevronUp className="w-3 h-3 ml-1"/> : <ChevronDown className="w-3 h-3 ml-1"/>}
              </Button>
            ) : null
          }
        >
          {visibleMutuals.map((member) => (
            <MemberCard key={member.profileId} member={member} groupId={groupId} />
          ))}
        </MemberSection>
      )}

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-gray-500" />
            Всички членове
          </h3>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {masterList.length > 0 ? (
            masterList.map((member) => (
              <div key={member.profileId} className="p-1 hover:bg-gray-50/80 transition-colors">
                <MemberCard 
                    member={member} 
                    isCompact={true} 
                    groupId={groupId}
                    showBadges={true} 
                />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
                Няма други членове.
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

    </div>
  );
}

function MemberSection({ title, icon, subtitle, count, action, children }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            {icon}
            {title}
            {count !== undefined && count > 0 && (
              <span className="bg-gray-200/60 text-gray-600 text-[11px] px-2 py-0.5 rounded-full font-bold">
                {count}
              </span>
            )}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1 ml-7">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        <div className="flex flex-col p-1">{children}</div>
      </div>
    </div>
  );
}

interface MemberCardProps {
  member: MemberDto;
  isCompact?: boolean;
  groupId: string;
  showBadges?: boolean;
}

function MemberCard({ member, isCompact = false, groupId, showBadges = false }: MemberCardProps) {
  const initials = getInitials(member.fullName);
  const isMe = member.isMe;
  const profileLink = isMe ? "/profile" : `/${member.username}`;

 
  const [isPending, setIsPending] = useState(member.hasPendingRequest || false);

  const { mutate: sendRequest } = useSendFriendRequest();
  const { mutate: removeMember } = useRemoveMember();
  
  const handleAddFriend = () => {
    setIsPending(true);
    sendRequest(member.profileId, {
      onError: () => setIsPending(false)
    });
  };

  let subtitleDetails = null;
  if (member.mutualFriendsCount > 0) {
    subtitleDetails = (
      <span className="flex items-center gap-1 text-gray-500 font-medium">
         <Users2 className="w-3.5 h-3.5" /> {member.mutualFriendsCount} общи приятели
      </span>
    );
  }

  const isOwner = member.role === 0; 
  const isAdmin = member.role === 1;

  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-all duration-200 ${isMe ? 'bg-blue-50/30' : 'hover:bg-gray-50'} group`}>
      
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        <Link href={profileLink} className="relative">
          <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-105">
            <AvatarImage src={member.authorAvatar || ""} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={profileLink} className={`font-bold truncate text-[15px] md:text-base transition-colors ${isMe ? 'text-blue-900' : 'text-gray-900 hover:text-blue-600'}`}>
              {member.fullName}
            </Link>
            
            {showBadges && isOwner && (
               <Badge className="bg-amber-50 text-amber-700 border-amber-100 h-5 px-1.5 shadow-none flex gap-1 items-center pointer-events-none">
                  <Crown className="w-3 h-3" /> Owner
               </Badge>
            )}
            
            {showBadges && isAdmin && (
               <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 h-5 px-1.5 shadow-none flex gap-1 items-center pointer-events-none">
                  <ShieldCheck className="w-3 h-3" /> Admin
               </Badge>
            )}
          </div>
          
          <div className="text-sm text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
            {subtitleDetails}
          </div>
        </div>
      </div>

      {!isMe && (
      <div className="flex items-center gap-2 shrink-0">
        
        {member.isFriend ? (
            <Button 
                variant="secondary" 
                size="sm" 
                className="hidden md:flex bg-blue-100/50 text-blue-600 hover:bg-blue-100 font-semibold shadow-sm border border-blue-200/20"
            >
                <MessageCircle className="w-4 h-4 mr-2" />
                Съобщение
            </Button>
        ) : isPending ? (
            <Button 
                size="sm" 
                disabled 
                className="hidden md:flex bg-gray-100 text-gray-500 border border-gray-200 shadow-none cursor-not-allowed"
            >
                <Clock className="w-4 h-4 mr-2" />
                Изпратено
            </Button>
        ) : (
            <Button 
                size="sm" 
                onClick={handleAddFriend}
                className="hidden md:flex bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-100 shadow-sm font-semibold transition-all"
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Добави
            </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer font-medium" asChild>
               <Link href={profileLink}>
                 <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                 Преглед на профил
               </Link>
            </DropdownMenuItem>
            
            {!member.isFriend && !isPending && (
              <DropdownMenuItem 
                onClick={handleAddFriend}
                className="cursor-pointer font-medium"
              >
                <UserPlus className="w-4 h-4 mr-2 text-gray-500" />
                Изпрати покана
              </DropdownMenuItem>
            )}

            <DropdownMenuItem 
                onClick={() => removeMember({ groupId, profileId: member.profileId })}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 font-medium"
            >
              <AlertCircleIcon className="w-4 h-4 mr-2" />
              Премахни
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}
    </div>
  );
}