"use client";

import { useEffect, useRef } from "react";
import { refreshAuthToken } from "@frontend/lib/axios";
import { useAuthStore } from "@frontend/stores/useAuthStore";
import { LoadingScreen } from "@frontend/components/common/loading-screen";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const setInitializing = useAuthStore((s) => s.setInitializing);
  const hasAttemptedInit = useRef(false);

  useEffect(() => {
    if (hasAttemptedInit.current) return;
    hasAttemptedInit.current = true;

    const currentToken = useAuthStore.getState().accessToken;
    
    if (currentToken) {
      setInitializing(false);
      return;
    }

    refreshAuthToken()
      .catch(() => {
      })
      .finally(() => {
        setInitializing(false);
      });
  }, [setInitializing]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingScreen />;
      </div>
    );
  }

  return <>{children}</>;
}