"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { useAuthStore } from "@frontend/stores/useAuthStore"; 
import { Loader2 } from "lucide-react"; 

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/auth/login");
      setIsAuthorized(false); 
    } else {
      setIsAuthorized(true);
    }
  }, [token, router]);

  if (!isAuthorized || !token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}