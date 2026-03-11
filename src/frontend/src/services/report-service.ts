import api from "../lib/axios";
import { ApiResponse } from "@frontend/lib/types/api";
import { ReportReason } from "@frontend/lib/types/enums";
import {
    ReportedPostDto,
    ReportPostRequest,
    ResolveReportRequest
} from "@frontend/lib/types/reports";
import { resolve } from "path";
import { report } from "process";

export const reportService = {
    reportPost: async (postId: string, reportData: ReportPostRequest) => {
        const { data } = await api.post<ApiResponse<boolean>>(`/api/Reports/posts/${postId}`, reportData);
        return data;
    },

    getReportedPosts: async () => {
        const { data } = await api.get<ApiResponse<ReportedPostDto[]>>(`/api/Reports/posts`);
        return data;
    },

    resolveReport: async (reportId: string, request: ResolveReportRequest) => {
        const { data } = await api.post<ApiResponse<boolean>>(`/api/Reports/${reportId}/resolve`, request);
        return data;
    },

    dismissReport: async (reportId: string) => {
        const { data } = await api.post<ApiResponse<boolean>>(`/api/Reports/${reportId}/dismiss`);
        return data;
    }
};