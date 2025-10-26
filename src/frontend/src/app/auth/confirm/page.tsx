"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@frontend/components/ui/button";
import { Card, CardContent } from "@frontend/components/ui/card";
import { cn } from "@frontend/lib/utils";
import axios from "axios";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!userId || !token) {
      setMessage("Invalid confirmation link.");
      setLoading(false);
      return;
    }

    const confirmEmail = async () => {
      try {
        const { data } = await axios.get("/api/Auth/confirmemail", {
          params: { userId, token },
        });
        setSuccess(true);
        setMessage(data.message || "Email successfully confirmed.");
      } catch (err: any) {
        setSuccess(false);
        if (err.response?.data?.errors) {
          setMessage(err.response.data.errors.join("; "));
        } else if (err.response?.data?.message) {
          setMessage(err.response.data.message);
        } else {
          setMessage("Something went wrong.");
        }
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [userId, token]);

  const handleLoginRedirect = () => router.push("/auth/login");
  const handleResendLink = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await axios.post("/api/Auth/resend-confirmation", { email: userId });
      setMessage("A new confirmation link has been sent.");
      setSuccess(true);
    } catch {
      setMessage("Failed to resend link.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("p-8 max-w-xl mx-auto")}>
      <Card>
        <CardContent className="text-center">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <h1 className="text-2xl font-bold">
                {success ? "Email Confirmed" : "Confirmation Failed"}
              </h1>
              {message && <p className="mt-4">{message}</p>}

              <div className="mt-6 flex flex-col gap-2">
                {success ? (
                  <Button onClick={handleLoginRedirect}>Go to Login</Button>
                ) : (
                  <Button variant="outline" onClick={handleResendLink}>
                    Resend Confirmation Link
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
