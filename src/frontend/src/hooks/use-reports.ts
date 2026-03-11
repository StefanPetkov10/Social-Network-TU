import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportService } from "@frontend/services/report-service";
import { ReportPostRequest, ResolveReportRequest } from "@frontend/lib/types/reports";
import { toast } from "sonner";

export const useReportPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, request }: { postId: string; request: ReportPostRequest }) =>
            reportService.reportPost(postId, request),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Успех", { description: "Публикацията беше докладвана успешно." });
                queryClient.invalidateQueries({ queryKey: ["admin-reported-posts"] });
            } else {
                toast.error("Грешка", { description: response.message || "Неуспешно докладване." });
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message?.includes("already") ? "Вече сте докладвали тази публикация." : "Възникна грешка"
            );
        }
    });
};

export const useAdminReportedPosts = () => {
    return useQuery({
        queryKey: ["admin-reported-posts"],
        queryFn: async () => {
            const response = await reportService.getReportedPosts();
            if (!response.success) {
                throw new Error(response.message || "Failed to fetch reports");
            }
            return response.data;
        },
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60,
    });
};

export const useAdminResolveReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ reportId, request }: { reportId: string; request: ResolveReportRequest }) =>
            reportService.resolveReport(reportId, request),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Публикацията е изтрита успешно.");

                queryClient.invalidateQueries({ queryKey: ["admin-reported-posts"] });

                queryClient.invalidateQueries({ queryKey: ["posts"] });
                queryClient.invalidateQueries({ queryKey: ["group-posts"] });
            } else {
                toast.error("Възникна проблем", { description: response.message || "Не успяхме да приложим решението." });
            }
        },
        onError: (error: any) => {
            toast.error("Неуспешно изтриване", {
                description: error?.response?.data?.message || "Сървърът не отговори. Проверете връзката си."
            });
        }
    });
};

export const useAdminDismissReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (reportId: string) => reportService.dismissReport(reportId),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Докладът беше отхвърлен.");
                queryClient.invalidateQueries({ queryKey: ["admin-reported-posts"] });
            } else {
                toast.error("Възникна проблем", { description: response.message || "Не успяхме да отхвърлим доклада." });
            }
        },
        onError: (error: any) => {
            toast.error("Неуспешно отхвърляне", {
                description: error?.response?.data?.message || "Сървърът не отговори. Проверете връзката си."
            });
        }
    });
};