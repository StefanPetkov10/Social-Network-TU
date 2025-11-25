"use client";

import { Bell, Home, Search, Users, MessageCircle, LogOut, Settings, Menu } from "lucide-react";
import { Input } from "@frontend/components/ui/input";
import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { SidebarTrigger } from "@frontend/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@frontend/components/ui/dropdown-menu";

interface SiteHeaderProps {
  user: { name: string; avatar: string };
  logout: () => void;
}

export function SiteHeader({ user, logout }: SiteHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm supports-[backdrop-filter]:bg-background/60 backdrop-blur">

      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" /> 
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold shadow-sm">
            TU
          </div>
          <span className="hidden text-lg font-bold text-foreground md:block">
            TU Social
          </span>
        </div>
        <div className="relative hidden lg:block ml-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Търсене..."
            className="w-[240px] rounded-full bg-muted/50 pl-9 h-9 focus-visible:ring-1 focus-visible:ring-blue-600"
          />
        </div>
      </div>

      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
        <Button variant="ghost" size="icon" className="h-12 w-20 rounded-lg border-b-[3px] border-primary text-primary bg-primary/10 hover:bg-primary/20">
          <Home className="h-6 w-6" />
        </Button>
        {/*do exactly same this two buttons like colors */}
        <Button variant="ghost" size="icon" className="h-12 w-20 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Users className="h-6 w-6" />
          <span className="absolute top-3 right-5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
        </Button>
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 hidden sm:flex hover:bg-blue-100 hover:text-blue-600">
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 relative hover:bg-blue-100 hover:text-blue-600">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-1 p-0 ring-2 ring-transparent hover:ring-blue-200">
              <Avatar className="h-full w-full">
                <AvatarImage src={user.avatar} alt={user.name} className="object-cover"/>
                <AvatarFallback className="bg-primary text-white font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
             <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Преглед на профила</p>
                </div>
             </DropdownMenuLabel>
             <DropdownMenuSeparator />
             <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Настройки</span>
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Изход</span>
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}