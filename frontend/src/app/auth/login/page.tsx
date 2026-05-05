"use client";

import { LoginForm } from "@frontend/components/auth-forms/login-form";
import PublicRoute from "@frontend/components/public-route";

export default function LoginPage() {
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
