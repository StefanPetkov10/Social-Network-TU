"use client";

import { useEffect } from "react";
import { initAuthInterceptor } from "../../stores/useAuthStore";

export function AuthInitializer() {
  useEffect(() => {
    const unsubscribe = initAuthInterceptor();
    return () => unsubscribe();
  }, []);

  return null;
}
