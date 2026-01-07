"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { useAuthStore } from "@frontend/stores/useAuthStore"; 
import { Loader2 } from "lucide-react"; 

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !token) {
      router.replace("/auth/login");
    }
  }, [isMounted, token, router]);

  if (!isMounted || !token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}