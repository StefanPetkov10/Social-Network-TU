"use client";

import { useState } from "react";
import Link from "next/link";
import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";
import { useSavedCollections, useSavedPosts } from "@frontend/hooks/use-saved-posts";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { Skeleton } from "@frontend/components/ui/skeleton";
import { Button } from "@frontend/components/ui/button";
import { cn, getUserDisplayName } from "@frontend/lib/utils";
import { Bookmark, Layers, XCircle, FolderHeart, FolderOpen, Loader2, Home } from "lucide-react";
import { useProfile } from "@frontend/hooks/use-profile";

const SYSTEM_DEFAULT_COLLECTION = "SYSTEM_DEFAULT_GENERAL";

export default function SavedPage() {
  const [activeCollection, setActiveCollection] = useState<string>(SYSTEM_DEFAULT_COLLECTION);

  const { data: profile } = useProfile();
  const { data: collections, isLoading: loadingCollections } = useSavedCollections();
  
  const { data: posts, isLoading: isInitialLoading, isFetching } = useSavedPosts(activeCollection);

  const displayName = getUserDisplayName(profile);
  const userForLayout = {
    name: displayName,
    avatar: profile?.authorAvatar || ""
  };

  const generalCollection = collections?.data?.find(c => c.name === SYSTEM_DEFAULT_COLLECTION);
  const otherCollections = collections?.data?.filter(c => c.name !== SYSTEM_DEFAULT_COLLECTION) || [];

  return (
    <ProtectedRoute>
      <MainLayout user={userForLayout}>
        <div className="container mx-auto p-4 pl-20 space-y-8 ">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-foreground">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bookmark className="fill-primary text-primary w-6 h-6" />
                    </div>
                    Запазени публикации
                </h1>
                <p className="text-muted-foreground text-sm md:text-base mt-2 ml-1">
                    {activeCollection !== SYSTEM_DEFAULT_COLLECTION
                        ? `Преглеждате колекция: ${activeCollection}` 
                        : "Всички ваши колекции и запазени моменти"}
                </p>
            </div>
            
            {activeCollection !== SYSTEM_DEFAULT_COLLECTION && (
                <button 
                    onClick={() => setActiveCollection(SYSTEM_DEFAULT_COLLECTION)}
                    className="self-start sm:self-center text-sm font-medium text-primary hover:text-primary/80 flex items-center bg-primary/10 px-4 py-2 rounded-full transition-colors"
                >
                    <XCircle className="w-4 h-4 mr-2"/> Виж всички (Общи)
                </button>
            )}
          </div>

          <section>
             {loadingCollections ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="aspect-square w-full rounded-2xl" />)}
                </div>
             ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    
                    <div 
                        onClick={() => setActiveCollection(SYSTEM_DEFAULT_COLLECTION)}
                        className={cn(
                            "relative aspect-square w-full rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group overflow-hidden bg-card",
                            activeCollection === SYSTEM_DEFAULT_COLLECTION
                                ? "border-primary ring-4 ring-primary/10" 
                                : "border-border hover:border-primary/50"
                        )}
                    >
                         {generalCollection?.coverImageUrl ? (
                            <>
                                <img 
                                    src={generalCollection.coverImageUrl} 
                                    alt="Всички" 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                            </>
                         ) : (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-primary/10 to-muted flex flex-col items-center justify-center z-0">
                                <div className="bg-background/80 p-4 rounded-full mb-2 shadow-sm">
                                    <Layers className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                         )}

                         <div className="absolute inset-x-0 bottom-0 p-4 z-20 pointer-events-none">
                            <h3 className={cn(
                                "font-bold truncate text-lg md:text-xl leading-tight",
                                generalCollection?.coverImageUrl ? "text-white" : "text-foreground"
                            )}>
                                Всички
                            </h3>
                            <span className={cn(
                                "text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded",
                                generalCollection?.coverImageUrl ? "text-white/90 bg-white/20 backdrop-blur-md" : "text-muted-foreground bg-black/5"
                            )}>
                                {generalCollection?.count || 0} публикации
                            </span>
                         </div>
                    </div>

                    {otherCollections.map((col) => (
                        <div 
                            key={col.name}
                            onClick={() => setActiveCollection(col.name)}
                            className={cn(
                                "relative aspect-square w-full rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group overflow-hidden bg-card",
                                activeCollection === col.name ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-primary/50"
                            )}
                        >
                            {col.coverImageUrl ? (
                                <>
                                    <img 
                                        src={col.coverImageUrl} 
                                        alt={col.name} 
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                                </>
                            ) : (
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-secondary/50 to-background flex items-center justify-center z-0">
                                    <FolderHeart className="w-12 h-12 md:w-16 md:h-16 text-primary/40" />
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                                <h3 className={cn(
                                    "font-bold truncate text-lg md:text-xl leading-tight",
                                    col.coverImageUrl ? "text-white" : "text-foreground"
                                )}>
                                    {col.name}
                                </h3>
                                <div className="mt-1">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-medium",
                                        col.coverImageUrl ? "bg-white/20 backdrop-blur-md text-white" : "bg-black/5 text-muted-foreground"
                                    )}>
                                        {col.count} публикации
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             )}
          </section>

          <section className="space-y-6 pt-2">
             <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                    {activeCollection !== SYSTEM_DEFAULT_COLLECTION 
                        ? `Публикации в "${activeCollection}"` 
                        : "Всички запазени"}
                </h2>
                {isFetching && !isInitialLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                <div className="h-px bg-border flex-1 ml-4" />
             </div>

             {isInitialLoading ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    <Skeleton className="h-[500px] w-full rounded-2xl" />
                    <Skeleton className="h-[500px] w-full rounded-2xl" />
                 </div>
             ) : posts?.data?.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 w-full text-center rounded-3xl bg-muted/20 border-2 border-dashed border-muted-foreground/20">
                     <div className="bg-background p-6 rounded-full mb-6 shadow-sm ring-1 ring-border">
                        <FolderOpen className="w-12 h-12 text-muted-foreground" />
                     </div>
                     <h3 className="text-2xl font-bold mb-3 text-foreground">Колекцията е празна</h3>
                     <p className="text-muted-foreground text-lg max-w-md mb-8">
                        {activeCollection !== SYSTEM_DEFAULT_COLLECTION
                            ? `В "${activeCollection}" все още няма нищо.`
                            : "Все още не сте запазили нищо."}
                     </p>
                     
                     <Link href="/">
                        <Button size="lg" className="gap-2 rounded-full px-8">
                            <Home className="w-5 h-5" />
                            Към новините
                        </Button>
                     </Link>
                 </div>
             ) : (
                 <div className="w-full flex justify-center">
                     <div className={cn("flex flex-col gap-8 w-full max-w-3xl transition-opacity duration-300", isFetching ? "opacity-60" : "opacity-100")}>
                         {posts?.data?.map((post) => (
                             <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                                <PostCard post={post} isSavedPage={true} />
                             </div>
                         ))}
                     </div>
                 </div>
             )}
          </section>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}