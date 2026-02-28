"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@frontend/hooks/use-debounce";
import { searchService } from "@frontend/services/search-service";
import { Lock, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Newspaper, 
  Compass,    
  Users,    
  Settings,   
  Loader2
} from "lucide-react";
import { useMyGroups } from "@frontend/hooks/use-groups";
import { CreateGroupDialog } from "@frontend/components/groups-forms/create-group-dialog";

export function GroupsSidebar() {

  const { data: myGroupsData, isLoading: isMyGroupsLoading } = useMyGroups();

  const pathname = usePathname();

  const menuItems = [
    { 
      id: 'feed', 
      label: 'Вашият канал', 
      icon: Newspaper, 
      href: '/groups' 
    },
    { 
      id: 'discover', 
      label: 'Откриване', 
      icon: Compass, 
      href: '/groups/discover' 
    },
    { 
      id: 'my-groups', 
      label: 'Вашите групи', 
      icon: Users, 
      href: '/groups/my-groups' 
    },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["search-groups", debouncedSearch],
    queryFn: () => searchService.searchGroups(debouncedSearch),
    enabled: debouncedSearch.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const handleGroupClick = (groupName: string) => {
    setSearchQuery("");
  };
  return (
    <div className="w-[19rem] hidden md:block border-r border-gray-200 bg-white sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6 px-2 pt-2">
            <h2 className="text-2xl font-bold text-gray-800">Групи</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                <Settings className="size-5" />
            </button>
        </div>

        <div className="px-2 mb-4 relative z-50">
          <input
            type="text"
            placeholder="Търсене на групи"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          {searchQuery.trim().length > 0 && (
            <div className="absolute top-11 left-2 right-2 bg-background border shadow-lg rounded-xl overflow-hidden flex flex-col z-[100] max-h-[350px]">
              {isSearching ? (
                <div className="p-4 flex justify-center items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin h-4 w-4" /> Търсене...
                </div>
              ) : searchResults?.data?.length > 0 ? (
                <div className="overflow-y-auto">
                  {searchResults.data.map((group: any) => (
                    <Link
                      href={`/groups/${encodeURIComponent(group.name)}`}
                      key={group.id}
                      className="flex flex-col p-3 hover:bg-muted cursor-pointer transition-colors border-b last:border-b-0"
                      onClick={() => handleGroupClick(group.name)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {group.isPrivate ? (
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        ) : (
                          <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-semibold text-sm truncate">{group.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {group.description || "Няма описание"}
                        </span>
                        <span className="text-xs font-medium text-primary shrink-0">
                          {group.membersCount} {group.membersCount === 1 ? 'член' : 'членове'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">Няма намерени групи.</div>
              )}
            </div>
          )}

        <div className="space-y-1 mb-6">
          {menuItems.map((item) => {
            const isActive = item.href === '/groups' 
                ? pathname === '/groups'
                : pathname?.startsWith(item.href);
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-4 px-3 py-2 rounded-xl text-left text-base font-medium transition-colors group h-12 mb-1
                  ${isActive 
                    ? 'bg-gray-100 text-primary' 
                    : 'text-muted-foreground hover:bg-gray-50 hover:text-primary'
                  }`}
              >
                <div 
                  className={`flex size-9 items-center justify-center rounded-full transition-colors
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}
                >
                    <item.icon className="size-5" />
                </div>
                
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mb-6">
            <CreateGroupDialog />
        </div>

        <div className="px-2 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Групи, в които участвате</h3>
            {isMyGroupsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {!myGroupsData?.data || myGroupsData.data.length === 0 ? (
                  <p className="text-sm text-gray-500">Все още не сте член на групи.</p>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {myGroupsData.data.slice(0, 5).map((group) => {
                        const currentPath = decodeURIComponent(pathname || "");
                        const groupPath = `/groups/${group.name}`;
                        const isGroupActive = 
                            currentPath === groupPath || 
                            currentPath.startsWith(`${groupPath}/`);                                        
                        return (
                            <li key={group.id}>
                                <Link
                                    href={`/groups/${group.name}`} 
                                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors 
                                        ${isGroupActive
                                            ? 'bg-gray-100 text-primary'
                                            : 'text-muted-foreground'
                                        }`}
                                >
                                    {group.name}
                                </Link>
                            </li>
                        );
                    })}
                  </ul>
                )}
              </>
            )}
            <Link href="/groups/my-groups" className="text-xs text-primary mt-2 block px-2 hover:underline">Виж всички</Link>
        </div>
      </div>
    </div>
  </div>
  );
} 