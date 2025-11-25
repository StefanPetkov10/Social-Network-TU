"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/useAuthStore";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace("/");
      return;
    }

    setChecked(true);
  }, [token, router]);

  if (!checked) return null;

  return <>{children}</>;
}
