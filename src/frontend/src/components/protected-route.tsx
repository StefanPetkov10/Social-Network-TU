"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@frontend/stores/useAuthStore";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !accessToken) {
      router.replace("/auth/login");
    }
  }, [isInitializing, accessToken, router]);

  if (isInitializing || !accessToken) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}