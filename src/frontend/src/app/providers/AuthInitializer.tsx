"use client";

import { useEffect } from "react";
import { initAuthInterceptor } from "../../store/authStore";

export function AuthInitializer() {
  useEffect(() => {
    const unsubscribe = initAuthInterceptor();
    return () => unsubscribe();
  }, []);

  return null;
}
