"use client"

import * as React from "react"
import {
  Users,
  Bookmark,
  UserPlus,
  LayoutGrid,
  LifeBuoy,
  Send,
} from "lucide-react"

import { NavMain } from "@frontend/components/home-forms/nav-main"
import { NavSecondary } from "@frontend/components/home-forms/nav-secondary" 
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@frontend/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar"

const data = {
  user: {
    name: "Стефан Петков",
    email: "stefan@tu-sofia.bg",
    avatar: "", 
  },
  navMain: [
    {
      title: "Приятели",
      url: "/friends",
      icon: UserPlus,
    },
    {
      title: "Последователи",
      url: "/followers",
      icon: Users,
    },
    {
      title: "Запазени",
      url: "/saved",
      icon: Bookmark,
    },
    {
      title: "Моите Групи",
      url: "/groups",
      icon: LayoutGrid,
      isActive: true,
      items: [
        {
          title: "Софтуерно Инженерство '24",
          url: "/groups/ksi",
        },
        {
          title: "Спортен клуб ТУ",
          url: "/groups/sport",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Поддръжка (Support)",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "Обратна връзка (Feedback)",
      url: "/feedback",
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar 
        collapsible="icon" 
        {...props} 
        className="top-16 h-[calc(100vh-4rem)] border-r z-30" 
    >
      <SidebarHeader className="p-4 pb-2"> 
        <a href="/profile" className="flex items-center gap-4 p-3 hover:bg-sidebar-accent rounded-xl transition-colors group-data-[collapsible=icon]:justify-center">
           <Avatar className="h-12 w-12 border cursor-pointer shadow-sm">
              <AvatarImage src={data.user.avatar} />
              <AvatarFallback className="bg-primary text-white text-lg">СП</AvatarFallback>
           </Avatar>
           <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold text-lg text-foreground">{data.user.name}</span>
              <span className="truncate text-sm text-muted-foreground">Студент @ ТУ-София</span>
           </div>
        </a>
      </SidebarHeader>

      <SidebarContent className="px-3 flex flex-col h-full gap-6 [&_svg]:size-6 [&_span]:text-base [&_a]:py-3">
        <NavMain items={data.navMain} />
        
        <NavSecondary items={data.navSecondary} className="mt-auto pb-4" />
      </SidebarContent>
      
      <SidebarRail />
    </Sidebar>
  )
}