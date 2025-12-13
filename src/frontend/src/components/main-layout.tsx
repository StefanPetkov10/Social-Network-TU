"use client";

import React, { use } from "react";
import { AppSidebar } from "@frontend/components/home-forms/app-sidebar";
import { SiteHeader } from "@frontend/components/site-header";
import { SidebarInset, SidebarProvider } from "@frontend/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    avatar: string;
  };
}

export function MainLayout({ children, user }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
       <SiteHeader user={user} />
       
       <AppSidebar user={user} />
       
       <SidebarInset className="pt-16 bg-muted/10 min-h-screen">
          {children}
       </SidebarInset>
    </SidebarProvider>
  );
}