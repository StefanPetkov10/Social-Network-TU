"use client";

import { AppSidebar } from "@frontend/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@frontend/components/ui/breadcrumb";
import { Separator } from "@frontend/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@frontend/components/ui/sidebar";
import { Button } from "@frontend/components/ui/button";
import { useLogout } from "@frontend/hooks/use-auth";
import { useMyPost } from "@frontend/hooks/use-post";
import  ProtectedRoute  from "@frontend/components/protected-route"
import { useEffect } from "react";

//check for expire token
//try to fetch my user data
//if token is expire - login again
export default function Page() {
  const logout = useLogout();
  const { data: post } = useMyPost();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/auth/login"; 
      },
    });
  };
  
  useEffect(() => {
    console.log(post);
  }, [post]);

  return (
    /*<><ProtectedRoute>
      <div>Welcome to dashboard!</div>
    </ProtectedRoute>*/
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Building Your Application
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="bg-primary rounded-xl px-4 py-2 font-medium shadow-sm transition-all hover:shadow-md"
            >
              Logout
            </Button>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
            </div>
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}
