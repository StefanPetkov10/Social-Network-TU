"use client";

import { useState, useEffect, FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner"; 

import { cn, getAxiosErrorMessage } from "@frontend/lib/utils";
import { Button } from "@frontend/components/ui/button";
import { Card, CardContent } from "@frontend/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@frontend/components/ui/field";
import { Input } from "@frontend/components/ui/input";
import { useResetPassword } from "@frontend/hooks/use-auth";

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const resetPassword = useResetPassword();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("resetPasswordSessionToken");
    if (!token) {
      toast.error("Session expired", {
        description: "Please request a new password reset link.",
      });
    } else {
      setSessionToken(token);
    }
  }, [router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sessionToken) {
      toast.error("Error", { description: "Missing session token." });
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    resetPassword.mutate(
      {
        sessionToken,
        newPassword,
        confirmNewPassword: confirmPassword,
      },
      {
        onError: (err) => {
          setErrorMessage(getAxiosErrorMessage(err));
        },
        onSuccess: () => {
          sessionStorage.removeItem("resetPasswordSessionToken");
          toast.success("Password updated successfully!", {
            description: "You can now login with your new password.",
            duration: 5000,
          });
          router.push("/auth/login");
        },
      }
    );
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <h1 className="text-2xl font-bold">Reset Password</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your new password below
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Field>

              {errorMessage && (
                <p className="text-red-600 text-sm text-center mt-2">{errorMessage}</p>
              )}

              <Field className="mt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={resetPassword.isPending || !sessionToken}
                >
                  {resetPassword.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </Field>

              <FieldDescription className="text-center mt-4">
                 <a href="/auth/login" className="text-primary hover:underline">
                  Back to Login
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block w-full h-full min-h-[400px]">
            <Image
              src="/TU-images/tu-icon.png"
              alt="Technical University Logo"
              fill
              className="object-contain object-center bg-white"
              priority
            />
          </div>
          
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="#terms" className="text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#privacy" className="text-primary">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}