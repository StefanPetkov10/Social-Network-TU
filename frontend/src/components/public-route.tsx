"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/useAuthStore";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && accessToken) {
      router.replace("/");
    }
  }, [isInitializing, accessToken, router]);

  if (isInitializing) return null;

  if (accessToken) return null;

  return <>{children}</>;
}
