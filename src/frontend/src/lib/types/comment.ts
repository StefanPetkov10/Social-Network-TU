import { MediaType } from "./enums"; 

export interface CommentMediaDto {
    id: string;
    url: string;
    fileName: string;
    mediaType: MediaType;
}

export interface CommentDto {
    id: string;
    postId: string;
    profileId: string;
    authorName: string;
    authorAvatar: string | null;
    authorUsername: string;
    content: string;
    isDeleted: boolean;
    depth: number;
    parentCommentId?: string | null;
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

export interface UpdateCommentPayload {
    content: string;
    file?: File | null;
}
