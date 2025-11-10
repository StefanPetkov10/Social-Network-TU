"use client";
import { useEffect } from "react";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Card, CardContent } from "@frontend/components/ui/card";
import { useLogin } from "@frontend/hooks/use-auth";
import { useAuthStore } from "@frontend/store/authStore";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const login = useLogin();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      setErrorMessage("Please fill in both fields.");
      return;
    }

    login.mutate(
      { Identifier: identifier, Password: password },
      {
        onSuccess: () => {
          setErrorMessage(null);
        },
        onError: (err: any) => {
          setErrorMessage(err.message || "Login failed.");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <h2 className="text-center font-bold text-2xl mb-4">Login</h2>
            <Input
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorMessage && (
              <p className="text-red-600 text-sm mt-2 text-center">
                {errorMessage}
              </p>
            )}
            <Button className="w-full mt-4" type="submit" disabled={login.isPending}>
              {login.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
