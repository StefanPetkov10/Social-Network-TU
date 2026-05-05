"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@frontend/stores/useAuthStore";
import { Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; 
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const router = useRouter();
  const [isRoleAuthorized, setIsRoleAuthorized] = useState(false);

  useEffect(() => {
    if (isInitializing) return;

    if (!accessToken) {
      router.replace("/auth/login");
      return;
    }

    if (requiredRole) {
      try {
        const decoded: any = jwtDecode(accessToken);
        
        const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const roles = decoded[roleClaim] || decoded.role || [];
        
        const hasRole = Array.isArray(roles) 
            ? roles.includes(requiredRole) 
            : roles === requiredRole;

        if (!hasRole) {
          router.replace("/");
          return;
        }
      } catch (error) {
        console.error("Грешка при декодиране на тоукъна:", error);
        router.replace("/auth/login");
        return;
      }
    }

    setIsRoleAuthorized(true);
  }, [isInitializing, accessToken, requiredRole, router]);

  if (isInitializing || !accessToken || (requiredRole && !isRoleAuthorized)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}