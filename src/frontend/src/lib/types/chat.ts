import { MediaType } from "./enums";
import { ReactionType } from "./enums";

export interface MessageMediaDto {
    id: string;
    url: string; 
    fileName: string;
    mediaType: MediaType;
    order: number;
}

export interface MessageDto {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    receiverId: string;
    groupId?: string;
    sentAt: string; 
    isEdited: boolean;
    isDeleted: boolean;
    media: MessageMediaDto[];
    reactions: MessageReactionDto[];
}

export interface ChatAttachmentDto {
    filePath: string;
    fileName: string;
    mediaType: MediaType;
}

export interface ChatConversationDto {
    id: string;
    name: string;
    authorAvatar: string; 
    lastMessage: string;
    lastMessageTime: string;
    isGroup: boolean;
    unreadCount: number;
}

export interface MessageReactionDto {
    profileId: string;
    reactorName: string;
    reactorAvatar?: string;
    type: ReactionType | null;  
}