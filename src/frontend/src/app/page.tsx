"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";
import { CreatePost } from "@frontend/components/post-forms/create-post-form";
import { PostCard } from "@frontend/components/post-forms/post-card";
import { useProfile } from "@frontend/hooks/use-profile";
import { useFeedPosts } from "@frontend/hooks/use-post";
import { useIntersection } from "@mantine/hooks";
import { Loader2 } from "lucide-react";
import { getUserDisplayName } from "@frontend/lib/utils";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";


let didHandleInitialLoad = false;

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function Home() {
  const router = useRouter();
  const scrollRestoredRef = useRef(false);
  
  const { data: profile, isLoading: isProfileLoading, isError, error } = useProfile();

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPostsLoading,
    refetch 
  } = useFeedPosts();

  const { ref, entry } = useIntersection({
    root: null,
    threshold: 1,
  });

  useEffect(() => {
    const handleScroll = debounce(() => {
      if (window.scrollY > 0) {
        sessionStorage.setItem("home_feed_scroll", window.scrollY.toString());
      }
    }, 100); 

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useLayoutEffect(() => {
    if (scrollRestoredRef.current) return;
    
    if (!postsData || postsData.pages.length === 0) return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (!didHandleInitialLoad) {
        const navEntry = typeof performance !== 'undefined' 
            ? performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming 
            : null;

        if (navEntry && navEntry.type === 'reload') {
            sessionStorage.removeItem("home_feed_scroll");
            window.scrollTo(0, 0);
            didHandleInitialLoad = true;
            scrollRestoredRef.current = true;
            return; 
        }
        didHandleInitialLoad = true;
    }

    const savedPosition = sessionStorage.getItem("home_feed_scroll");
    const scrollY = savedPosition ? parseInt(savedPosition, 10) : 0;

    if (scrollY > 0) {
        window.scrollTo(0, scrollY);
        setTimeout(() => {
             if (Math.abs(window.scrollY - scrollY) > 50) {
                 window.scrollTo(0, scrollY);
             }
        }, 50);
    } else {
        window.scrollTo(0, 0);
    }
    
    scrollRestoredRef.current = true;

  }, [postsData]); 

  useEffect(() => {
      const handleForceRefresh = () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          sessionStorage.removeItem("home_feed_scroll");
          scrollRestoredRef.current = true; 
          refetch();
      };

      window.addEventListener("force-home-refresh", handleForceRefresh);
      return () => window.removeEventListener("force-home-refresh", handleForceRefresh);
  }, [refetch]);
  
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

  if (isProfileLoading) return <LoadingScreen />;

  if (isError || !profile) {
    const status = (error as any)?.response?.status || (error as any)?.status;
    if (status === 401) return null;
    return <ErrorScreen message={(error as any)?.message} />;
  }

  const displayName = getUserDisplayName(profile);
  
  const userForLayout = {
    name: displayName,
    avatar: profile.authorAvatar || ""
  };

  const userDataForPost = {
    firstName: profile.firstName,
    lastName: profile.lastName ?? "",
    photo: profile.authorAvatar ?? null
  };
    
  return (
    <ProtectedRoute>
      <MainLayout user={userForLayout}>
          <div className="min-h-screen bg-gray-100">
              <div className="max-w-7xl ml-18 mx-auto flex justify-center gap-8 pt-6 px-4 pb-10">

                  <main className="w-full max-w-2xl flex flex-col gap-5">
                      <CreatePost user={userDataForPost} />

                      {isPostsLoading && !postsData ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                        </div>
                      ) : (
                        postsData?.pages.map((page, i) => (
                            <div key={i} className="space-y-5">
                                {page.data?.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        ))
                      )}

                      {postsData?.pages[0]?.data?.length === 0 && (
                           <div className="text-center p-8 text-muted-foreground bg-white rounded-xl border border-dashed shadow-sm">
                                Все още няма публикации.
                           </div>
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