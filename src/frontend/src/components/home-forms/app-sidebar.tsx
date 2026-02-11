"use client"

import * as React from "react"
import { usePathname } from "next/navigation" 
import {
  Users,
  Bookmark,
  UserPlus,
  LayoutGrid,
  LifeBuoy,
  Send,
  MessageCircle, 
} from "lucide-react"

import { NavMain } from "@frontend/components/home-forms/nav-main"
import { NavSecondary } from "@frontend/components/home-forms/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar, 
} from "@frontend/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar"
import { getInitials } from "@frontend/lib/utils";
import { useMyGroups } from "@frontend/hooks/use-groups"
import { useEffect } from "react"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    avatar: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { data: myGroupsItems, isLoading } = useMyGroups();
  const initials = getInitials(user.name);
  
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const isMessagesPage = pathname.startsWith("/messages");

  useEffect(() => {
    if (isMessagesPage) {
      setOpen(false); 
    } else {
      setOpen(true); 
    }
  }, [isMessagesPage, setOpen]);

  const navMainItems = [
    { title: "Съобщения", url: "/messages", icon: MessageCircle, isActive: isMessagesPage }, 
    { title: "Приятели", url: "/friends", icon: UserPlus },
    { title: "Последователи", url: "/followers", icon: Users },
    { title: "Запазени", url: "/saved-posts", icon: Bookmark },
    {
      title: "Моите Групи",
      url: "/groups",
      icon: LayoutGrid,
      isActive: pathname.startsWith("/groups") && !isMessagesPage, 
      items: isLoading 
        ? [{ title: "Зареждане...", url: "#" }] 
        : myGroupsItems?.data?.length 
            ? myGroupsItems.data.map((group: any) => ({
                title: group.name,
                url: `/groups/${group.name}` 
              }))
            : [{ title: "Нямате групи", url: "/groups/discover" }], 
    },
  ];

  const navSecondaryItems = [
    { title: "Поддръжка (Support)", url: "/support", icon: LifeBuoy },
    { title: "Обратна връзка (Feedback)", url: "/feedback", icon: Send },
  ];

  return (
    <Sidebar 
        collapsible="icon" 
        {...props} 
        style={{
            "--sidebar-width": "19rem",
            "--sidebar-width-icon": "5.5remч" 
        } as React.CSSProperties}
        className="top-16 h-[calc(100vh-4rem)] border-r z-30" 
    >
      <SidebarHeader className="p-4 pb-2"> 
        <a 
            href="/profile" 
            className="flex items-center gap-4 p-3 hover:bg-sidebar-accent rounded-xl transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1"
        >
           <Avatar className="h-12 w-12 border cursor-pointer shadow-sm shrink-0">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-white text-lg">{initials}</AvatarFallback>
           </Avatar>
           
           <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold text-lg text-foreground">{user.name}</span>
              <span className="truncate text-sm text-muted-foreground">Студент @ ТУ-София</span>
           </div>
        </a>
      </SidebarHeader>

      <SidebarContent className="px-3 flex flex-col h-full gap-6 [&_svg]:size-6 [&_span]:text-base [&_a]:py-3">
        <NavMain items={navMainItems} />
        <NavSecondary items={navSecondaryItems} className="mt-auto pb-4" />
      </SidebarContent>
      
      {!isMessagesPage && <SidebarRail />}
    </Sidebar>
  )
}