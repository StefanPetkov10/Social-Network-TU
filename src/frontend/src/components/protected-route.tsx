"use client";
import { useUser } from "@frontend/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isError) {
      router.push("/auth/login");
    }
  }, [isError, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <p>Loading...</p>
    </div>;
  }

  if (isError) {
    console.log("User not authenticated, redirecting to login.");
    console.log("isError:", isError);
    return null;
  }

  return <>{children}</>;
}
