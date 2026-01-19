import { MediaType } from "./enums"; 

export interface CommentMediaDto {
    id: string;
    url: string;
    mediaType: MediaType;
}

export interface CommentDto {
    id: string;
    postId: string;
    profileId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    isDeleted: boolean;
    depth: number;
    createdDate: string;
    repliesCount: number;
    repliesPreview?: CommentDto[];
    media?: CommentMediaDto;
}

export interface CreateCommentPayload {
    content: string;
    parentCommentId?: string;
    file?: File | null;
}