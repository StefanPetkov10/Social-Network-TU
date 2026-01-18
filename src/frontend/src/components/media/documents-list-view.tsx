"use client";

import { useEffect } from "react";
import { useMediaInfinite } from "@frontend/hooks/use-post";
import { MediaTypeGroup } from "@frontend/lib/types/enums";
import { useIntersection } from "@mantine/hooks";
import { FileText, Download, File, FileSpreadsheet, FileIcon, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { Skeleton } from "@frontend/components/ui/skeleton";

interface DocumentsListViewProps {
  id: string;
  type: "user" | "group";
}

export function DocumentsListView({ id, type }: DocumentsListViewProps) {
  const { 
      data, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage, 
      isLoading 
  } = useMediaInfinite({ 
      id, 
      sourceType: type, 
      mediaType: MediaTypeGroup.Documents 
  });

  const { ref, entry } = useIntersection({ root: null, threshold: 0.5 });
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) fetchNextPage();
  }, [entry, hasNextPage, fetchNextPage]);

  const documents = data?.pages.flatMap((page) => page.data || []) || [];

  const getFileIcon = (fileName: string) => {
      const ext = fileName?.split('.').pop()?.toLowerCase();
      if (['pdf'].includes(ext!)) return <FileText className="h-6 w-6 text-red-500" />;
      if (['xls', 'xlsx', 'csv'].includes(ext!)) return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      if (['doc', 'docx'].includes(ext!)) return <FileIcon className="h-6 w-6 text-blue-500" />;
      return <File className="h-6 w-6 text-gray-500" />;
  };

  if (isLoading) return <DocumentsSkeleton />;

  if (documents.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
            <FolderOpen className="h-12 w-12 mb-3 opacity-20" />
            <h3 className="font-semibold text-lg">Няма документи</h3>
            <p className="text-sm">Тук ще се покажат качените файлове.</p>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="divide-y">
            {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            {getFileIcon(doc.fileName || "")}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate pr-4" title={doc.fileName}>
                                {doc.fileName || "Document"}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 gap-2 mt-0.5">
                                <span className="uppercase font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                    {doc.fileName?.split('.').pop() || "FILE"}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <Button asChild variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-primary hover:bg-blue-50">
                        <a 
                            href={doc.url} 
                            download={doc.fileName} 
                            target="_blank" 
                            rel="noreferrer"
                        >
                            <Download className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            ))}
        </div>
        
        {isFetchingNextPage && (
            <div className="p-4 flex justify-center">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        )}
        <div ref={ref} className="h-1" />
    </div>
  );
}

function DocumentsSkeleton() {
    return (
        <div className="space-y-2">
            {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-xl bg-white">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            ))}
        </div>
    )
}