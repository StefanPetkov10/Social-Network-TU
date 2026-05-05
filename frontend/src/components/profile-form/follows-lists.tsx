"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { Search, Loader2 } from "lucide-react";

import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@frontend/components/ui/dialog";

import { getInitials, getUserDisplayName, getUserUsername, cn } from "@frontend/lib/utils";
import { 
    useInfiniteFollowers, 
    useInfiniteFollowing, 
    useUnfollowUser, 
    useRemoveFollower,
    useFollowUser 
} from "@frontend/hooks/use-followers";
import { useProfile } from "@frontend/hooks/use-profile";
import { FollowUser } from "@frontend/lib/types/followers";

interface FollowersListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profileId: string;
    isMyProfile: boolean;
}

export function FollowersListDialog({ open, onOpenChange, profileId, isMyProfile }: FollowersListDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    
    const { data: currentUser } = useProfile();

    const { 
        data: followersListRaw, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading 
    } = useInfiniteFollowers(profileId);

    const { mutate: removeFollower, isPending: isRemoving } = useRemoveFollower();
    const { mutate: followUser, isPending: isFollowingRequest } = useFollowUser();
    const { mutate: unfollowUser, isPending: isUnfollowing } = useUnfollowUser();

    const followers = useMemo(() => {
        const list = followersListRaw as unknown as FollowUser[];
        return list?.filter((f): f is FollowUser => !!f) || [];
    }, [followersListRaw]);

    const { ref, inView } = useInView();
    useEffect(() => {
        if (inView && hasNextPage) fetchNextPage();
    }, [inView, hasNextPage, fetchNextPage]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md h-[70vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
                <DialogHeader className="p-3 border-b flex flex-row items-center justify-center space-y-0 relative min-h-[50px]">
                    <DialogTitle className="text-base font-bold text-center">Последователи</DialogTitle>
                </DialogHeader>

                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Търсене" 
                            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background h-9 text-sm rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                    ) : followers.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 text-sm">
                            {isMyProfile ? "Все още нямате последователи." : "Този потребител няма последователи."}
                        </div>
                    ) : (
                        followers.map((follower: FollowUser) => {
                            const isUserMe = currentUser?.id === follower.profileId;
                            const profileLink = isUserMe ? "/profile" : `/${follower.username}`;

                            return (
                                <div key={follower.profileId} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 rounded-lg transition-colors">
                                    <Link 
                                        href={profileLink} 
                                        className="flex items-center gap-3 overflow-hidden flex-1 group" 
                                        onClick={() => onOpenChange(false)}
                                    >
                                        <Avatar className="h-12 w-12 border border-border/10 shrink-0">
                                            <AvatarImage src={follower.authorAvatar || ""} />
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-sm font-bold">
                                                {getInitials(getUserDisplayName(follower))}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-sm truncate leading-tight group-hover:underline decoration-1 underline-offset-2">
                                                {getUserUsername(follower).replace('@', '')}
                                            </span>
                                            <span className="text-muted-foreground text-sm truncate mt-0.5">
                                                {getUserDisplayName(follower)}
                                            </span>
                                        </div>
                                    </Link>
                                    
                                    {!isUserMe && (
                                        isMyProfile ? (
                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                className="bg-gray-100 hover:bg-gray-200 text-foreground font-semibold px-4 h-8 text-xs rounded-lg"
                                                onClick={() => removeFollower(follower.profileId)}
                                                disabled={isRemoving}
                                            >
                                                Премахни
                                            </Button>
                                        ) : (
                                            follower.isFollowing ? (
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    className={cn(
                                                        "bg-gray-100 text-foreground font-semibold px-4 h-8 text-xs rounded-lg border border-transparent transition-all min-w-[100px]",
                                                        "hover:bg-red-50 hover:text-red-600 hover:border-red-200 group/btn" 
                                                    )}
                                                    onClick={() => unfollowUser(follower.profileId)}
                                                    disabled={isUnfollowing}
                                                >
                                                    <span className="group-hover/btn:hidden">Последвано</span>
                                                    <span className="hidden group-hover/btn:inline">Премахни</span>
                                                </Button>
                                            ) : (
                                                <Button 
                                                    size="sm"
                                                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 h-8 text-xs rounded-lg min-w-[100px]"
                                                    onClick={() => followUser(follower.profileId)}
                                                    disabled={isFollowingRequest}
                                                >
                                                    Последвай
                                                </Button>
                                            )
                                        )
                                    )}
                                </div>
                            );
                        })
                    )}
                    
                    {isFetchingNextPage && <div className="flex justify-center py-2"><Loader2 className="animate-spin h-4 w-4 text-muted-foreground" /></div>}
                    <div ref={ref} className="h-2" />
                </div>
            </DialogContent>
        </Dialog>
    );
}


interface FollowingListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profileId: string;
    isMyProfile: boolean;
}

export function FollowingListDialog({ open, onOpenChange, profileId, isMyProfile }: FollowingListDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: currentUser } = useProfile();

    const { 
        data: followingListRaw, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading 
    } = useInfiniteFollowing(profileId);

    const { mutate: followUser, isPending: isFollowingRequest } = useFollowUser();
    const { mutate: unfollowUser, isPending: isUnfollowing } = useUnfollowUser();

    const following = useMemo(() => {
        const list = followingListRaw as unknown as FollowUser[];
        return list?.filter((f): f is FollowUser => !!f) || [];
    }, [followingListRaw]);

    const { ref, inView } = useInView();
    useEffect(() => {
        if (inView && hasNextPage) fetchNextPage();
    }, [inView, hasNextPage, fetchNextPage]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md h-[70vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
                <DialogHeader className="p-3 border-b flex flex-row items-center justify-center space-y-0 relative min-h-[50px]">
                    <DialogTitle className="text-base font-bold text-center">Последвани</DialogTitle>
                </DialogHeader>

                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Търсене" 
                            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background h-9 text-sm rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                    ) : following.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 text-sm">
                            {isMyProfile ? "Все още не следвате никого." : "Този потребител не следва никого."}
                        </div>
                    ) : (
                        following.map((person: FollowUser) => {
                            const isUserMe = currentUser?.id === person.profileId;
                            const profileLink = isUserMe ? "/profile" : `/${person.username}`;

                            return (
                                <div key={person.profileId} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 rounded-lg transition-colors">
                                    <Link 
                                        href={profileLink} 
                                        className="flex items-center gap-3 overflow-hidden flex-1 group" 
                                        onClick={() => onOpenChange(false)}
                                    >
                                        <Avatar className="h-12 w-12 border border-border/10 shrink-0">
                                            <AvatarImage src={person.authorAvatar || ""} />
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-sm font-bold">
                                                {getInitials(getUserDisplayName(person))}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-sm truncate leading-tight group-hover:underline decoration-1 underline-offset-2">
                                                {getUserUsername(person).replace('@', '')}
                                            </span>
                                            <span className="text-muted-foreground text-sm truncate mt-0.5">
                                                {getUserDisplayName(person)}
                                            </span>
                                        </div>
                                    </Link>
                                    
                                    {!isUserMe && (
                                        (isMyProfile || person.isFollowing) ? (
                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                className={cn(
                                                    "bg-gray-100 text-foreground font-semibold px-4 h-8 text-xs rounded-lg border border-transparent transition-all min-w-[100px]",
                                                    "hover:bg-red-50 hover:text-red-600 hover:border-red-200 group/btn" 
                                                )}
                                                onClick={() => unfollowUser(person.profileId)}
                                                disabled={isUnfollowing}
                                            >
                                                <span className="group-hover/btn:hidden">Последвано</span>
                                                <span className="hidden group-hover/btn:inline">Премахни</span>
                                            </Button>
                                        ) : (
                                            <Button 
                                                size="sm"
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 h-8 text-xs rounded-lg min-w-[100px]"
                                                onClick={() => followUser(person.profileId)}
                                                disabled={isFollowingRequest}
                                            >
                                                Последвай
                                            </Button>
                                        )
                                    )}
                                </div>
                            );
                        })
                    )}
                    
                    {isFetchingNextPage && <div className="flex justify-center py-2"><Loader2 className="animate-spin h-4 w-4 text-muted-foreground" /></div>}
                    <div ref={ref} className="h-2" />
                </div>
            </DialogContent>
        </Dialog>
    );
}