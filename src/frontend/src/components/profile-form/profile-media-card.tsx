"use client";

import { useQuery } from "@tanstack/react-query";
import { postService } from "@frontend/services/post-service";
import { 
  FileText, 
  Download, 
  Image as ImageIcon,
  FileSpreadsheet,
  FilePieChart,
  FileArchive,
  FileIcon,
  File
} from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { cn, getFileDetails } from "@frontend/lib/utils";

interface ProfileMediaFormProps {
  profileId: string;
}

export function ProfileMediaCard({ profileId }: ProfileMediaFormProps) {
  const { data: response, isLoading } = useQuery({
    queryKey: ["profile-media", profileId],
    queryFn: () => postService.getProfileMedia(profileId),
    enabled: !!profileId,
  });

  const mediaData = response?.data;

  if (isLoading) {
    return <MediaSkeleton />;
  }

  const hasImages = mediaData?.images && mediaData.images.length > 0;
  const hasDocuments = mediaData?.documents && mediaData.documents.length > 0;
  const isEmpty = !hasImages && !hasDocuments;

  return (
    <div className="bg-background rounded-xl border p-5 shadow-sm h-fit">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Медия</h3>
        {!isEmpty && (
             <Button variant="link" className="text-primary p-0 h-auto font-semibold">Виж всички</Button>
        )}
      </div>

      {isEmpty ? (
          <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">Няма качена медия</p>
          </div>
      ) : (
        <>
            {hasImages && (
                <div className="mb-6">
                    <div className="grid grid-cols-3 gap-3">
                        {mediaData.images.slice(0, 6).map((img: any) => (
                            <div key={img.id} className="aspect-square bg-muted rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer border border-border/50 relative shadow-sm">
                                {img.mediaType === 0 ? (
                                    <img src={img.url} alt="media" className="w-full h-full object-cover" />
                                ) : (
                                    <video src={img.url} className="w-full h-full object-cover" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasImages && hasDocuments && (
                <div className="border-t my-5" />
            )}

            {hasDocuments && (
                <div>
                    <h4 className="font-semibold text-base mb-3">Последни документи</h4>
                    <div className="space-y-3">
                        {mediaData.documents.map((doc: any) => {
                            const { Icon, colorClass } = getFileDetails(doc.fileName);
                            return (
                                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-all group cursor-pointer bg-muted/10">
                                    <div className={cn("p-2.5 rounded-lg shrink-0 flex items-center justify-center", colorClass)}>
                                        <Icon />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-sm font-semibold truncate text-foreground" title={doc.fileName}>
                                            {doc.fileName || "Document"}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium uppercase mt-0.5">
                                            {doc.fileName?.split('.').pop() || "DOC"}
                                        </p>
                                    </div>
                                    <a 
                                        href={doc.url}
                                        download={doc.fileName || "download"}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-background rounded-full"
                                    >
                                        <Download className="h-5 w-5" />
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
}

function MediaSkeleton() {
    return (
        <div className="bg-background rounded-xl border p-5 shadow-sm space-y-5">
            <div className="flex justify-between">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-5 w-20" />
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
            </div>
        </div>
    )
}