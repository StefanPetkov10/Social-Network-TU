import { ReactionType } from "./enums";

export interface ReactorDto {
    profileId: string;
    username: string;
    fullName: string;
    authorAvatar?: string;
    type: ReactionType;
    reactedDate: string;
    isMe: boolean;
    isFriend: boolean;
    hasSentRequest: boolean;     
    hasReceivedRequest: boolean;
    pendingRequestId?: string;
}

export interface ReactorListResponse {
    reactors: ReactorDto[];
    reactionCounts: Record<string, number>; 
}