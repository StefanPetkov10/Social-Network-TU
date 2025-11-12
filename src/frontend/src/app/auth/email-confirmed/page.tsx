"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useConfirmEmail } from "@frontend/hooks/use-auth";
import { getAxiosErrorMessage } from "@frontend/lib/utils";
import { useRegistrationStore } from "@frontend/store/useRegistrationStore";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmEmail = useConfirmEmail();

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);

  const setRegistrationInProgress = useRegistrationStore((state) => state.setRegistrationInProgress);
  const registrationInProgress = useRegistrationStore((state) => state.registrationInProgress);

  useEffect(() => {
    if (!registrationInProgress) {
      router.replace("/auth/login");
    } else {
      setAccessChecked(true);
    }
  }, [registrationInProgress, router]);

  useEffect(() => {
    if (!accessChecked) return;

    if (!userId || !token) {
      setError("Invalid confirmation link. Missing parameters.");
      setProcessing(false);
      return;
    }

    confirmEmail.mutate({ userId, token }, {
      onSuccess: () => {
        setConfirmed(true);
        setProcessing(false);
        localStorage.removeItem("pendingConfirmationEmail");
        setRegistrationInProgress(false);
      },
      onError: (error: any) => {
        const errorMsg = getAxiosErrorMessage(error);
        if (errorMsg.includes("Network Error") || errorMsg.includes("Failed to fetch")) {
          setError("Cannot connect to server. Please check your internet connection and try again.");
        } else if (errorMsg.includes("CORS") || errorMsg.includes("Origin")) {
          setError("Connection issue. Please try again or contact support.");
        } else {
          setError(errorMsg);
        }
        setProcessing(false);
      },
    });
  }, [accessChecked, userId, token, confirmEmail, setRegistrationInProgress]);

  const handleRetry = () => {
    setProcessing(true);
    setError("");
    window.location.reload();
  };

  const handleLogin = () => router.push("/auth/login");
  const handleGoToResend = () => router.push("/auth/confirmation-sent");
  const handleGoToHome = () => router.push("/");

  if (!accessChecked) {
    return <div className="p-8 max-w-xl mx-auto text-center">Loading...</div>;
  }

  if (processing) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card>
          <CardContent className="text-center p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold">Confirming Your Email</h1>
              <p className="text-muted-foreground">Please wait while we verify your email address...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card>
          <CardContent className="text-center p-6">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Confirmation Failed</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleRetry} variant="outline">Try Again</Button>
              <Button onClick={handleGoToResend} variant="outline">Get New Confirmation Link</Button>
              <Button onClick={handleGoToHome} variant="ghost">Go to Homepage</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Card>
        <CardContent className="text-center p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Email Confirmed!</h1>
            <p className="text-muted-foreground">
              Your email has been successfully verified
            </p>
          </div>

          <p className="mb-6">
            Your account is now active. You can sign in and start using our services.
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={handleLogin} className="w-full" size="lg">Continue to Login</Button>
            <Button onClick={handleGoToHome} variant="outline">Go to Homepage</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
