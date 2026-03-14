"use client";

import { useEffect } from "react";
import { refreshAuthToken } from "@frontend/lib/axios";
import { useAuthStore } from "@frontend/stores/useAuthStore";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    if (accessToken) {
      setInitializing(false);
      return;
    }

    refreshAuthToken()
      .catch(() => {
      })
      .finally(() => {
        setInitializing(false);
      });
  }, [accessToken, setInitializing]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-gray-500">Зареждане...</p>
      </div>
    );
  }

  return <>{children}</>;
}