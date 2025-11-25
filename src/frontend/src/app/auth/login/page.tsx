"use client";

import { LoginForm } from "@frontend/components/auth-forms/login-form";
import PublicRoute from "@frontend/components/public-route";
import { useAuthStore } from "@frontend/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {

  const router = useRouter();
  const setToken = useAuthStore.getState().setToken;
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      setToken(token);       
      router.replace("/");
      return;
    }
    setChecked(true);
  }, [router, setToken]);

  if (!checked) return null;
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <PublicRoute>
          <LoginForm />
        </PublicRoute>
      </div>
    </div>
  );
}
