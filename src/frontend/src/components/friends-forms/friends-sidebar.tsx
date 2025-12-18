"use client";

import { Home, UserCheck, UserPlus, Users } from "lucide-react";

interface FriendsSidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function FriendsSidebar({ activeTab, setActiveTab }: FriendsSidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Начало', icon: Home },
    { id: 'requests', label: 'Покани за приятелство', icon: UserCheck },
    { id: 'suggestions', label: 'Предложения', icon: UserPlus },
    { id: 'all', label: 'Всички приятели', icon: Users },
  ];

  return (
    <div className="w-[19rem] hidden md:block border-r border-gray-200 bg-white sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shrink-0">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 px-2 pt-2">Приятели</h2>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}