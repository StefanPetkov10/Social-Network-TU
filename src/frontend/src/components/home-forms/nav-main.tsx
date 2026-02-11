"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@frontend/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@frontend/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className="
                    h-12 mb-1 rounded-xl text-base font-medium text-muted-foreground hover:bg-gray-50 hover:text-primary
                    
                    /* КОГАТО Е СВИТ (ICON MODE): */
                    group-data-[collapsible=icon]:!size-[44px]       /* Голям размер */
                    group-data-[collapsible=icon]:!rounded-full      /* Пълен кръг */
                    group-data-[collapsible=icon]:!p-0               /* Без падинг */
                    group-data-[collapsible=icon]:justify-center     /* Центриране */
                    group-data-[collapsible=icon]:hover:bg-primary/10 /* Хубавия син ховър */
                "
              >
                <a href={item.url} className="flex items-center gap-4 group-data-[collapsible=icon]:justify-center">
                  <div
                    className="
                        flex size-9 items-center justify-center rounded-full bg-gray-100 text-muted-foreground transition-colors 
                        group-hover/collapsible:bg-primary/10 group-hover/collapsible:text-primary
                        
                        /* При свит режим махаме фона и размера, за да ползваме големия бутон */
                        group-data-[collapsible=icon]:bg-transparent 
                        group-data-[collapsible=icon]:size-auto
                        group-data-[collapsible=icon]:group-hover/collapsible:bg-transparent
                    "
                  >
                    <item.icon className="size-5" />
                  </div>

                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </a>
              </SidebarMenuButton>

              {item.items && item.items.length > 0 && (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction
                      className="absolute right-14 size-8 text-muted-foreground transition-transform hover:bg-gray-200 hover:text-primary data-[state=open]:rotate-90 rounded-full flex items-center justify-center group-data-[collapsible=icon]:hidden"
                    >
                      <ChevronRight className="size-6" /> 
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-6 border-l border-muted">
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className="h-10 rounded-lg text-sm text-muted-foreground hover:bg-gray-50 hover:text-primary"
                          >
                            <a href={subItem.url}>
                              <span className="font-medium">
                                {subItem.title}
                              </span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}