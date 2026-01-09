"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Newspaper, 
  Compass,   
  Users,     
  PlusCircle,
  Settings   
} from "lucide-react";

export function GroupsSidebar() {
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

  return (
    <div className="w-[19rem] hidden md:block border-r border-gray-200 bg-white sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6 px-2 pt-2">
            <h2 className="text-2xl font-bold text-gray-800">Групи</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                <Settings className="size-5" />
            </button>
        </div>

        <div className="px-2 mb-4">
            <input 
                type="text" 
                placeholder="Търсене на групи" 
                className="w-full bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
        </div>

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

        <Link 
            href="/groups/create"
            className="flex items-center justify-center w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20 font-semibold py-3 rounded-xl transition-colors mb-6"
        >
            <PlusCircle className="size-5" />
            <span>Създаване на нова група</span>
        </Link>

        <div className="px-2 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Групи, в които участвате</h3>
            <div className="space-y-1 opacity-60 hover:opacity-100 transition-opacity">
                 <p className="text-sm px-2 py-1 cursor-pointer hover:bg-gray-50 rounded-lg truncate">Софтуерно Инженерство '24</p>
                 <p className="text-sm px-2 py-1 cursor-pointer hover:bg-gray-50 rounded-lg truncate">Спортен клуб ТУ</p>
            </div>
             <Link href="/groups/my-groups" className="text-xs text-primary mt-2 block px-2 hover:underline">Виж всички</Link>
        </div>
      </div>
    </div>
  );
}