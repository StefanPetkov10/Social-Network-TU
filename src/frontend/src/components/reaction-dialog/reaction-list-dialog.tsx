"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { 
    Loader2, 
    UserPlus, 
    MessageCircle, 
    X, 
    Clock,
    UserCheck
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@frontend/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { REACTION_CONFIG } from "@frontend/components/ui/reaction-button";
import { ReactionType } from "@frontend/lib/types/enums";
import { ReactorDto } from "@frontend/lib/types/reaction";
import { useGetReactors } from "@frontend/hooks/use-reaction";
import { useSendFriendRequest, useCancelFriendRequest, useAcceptFriendRequest, useDeclineFriendRequest } from "@frontend/hooks/use-friends";
import { getInitials, cn } from "@frontend/lib/utils"; 

interface ReactionListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityId: string;
    isComment?: boolean;
}

export function ReactionListDialog({ open, onOpenChange, entityId, isComment = false }: ReactionListDialogProps) {
    const [selectedTab, setSelectedTab] = useState<string>("all");
    
    const typeFilter = selectedTab === "all" ? null : Number(selectedTab) as ReactionType;

    const { 
        data, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading 
    } = useGetReactors(entityId, isComment, typeFilter, open);

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage]);

    const reactors = data?.pages.flatMap(p => p?.reactors || []) || [];
    const rawCounts = data?.pages[0]?.reactionCounts || {};
    const counts: Record<number, number> = {};
    
    Object.entries(rawCounts).forEach(([key, value]) => {
        const typeId = ReactionType[key as keyof typeof ReactionType];
        if (typeof typeId === 'number') {
            counts[typeId] = value as number;
        }
    });

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    const availableTypes = Object.keys(counts)
        .map(Number)
        .filter((type) => type in REACTION_CONFIG && counts[type] > 0) as ReactionType[];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] h-[600px] flex flex-col p-0 gap-0 bg-background overflow-hidden shadow-2xl border-none outline-none rounded-xl">
                <DialogHeader className="px-4 py-3 border-b shrink-0 flex flex-row items-center justify-between bg-background">
                    <DialogTitle className="text-[17px] font-bold text-foreground">Реакции</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col min-h-0 flex-1">
                    <div className="px-2 pt-0 border-b bg-background shrink-0 z-10 w-full">
                        <div className="flex w-full justify-start flex-nowrap gap-0 overflow-x-auto scrollbar-hide h-[56px]">
                            
                            <TabButton 
                                isActive={selectedTab === "all"} 
                                onClick={() => setSelectedTab("all")}
                            >
                                <span className="text-[15px]">Всички</span>
                                <span className="ml-1.5 text-[15px] font-normal opacity-80">{totalCount}</span>
                            </TabButton>
                            
                            {availableTypes.map(type => (
                                <TabButton 
                                    key={type}
                                    isActive={selectedTab === type.toString()}
                                    onClick={() => setSelectedTab(type.toString())}
                                >
                                    <span className="text-xl leading-none filter drop-shadow-sm mr-1.5">
                                        {REACTION_CONFIG[type].icon}
                                    </span>
                                    <span className="text-[15px] font-normal opacity-80">
                                        {counts[type]}
                                    </span>
                                </TabButton>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-background">
                        {isLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
                        ) : reactors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pb-10">
                                <p className="text-sm font-medium">Няма намерени реакции.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {reactors.map((reactor) => (
                                    <ReactorItem key={reactor.profileId} reactor={reactor} />
                                ))}
                                
                                {isFetchingNextPage && (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/>
                                    </div>
                                )}
                                <div ref={ref} className="h-1" />
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TabButton({ 
    children, 
    isActive, 
    onClick 
}: { 
    children: React.ReactNode; 
    isActive: boolean; 
    onClick: () => void; 
}) {
    return (
        <button
            onClick={onClick}
            className={`relative flex-none h-full min-w-[70px] px-4 flex items-center justify-center font-semibold outline-none transition-colors 
                duration-200 border-b-[3px]
                
                ${isActive 
                    ? "border-primary text-primary" 
                    : `
                        border-transparent 
                        text-muted-foreground 
                        
                        hover:text-foreground 
                        hover:bg-muted/20 
                        hover:border-primary/30 
                      `
                }
            `}
        >
            {children}
        </button>
    );
}

function ReactorItem({ reactor }: { reactor: ReactorDto }) {
    const [status, setStatus] = useState<'none' | 'sent' | 'received' | 'friend'>(
        reactor.isFriend ? 'friend' : 
        reactor.hasSentRequest ? 'sent' : 
        reactor.hasReceivedRequest ? 'received' : 'none'
    );
    
    const { mutate: sendRequest, isPending: isSending } = useSendFriendRequest();
    const { mutate: cancelRequest, isPending: isCancelling } = useCancelFriendRequest();
    const { mutate: declineRequest } = useDeclineFriendRequest();
    const { mutate: acceptRequest } = useAcceptFriendRequest();

    const handleAdd = () => {
        sendRequest(reactor.profileId, {
            onSuccess: () => setStatus('sent')
        });
    };

    const handleCancel = () => {
        cancelRequest(reactor.profileId!, {
            onSuccess: () => setStatus('none')
        });
    };

    const handleConfirm = () => {
        acceptRequest(reactor.pendingRequestId!, { 
            onSuccess: () => setStatus('friend') 
        });
    };

    const handleDecline = () => {
        declineRequest(reactor.pendingRequestId!, {
            onSuccess: () => setStatus('none')
        });
    }

    const config = REACTION_CONFIG[reactor.type];
    const reactionIcon = config ? config.icon : "👍"; 
    
    const profileLink = reactor.isMe ? "/profile" : `/${reactor.username}`;
    const initials = getInitials(reactor.fullName);

    return (
        <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors duration-200">
             <div className="flex items-center gap-4">
                <Link href={profileLink} className="relative group">
                    <Avatar className="w-[48px] h-[48px] border border-border cursor-pointer transition-transform duration-200 group-hover:scale-105">
                        <AvatarImage src={reactor.authorAvatar || ""} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-[2px] shadow-sm border flex items-center justify-center w-[20px] h-[20px]">
                        <span className="text-[12px] leading-none select-none">{reactionIcon}</span>
                    </div>
                </Link>
                
                <div className="flex flex-col">
                    <Link href={profileLink} className={`font-semibold text-[15px] hover:underline leading-tight ${reactor.isMe ? 'text-foreground' : 'text-foreground'}`}>
                        {reactor.fullName} {reactor.isMe && <span className="text-muted-foreground font-normal ml-1">(Ти)</span>}
                    </Link>
                    {!reactor.isMe && (
                          <span className="text-[13px] text-muted-foreground mt-0.5">
                            {status === 'friend' ? 'Приятели' : 'Потребител'}
                          </span>
                    )}
                </div>
            </div>

            {!reactor.isMe && (
                <div className="pl-2">
                    {status === 'friend' && (
                        <Button variant="secondary" size="sm" className="h-9 px-4 font-semibold rounded-lg shadow-sm transition-all">
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
                            className="h-9 w-[130px] font-semibold bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive group rounded-lg transition-all border border-border"
                        >
                            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <span className="flex items-center group-hover:hidden">
                                        <Clock className="w-4 h-4 mr-2" /> Изпратено
                                    </span>
                                    <span className="hidden group-hover:flex items-center">
                                        <X className="w-4 h-4 mr-2" /> Откажи
                                    </span>
                                </>
                            )}
                        </Button>
                    )}

                    {status === 'received' && (
                          <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                onClick={handleConfirm}
                                className="h-9 px-5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm"
                            >
                                <UserCheck className="w-4 h-4 mr-2" /> 
                                Потвърди
                            </Button>
                            <Button 
                                variant="ghost"
                                size="sm" 
                                onClick={handleDecline}
                                className="h-9 px-3 font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-lg"
                            >
                                Изтрий
                            </Button>
                          </div>
                    )}

                    {status === 'none' && (
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={handleAdd}
                            disabled={isSending}
                            className="h-9 px-4 font-semibold bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary rounded-lg border border-transparent transition-all"
                        >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <div className="flex items-center">
                                    <UserPlus className="w-5 h-5 mr-2" /> 
                                    Добави
                                </div>
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}