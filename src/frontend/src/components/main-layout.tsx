"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  
  const isMessagesPage = pathname?.startsWith("/messages");

  return (
    <SidebarProvider 
        defaultOpen={!isMessagesPage}
        style={{
           "--sidebar-width": "19rem", 
           "--sidebar-width-icon": "5.5rem" 
        } as React.CSSProperties}
    >
       <SiteHeader user={user} />
       
       <AppSidebar user={user} />
       
       <SidebarInset className="pt-16 bg-muted/10 transition-all duration-300 ease-in-out">
          {children}
       </SidebarInset>
    </SidebarProvider>
  );
}