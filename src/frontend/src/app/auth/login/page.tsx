"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@frontend/components/login-form";
import api from "@frontend/lib/axios";

export default function LoginPage() {
  const router = useRouter();

 const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

 if (token) {
   return null; 
 }
 
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      router.replace("/dashboard");
    }
  }, [router, token]);


  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
