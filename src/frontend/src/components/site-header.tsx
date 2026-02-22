"use client";

import { Bell, Home, Search, Users, MessageCircle, LogOut, Settings, ChevronDown } from "lucide-react";
import { Input } from "@frontend/components/ui/input";
import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { SidebarTrigger } from "@frontend/components/ui/sidebar";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@frontend/hooks/use-debounce";
import { searchService } from "@frontend/services/search-service";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@frontend/components/ui/dropdown-menu";

import { useAuthStore } from "@frontend/stores/useAuthStore";

interface SiteHeaderProps {
  user: { name: string; avatar: string };
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [localError, setLocalError] = useState(false);
  const pathname = usePathname();

  const queryClient = useQueryClient();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    logout();
    queryClient.clear();
    router.replace("/auth/login");
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.dispatchEvent(new Event("force-home-refresh"));
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["search-users", debouncedSearch],
    queryFn: () => searchService.searchUsers(debouncedSearch),
    enabled: debouncedSearch.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const handleUserClick = (username: string) => {
    setSearchQuery("");
    router.push(`/${username}`);
  };

  const getNavButtonClass = (isActive: boolean) => {
    return isActive
      ? "h-12 w-20 rounded-lg border-b-[3px] border-primary text-primary bg-primary/10 hover:bg-primary/20 transition-all"
      : "h-12 w-20 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors relative";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm supports-[backdrop-filter]:bg-background/60 backdrop-blur">

      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden [&_svg]:!size-6" />

        <Link href="/" onClick={handleHomeClick} className="flex items-center gap-2 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold shadow-sm overflow-hidden">
            {!localError ? (
              <div className="bg-muted relative w-full h-full">
                <Image
                  src="/TU-images/tu-icon.png"
                  alt="TU Logo"
                  fill
                  className="object-contain object-center bg-white"
                  priority
                  onError={() => setLocalError(true)}
                />
              </div>
            ) : (
              <span className="text-sm">TU</span>
            )}
          </div>
          <span className="hidden text-lg font-bold text-foreground md:block">
            TU Social
          </span>
        </Link>

        <div className="relative hidden lg:block ml-2 group">
          <Search className="absolute left-2.5 top-2.5 !size-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Търсене..."
            className="w-[240px] rounded-full bg-muted/50 pl-9 h-9 focus-visible:ring-1 focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery.trim().length > 0 && (
            <div className="absolute top-11 left-0 w-full md:w-[320px] bg-background border shadow-lg rounded-xl overflow-hidden flex flex-col z-[100]">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Търсене...</div>
              ) : searchResults?.data?.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {searchResults.data.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleUserClick(user.username)}
                    >
                      <Avatar className="h-10 w-10 border border-border/50 shadow-sm shrink-0">
                        <AvatarImage src={user.photo} className="object-cover" />
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate">{user.firstName} {user.lastName}</span>
                        <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">Няма намерени потребители.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
        <Link href="/" onClick={handleHomeClick}>
          <Button variant="ghost" size="icon" className={getNavButtonClass(pathname === "/")}>
            <Home className="!size-5" />
          </Button>
        </Link>

        <Link href="/groups">
          <Button variant="ghost" size="icon" className={getNavButtonClass(pathname === "/groups")}>
            <Users className="!size-5" />
          </Button>
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="cursor-pointer rounded-full bg-muted/50 relative sm:flex hover:bg-primary hover:text-white">
            <MessageCircle className="!size-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="cursor-pointer rounded-full bg-muted/50 relative hover:bg-primary hover:text-white">
          <Bell className="!size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-1 p-0 ring-2 ring-transparent hover:bg-transparent">
              <Avatar className="h-10 w-10 hover:brightness-95 transition-all cursor-pointer border border-muted">
                <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                <AvatarFallback className="bg-primary text-white font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-[2px] border shadow-sm flex items-center justify-center">
                <ChevronDown className="!size-4 text-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl shadow-lg border-border/60">
            <DropdownMenuLabel className="font-normal p-0 mb-2">
              <Link href="/profile">
                <div className="flex items-center gap-3 p-3 rounded-lg border shadow-sm bg-card hover:bg-accent transition-colors cursor-pointer">
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="bg-primary text-white">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-base group-hover:underline decoration-primary decoration-2 underline-offset-2">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Преглед на профила
                    </span>
                  </div>
                </div>
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />

            <div className="space-y-1 mt-1">
              <DropdownMenuItem className="transition-colors cursor-pointer p-3 rounded-lg hover:bg-accent focus:bg-accent">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted mr-3">
                  <Settings className="!size-6 text-foreground" />
                </div>
                <span className="font-medium text-sm">Настройки</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleLogout} className="transition-colors cursor-pointer p-3 rounded-lg hover:bg-accent focus:bg-accent">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted mr-3">
                  <LogOut className="!size-6 text-foreground" />
                </div>
                <span className="font-medium text-sm">Изход</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}