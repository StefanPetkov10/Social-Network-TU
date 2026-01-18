"use client";

import { useState, useEffect } from "react";
import { useMediaInfinite } from "@frontend/hooks/use-post";
import { MediaTypeGroup } from "@frontend/lib/types/enums";
import { useIntersection } from "@mantine/hooks";
import { Play, Loader2, ImageOff, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@frontend/components/ui/dialog";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { Button } from "@frontend/components/ui/button";

interface MediaGalleryViewProps {
  id: string;
  type: "user" | "group";
}

export function MediaGalleryView({ id, type }: MediaGalleryViewProps) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  const { 
      data, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage, 
      isLoading 
  } = useMediaInfinite({ 
      id, 
      sourceType: type, 
      mediaType: MediaTypeGroup.Visuals 
  });

  const { ref, entry } = useIntersection({ root: null, threshold: 0.5 });
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) fetchNextPage();
  }, [entry, hasNextPage, fetchNextPage]);

  const allMedia = data?.pages.flatMap((page) => page.data || []) || [];

  const handleNext = () => {
      if (selectedMediaIndex !== null && selectedMediaIndex < allMedia.length - 1) {
          setSelectedMediaIndex(selectedMediaIndex + 1);
      }
  };

  const handlePrev = () => {
      if (selectedMediaIndex !== null && selectedMediaIndex > 0) {
          setSelectedMediaIndex(selectedMediaIndex - 1);
      }
  };

  if (isLoading) return <MediaGridSkeleton />;

  if (allMedia.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
        <ImageOff className="h-12 w-12 mb-3 opacity-20" />
        <h3 className="font-semibold text-lg">Няма намерена медия</h3>
        <p className="text-sm">Споделете снимки или видеоклипове.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-3">
        {allMedia.map((item, index) => (
          <div 
            key={item.id} 
            className="group relative aspect-square bg-muted rounded-md overflow-hidden cursor-pointer border hover:border-primary/50 transition-all shadow-sm"
            onClick={() => setSelectedMediaIndex(index)}
          >
            {item.mediaType === 0 || item.mediaType === 3 ? (
              <img 
                src={item.url} 
                alt="Gallery Item" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full relative">
                 <video src={item.url} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white fill-white opacity-80 group-hover:scale-110 transition-transform" />
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isFetchingNextPage && (
          <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-primary h-6 w-6" />
          </div>
      )}
      
      <div ref={ref} className="h-4 w-full" />

      <Dialog open={selectedMediaIndex !== null} onOpenChange={(open) => !open && setSelectedMediaIndex(null)}>
        <DialogContent className="max-w-screen-xl w-full h-[90vh] p-0 bg-black/95 border-none flex items-center justify-center outline-none" aria-describedby={undefined}>
            <DialogTitle className="sr-only">
                Преглед на медия
            </DialogTitle>

            {selectedMediaIndex !== null && (
                <div className="relative w-full h-full flex items-center justify-center">
                    {allMedia[selectedMediaIndex].mediaType === 1 ? (
                        <video 
                            src={allMedia[selectedMediaIndex].url} 
                            controls 
                            autoPlay 
                            className="max-h-full max-w-full outline-none" 
                        />
                    ) : (
                        <img 
                            src={allMedia[selectedMediaIndex].url} 
                            alt="Full View" 
                            className="max-h-full max-w-full object-contain" 
                        />
                    )}

                    {selectedMediaIndex > 0 && (
                        <Button variant="ghost" size="icon" className="absolute left-2 text-white hover:bg-white/10 rounded-full h-12 w-12" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                    )}
                    
                    {selectedMediaIndex < allMedia.length - 1 && (
                        <Button variant="ghost" size="icon" className="absolute right-2 text-white hover:bg-white/10 rounded-full h-12 w-12" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    )}

                    <DialogClose className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors z-50">
                        <X className="h-6 w-6" />
                    </DialogClose>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function MediaGridSkeleton() {
    return (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
        </div>
    )
}