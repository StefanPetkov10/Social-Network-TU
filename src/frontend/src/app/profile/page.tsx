"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@frontend/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { CreatePost } from "@frontend/components/create-post";
import { Separator } from "@frontend/components/ui/separator";
import { 
  Edit, 
  Image as ImageIcon,
  FileText, 
  MoreHorizontal,
  Users
} from "lucide-react";
import { MainLayout } from "@frontend/components/main-layout";
import { useProfile } from "@frontend/hooks/use-profile";
import ProtectedRoute from "@frontend/components/protected-route";
import { LoadingScreen } from "@frontend/components/common/loading-screen";
import { ErrorScreen } from "@frontend/components/common/error-screen";

const getInitials = (first: string, last?: string) => {
    const f = first ? first.charAt(0) : "";
    const l = last ? last.charAt(0) : "";
    return (f + l).toUpperCase();
};

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Публикации");
  
  const { data: profile, isLoading, isError, error } = useProfile();

  useEffect(() => {
    if (isError) {
        const status = (error as any)?.response?.status || (error as any)?.status;
        if (status === 401) {
            localStorage.removeItem("token");
            router.push("/auth/login");
        }
    }
  }, [isError, error, router]);

  if (isLoading) {
      return <LoadingScreen />;
  }

  if (isError || !profile) {
      const status = (error as any)?.response?.status || (error as any)?.status;
      
      if (status === 401) {
          return null;
      }

      return <ErrorScreen message={(error as any)?.message} />;
  }

  const displayName = profile.fullName || profile.firstName || "";
  const initials = getInitials(profile.firstName, profile.lastName);
  const bio = profile.bio || ""; 

  const userDataForPost = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      photo: profile.photo
  };

  const userForLayout = {
      name: displayName,
      avatar: profile.photo || ""
  };

  return (
    <ProtectedRoute>
      <MainLayout user={userForLayout}>
        <div className="max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6">
            
            <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        
                        <div className="relative group">
                            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg ring-2 ring-muted">
                                <AvatarImage src={profile.photo || ""} className="object-cover" />
                                <AvatarFallback className="bg-primary text-white text-4xl font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2 mt-2">
                            <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
                            <p className="text-muted-foreground font-medium">@{profile.userName}</p>
                            
                            <div className="max-w-lg mx-auto md:mx-0 mt-3">
                                {bio ? (
                                    <p className="text-sm text-foreground/90 leading-relaxed">
                                        {bio}
                                    </p>
                                ) : (
                                    <div 
                                        className="cursor-pointer group flex items-center justify-center md:justify-start gap-2"
                                        title="Натиснете за добавяне"
                                    >
                                        <p className="text-sm text-muted-foreground/60 italic border-b border-transparent group-hover:border-muted-foreground/60 transition-all">
                                            Добавете кратко описание за себе си...
                                        </p>
                                        <Edit className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-6 text-sm font-medium pt-2 text-muted-foreground">
                                <span className="hover:text-foreground cursor-pointer flex items-center gap-1">
                                    <Users className="h-4 w-4" /> 
                                    <strong className="text-foreground">{profile.friendsCount}</strong> Приятели
                                </span>
                                <span className="hover:text-foreground cursor-pointer">
                                    <strong className="text-foreground">{profile.followersCount}</strong> Последователи
                                </span>
                                <span className="hover:text-foreground cursor-pointer">
                                    <strong className="text-foreground">{profile.followingCount}</strong> Последвани
                                </span>
                            </div>
                        </div>

                        <Button className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90">
                            <Edit className="h-4 w-4" /> Редактиране
                        </Button>
                    </div>
                </div>
                
                <div className="px-6 border-t flex gap-6 overflow-x-auto scrollbar-hide">
                    {["Публикации", "Информация", "Приятели", "Медия & Документи"].map((tab) => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="space-y-6">
                    <div className="bg-background rounded-xl border p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-lg">Медия</h3>
                            <Button variant="link" className="text-primary p-0 h-auto">Виж всички</Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="aspect-square bg-muted rounded-md hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                            ))}
                        </div>
                         <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-sm mb-2">Последни документи</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                                    <div className="bg-red-100 p-2 rounded"><FileText className="h-4 w-4 text-red-600" /></div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium truncate">Kursova_Rabota_PIK3.pdf</p>
                                        <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    
                    {userDataForPost && <CreatePost user={userDataForPost} />}

                    <div className="bg-background rounded-xl border p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                             <div className="flex gap-3">
                                <Avatar>
                                    <AvatarImage src={profile.photo || ""} />
                                    <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-sm">{displayName}</h4>
                                    <p className="text-xs text-muted-foreground">преди 2 часа • 🎓 Академичен</p>
                                </div>
                             </div>
                             <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
                        </div>
                        
                        <p className="text-sm mb-4">
                            Това е примерен пост. В бъдеще тук ще се зареждат истинските постове от базата данни, използвайки подобен подход с React Query! 📚
                        </p>
                        
                        <div className="bg-muted/30 border rounded-lg p-3 flex items-center gap-3 mb-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="bg-red-100 p-3 rounded-lg">
                                <FileText className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Lecture_05_SQL.pdf</p>
                                <p className="text-xs text-muted-foreground">3.2 MB • Документ</p>
                            </div>
                        </div>

                        <Separator />
                        <div className="flex justify-between pt-2">
                             <Button variant="ghost" className="flex-1 text-muted-foreground text-xs sm:text-sm">Харесване</Button>
                             <Button variant="ghost" className="flex-1 text-muted-foreground text-xs sm:text-sm">Коментар</Button>
                             <Button variant="ghost" className="flex-1 text-muted-foreground text-xs sm:text-sm">Изтегли</Button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}