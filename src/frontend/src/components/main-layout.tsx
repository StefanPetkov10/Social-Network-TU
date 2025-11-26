import { AppSidebar } from "./home-forms/app-sidebar";
import { SiteHeader } from "./site-header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

export function MainLayout({ children, user, logout }: { children: React.ReactNode; user: any; logout: () => void }) {
  return (
    <SidebarProvider defaultOpen={true}>
       <SiteHeader user={user} logout={logout} />
       <AppSidebar />
       <SidebarInset className="pt-16 bg-muted/10 min-h-screen">
          {children}
       </SidebarInset>
    </SidebarProvider>
  );
}