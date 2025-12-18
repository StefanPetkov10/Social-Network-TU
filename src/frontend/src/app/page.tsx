"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";
import { CreatePost } from "@frontend/components/post-forms/create-post-form";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { useProfile } from "@frontend/hooks/use-profile";
import { useFeedPosts } from "@frontend/hooks/use-post";
import { useIntersection } from "@mantine/hooks";
import { Loader2 } from "lucide-react";

import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";

export default function Home() {
  const router = useRouter();
  
  const { data: profile, isLoading: isProfileLoading, isError, error } = useProfile();

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPostsLoading
  } = useFeedPosts();

  const { ref, entry } = useIntersection({
    root: null,
    threshold: 1,
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, fetchNextPage]);

  useEffect(() => {
    if (isError) {
      const status = (error as any)?.response?.status || (error as any)?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        router.push("/auth/login");
      }
    }
  }, [isError, error, router]);

  if (isProfileLoading) {
    return <LoadingScreen />;
  }

  if (isError || !profile) {
    const status = (error as any)?.response?.status || (error as any)?.status;
    if (status === 401) {
      return null;
    }
    return <ErrorScreen message={(error as any)?.message} />;
  }

  const displayName = profile.fullName || profile.firstName;
  
  const userForLayout = {
    name: displayName,
    avatar: profile.photo || ""
  };

  const userDataForPost = {
    firstName: profile.firstName,
    lastName: profile.lastName ?? "",
    photo: profile.photo ?? null
  };
    
  return (
    <ProtectedRoute>
      <MainLayout user={userForLayout}>
          <div className="min-h-screen bg-gray-100">
              
                  <div className="max-w-7xl ml-18 mx-auto flex justify-center gap-8 pt-6 px-4 pb-10">

                  <main className="w-full max-w-2xl flex flex-col gap-5">

                     <CreatePost user={userDataForPost} />

                     {isPostsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                        </div>
                     ) : (
                        postsData?.pages.map((page, i) => (
                            <div key={i} className="space-y-5">
                                {page.data && page.data.length === 0 && i === 0 ? (
                                    <div className="text-center p-8 text-muted-foreground bg-white rounded-xl border border-dashed shadow-sm">
                                        Все още няма публикации във вашия фийд.
                                    </div>
                                ) : (
                                    page.data?.map((post) => (
                                        <PostCard key={post.id} post={post} />
                                    ))
                                )}
                            </div>
                        ))
                     )}

                     {isFetchingNextPage && (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-muted-foreground" />
                        </div>
                     )}

                     <div ref={ref} className="h-4" />
                  </main>

                  <aside className="hidden xl:block w-80 h-fit sticky top-24">
                     
                     <div className="bg-white rounded-xl border shadow-sm p-5 overflow-hidden">
                          <h3 className="font-semibold mb-3 text-sm text-foreground">Спонсорирано</h3>
                          
           
                          <div className="aspect-video bg-muted/50 rounded-lg mb-3 flex items-center justify-center border border-dashed">
                                <span className="text-xs text-muted-foreground">Ad Space</span>
                          </div>
                          
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">Tech University Ads</p>
                              <p className="text-xs text-muted-foreground">tu-sofia.bg</p>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                              Рекламно съдържание, базирано на вашите интереси.
                          </p>
                     </div>

                     <div className="mt-4 text-xs text-muted-foreground px-2 text-center">
                        © 2024 TU Social Inc.
                     </div>
                  </aside>

              </div>
          </div>
      </MainLayout>
    </ProtectedRoute>
  );
}