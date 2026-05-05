import { ReportReason, MediaType } from './enums';

export interface PostMediaDto {
    id: string;
    url: string;
    mediaType: MediaType;
    fileName: string;
    order: number;
}

export interface ReportedPostDto {
    id: string;
    postId: string;
    postContent: string;
    postAuthorName: string;
    postMedia?: PostMediaDto[];
    reporterId: string;
    reporterName: string;
    reasonType: ReportReason;
    reasonComment: string;
    createdAt: string;
    isResolved: boolean;
    adminComment?: string;
    resolvedByName?: string;
    resolvedAt?: string;
}

export interface ReportPostRequest {
    reasonType: ReportReason;
    reasonComment: string;
}

export interface ResolveReportRequest {
    deletePost: boolean;
    adminComment?: string;
}