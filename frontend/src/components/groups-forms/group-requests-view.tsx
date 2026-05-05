"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";
import { 
  Check, 
  X, 
  User, 
  Clock, 
  ShieldAlert,
  Loader2
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Card } from "@frontend/components/ui/card";
import { getInitials } from "@frontend/lib/utils";
import { MemberDto } from "@frontend/lib/types/groups";
import { useApproveMember, useRejectMember } from "@frontend/hooks/use-group-members";

interface GroupRequestsViewProps {
    groupId: string;
    requests: MemberDto[];
}

export function GroupRequestsView({ groupId, requests }: GroupRequestsViewProps) {
    const { mutate: approve, isPending: isApproving } = useApproveMember();
    const { mutate: reject, isPending: isRejecting } = useRejectMember();

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-green-50 p-4 rounded-full mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Всичко е чисто</h3>
                <p className="text-gray-500 mt-1">Няма чакащи заявки за присъединяване в момента.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-blue-600" />
                    Чакащи одобрение
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full ml-2">
                        {requests.length}
                    </span>
                </h3>
            </div>

            <div className="grid gap-4">
                {requests.map((req) => (
                    <RequestCard 
                        key={req.profileId} 
                        request={req} 
                        groupId={groupId}
                        onApprove={() => approve({ groupId, profileId: req.profileId })}
                        onReject={() => reject({ groupId, profileId: req.profileId })}
                        isProcessing={isApproving || isRejecting}
                    />
                ))}
            </div>
        </div>
    );
}

function RequestCard({ request, groupId, onApprove, onReject, isProcessing }: any) {
    const initials = getInitials(request.fullName);
    // Format date: "преди 2 часа"
    const requestedTime = request.joinedOn // В API-то ползваме joinedOn или RequestedOn поле
        ? formatDistanceToNow(new Date(request.joinedOn), { addSuffix: true, locale: bg })
        : "наскоро";

    return (
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200">
            
            {/* User Info */}
            <div className="flex items-center gap-4">
                <Link href={`/${request.username}`}>
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                        <AvatarImage src={request.photo} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                
                <div>
                    <Link href={`/${request.username}`} className="font-bold text-gray-900 hover:text-blue-600 text-lg transition-colors">
                        {request.fullName}
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> @{request.username}
                        </span>
                        <span className="hidden sm:inline text-gray-300">•</span>
                        <span className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> {requestedTime}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    onClick={onReject}
                    disabled={isProcessing}
                >
                    <X className="w-4 h-4 mr-2" />
                    Отхвърли
                </Button>
                <Button 
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                    onClick={onApprove}
                    disabled={isProcessing}
                >
                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Одобри
                </Button>
            </div>
        </Card>
    );
}