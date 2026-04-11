"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";
import { useProfile } from "@frontend/hooks/use-profile";
import { useAdminReportedPosts, useAdminResolveReport, useAdminDismissReport } from "@frontend/hooks/use-reports";
import { Loader2, CheckCircle, Trash2, XCircle, ShieldAlert, Clock, ArrowDownAZ, ArrowUpZA, FileText, ImageIcon } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";
import { cn, getUserDisplayName } from "@frontend/lib/utils";
import { MediaType } from "@frontend/lib/types/enums";
import { ReportDeleteDialog } from "@frontend/components/post-forms/report-delete-dialog";

const reasonMap: Record<number, { label: string; color: string }> = {
    1: { label: "Спам / Подвеждащо", color: "bg-orange-100 text-orange-700 border-orange-200" },
    2: { label: "Тормоз / Обиди", color: "bg-purple-100 text-purple-700 border-purple-200" },
    3: { label: "Език на омразата", color: "bg-red-100 text-red-700 border-red-200" },
    4: { label: "Насилие / Опасни", color: "bg-rose-100 text-rose-700 border-rose-200" },
    5: { label: "Голота / Сексуално", color: "bg-pink-100 text-pink-700 border-pink-200" },
    6: { label: "Друго", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export default function AdminReportsPage() {
    const { data: profile, isLoading: isProfileLoading } = useProfile();
    const { data: reports, isLoading: isReportsLoading } = useAdminReportedPosts();
    const { mutate: resolveReport, isPending: isResolving } = useAdminResolveReport();
    const { mutate: dismissReport, isPending: isDismissing } = useAdminDismissReport();

    const [filter, setFilter] = useState<"pending" | "resolved">("pending");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

    const processedReports = useMemo(() => {
        if (!reports) return [];

        const filtered = reports.filter(r => filter === "pending" ? !r.isResolved : r.isResolved);

        return filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });
    }, [reports, filter, sortOrder]);

    const isProcessing = isResolving || isDismissing;

    if (isProfileLoading) return <Loader2 className="animate-spin m-auto mt-20" />;

    const userForLayout = {
        name: getUserDisplayName(profile),
        avatar: profile?.authorAvatar || ""
    };

    return (
        <ProtectedRoute requiredRole="Admin">
            <MainLayout user={userForLayout}>
                <div className="min-h-screen bg-muted/10 pb-10">
                    <div className="max-w-5xl mx-auto pt-8 px-4">

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center border border-red-200 text-red-600 shadow-sm">
                                    <ShieldAlert className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Админ Панел: Доклади</h1>
                                    <p className="text-muted-foreground text-sm">Преглед и управление на докладвани публикации.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    className="rounded-xl bg-muted/30 border-dashed"
                                    onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                                    title={sortOrder === "desc" ? "Показване на най-старите първи" : "Показване на най-новите първи"}
                                >
                                    {sortOrder === "desc" ? (
                                        <><ArrowDownAZ className="h-4 w-4 mr-2 text-primary" /> Най-нови</>
                                    ) : (
                                        <><ArrowUpZA className="h-4 w-4 mr-2 text-primary" /> Най-стари</>
                                    )}
                                </Button>

                                <div className="flex bg-muted p-1 rounded-xl">
                                    <button
                                        onClick={() => setFilter("pending")}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", filter === "pending" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        Чакащи ({reports?.filter(r => !r.isResolved).length || 0})
                                    </button>
                                    <button
                                        onClick={() => setFilter("resolved")}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", filter === "resolved" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        Разрешени ({reports?.filter(r => r.isResolved).length || 0})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {isReportsLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                        ) : processedReports.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-dashed rounded-2xl shadow-sm">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-50" />
                                <h3 className="text-lg font-semibold text-foreground">Всичко е чисто!</h3>
                                <p className="text-muted-foreground text-sm">Няма {filter === "pending" ? "чакащи" : "разрешени"} доклади.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {processedReports.map((report) => (
                                    <div key={report.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">

                                        <div className="p-5 md:w-1/3 border-b md:border-b-0 md:border-r bg-muted/10 relative">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border shadow-sm">
                                                        <AvatarFallback className="bg-primary text-white font-bold">{report.reporterName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold leading-tight">{report.reporterName}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: bg })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <span className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border", reasonMap[report.reasonType]?.color || reasonMap[6].color)}>
                                                    {reasonMap[report.reasonType]?.label || "Друго"}
                                                </span>
                                            </div>

                                            {report.reasonComment && report.reasonComment !== "Няма допълнителен коментар." && (
                                                <div className="text-sm text-foreground bg-white p-3 rounded-xl border border-dashed shadow-sm relative">
                                                    <div className="absolute -left-1.5 top-4 w-3 h-3 bg-white border-l border-b border-dashed rotate-45"></div>
                                                    <span className="italic">"{report.reasonComment}"</span>
                                                </div>
                                            )}

                                            {report.isResolved && (
                                                <div className="mt-5 pt-4 border-t border-dashed">
                                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Решение</p>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Avatar className="h-6 w-6"><AvatarFallback className="bg-foreground text-background text-[10px]">{report.resolvedByName?.charAt(0) || "A"}</AvatarFallback></Avatar>
                                                        <span className="text-sm font-medium">{report.resolvedByName}</span>
                                                    </div>
                                                    <p className={cn("text-sm p-3 rounded-xl border", report.adminComment?.includes("отхвърлен") ? "bg-gray-50 text-gray-700 border-gray-200" : "bg-green-50 text-green-800 border-green-200")}>
                                                        {report.adminComment}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col bg-white">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Докладвано съдържание</p>
                                                </div>
                                                <div className="bg-muted/30 p-5 rounded-2xl border border-dashed mb-4">
                                                    <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                        Автор: {report.postAuthorName}
                                                    </p>
                                                    <p className={cn("text-[15px] leading-relaxed", report.isResolved && report.adminComment && !report.adminComment.includes("отхвърлен") ? "text-red-500 italic font-medium" : "text-foreground/90")}>
                                                        {report.postContent || "[Няма текст в публикацията]"}
                                                    </p>
                                                    {report.postMedia && report.postMedia.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-dashed space-y-3">
                                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Прикачени файлове:</p>

                                                            {report.postMedia.filter(m => m.mediaType === MediaType.Image).length > 0 && (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                    {report.postMedia.filter(m => m.mediaType === MediaType.Image).map(img => (
                                                                        <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border bg-black/5 aspect-square relative hover:opacity-90 transition-opacity">
                                                                            <img src={img.url} alt="P" className="w-full h-full object-cover" />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {report.postMedia.filter(m => m.mediaType === MediaType.Document).length > 0 && (
                                                                <div className="space-y-2">
                                                                    {report.postMedia.filter(m => m.mediaType === MediaType.Document).map(doc => (
                                                                        <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border shadow-sm rounded-xl hover:bg-gray-50 transition-colors">
                                                                            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                                                <FileText className="h-5 w-5" />
                                                                            </div>
                                                                            <span className="text-sm font-medium text-blue-600 truncate">{doc.fileName}</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {!report.isResolved && (
                                                <div className="flex items-center gap-3 pt-5 mt-auto border-t justify-end">
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        className="rounded-xl border-dashed hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                                        disabled={isProcessing}
                                                        onClick={() => dismissReport(report.id)}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Отхвърли (Фалшив)
                                                    </Button>

                                                    <Button
                                                        size="lg"
                                                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all"
                                                        disabled={isProcessing}
                                                        onClick={() => {
                                                            setSelectedReportId(report.id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Изтрий публикацията
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {selectedReportId && (
                    <ReportDeleteDialog
                        reportId={selectedReportId}
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                    />
                )}
            </MainLayout>
        </ProtectedRoute>
    );
}