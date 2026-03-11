"use client";

import { useEffect } from "react";
import api, { refreshAuthToken } from "@frontend/lib/axios";
import { useAuthStore } from "@frontend/stores/useAuthStore";

export function AuthInitializer() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
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

  return null;
}
