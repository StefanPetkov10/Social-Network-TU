"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { cn, getAxiosErrorMessage } from "@frontend/lib/utils";
import { Button } from "@frontend/components/ui/button";
import { Card, CardContent } from "@frontend/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@frontend/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@frontend/components/ui/input-otp";
import { useVerifyForgotPasswordOTP, useResendOTP } from "@frontend/hooks/use-auth";

export function OTPForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const verifyOTP = useVerifyForgotPasswordOTP();
  const resendOTP = useResendOTP();

  useEffect(() => {
    const token = sessionStorage.getItem("resetPasswordSessionToken");
    if (!token) {
      setErrorMessage("Session expired or invalid. Please try again.");
    } else {
      setSessionToken(token);
    }
  }, [router]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sessionToken) {
      setErrorMessage("Session token missing. Please request a new reset link.");
      return;
    }

    if (otp.length !== 6) {
      setErrorMessage("Please enter a 6-digit code.");
      return;
    }

    verifyOTP.mutate(
      { sessionToken, code: otp },
      {
        onSuccess: () => {
          router.push("/auth/reset-password");
        },
        onError: (err) => setErrorMessage(getAxiosErrorMessage(err)),
      }
    );
  };

  const handleResend = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!sessionToken) {
      setErrorMessage("Session token missing. Please request a new reset link.");
      return;
    }

    resendOTP.mutate(
      { sessionToken },
      {
        onSuccess: () => setSuccessMessage("A new code has been sent to your email."),
        onError: (err) => setErrorMessage(getAxiosErrorMessage(err)),
      }
    );
  };

  return (
    <div className={cn("flex flex-col gap-6 md:min-h-[450px]", className)} {...props}>
      <Card className="flex-1 overflow-hidden p-0">
        <CardContent className="grid flex-1 p-0 md:grid-cols-2">
          <form onSubmit={handleVerify} className="flex flex-col items-center justify-center p-6 md:p-8">
            <FieldGroup>
              <Field className="items-center text-center mb-4">
                <h1 className="text-2xl font-bold">Enter Verification Code</h1>
                <p className="text-muted-foreground text-sm">
                  We sent a 6-digit code to your email
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="otp" className="sr-only">Verification code</FieldLabel>
                <InputOTP
                  id="otp"
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  containerClassName="gap-4"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription className="text-center">
                  Enter the 6-digit code sent to your email.
                </FieldDescription>
              </Field>

              {errorMessage && (
                <p role="alert" className="text-red-600 text-sm text-center mt-2">{errorMessage}</p>
              )}
              
              {successMessage && (
                <p className="text-green-600 text-sm text-center mt-2">{successMessage}</p>
              )}

              <Field className="mt-4">
                <Button type="submit" disabled={verifyOTP.isPending || !sessionToken}>
                  {verifyOTP.isPending ? "Verifying..." : "Verify"}
                </Button>
                <FieldDescription className="text-center mt-2">
                  Didn't receive the code?{' '}
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResend}
                    disabled={resendOTP.isPending || !sessionToken}
                    className="text-primary underline p-0 h-auto"
                  >
                    {resendOTP.isPending ? "Sending..." : "Resend"}
                  </Button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block w-full h-full">
            <Image
              src="/TU-images/tu-icon.png"
              alt="Illustration"
              fill
              className="object-contain object-center bg-white"
              priority
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="text-center mt-2 text-sm">
        By clicking continue, you agree to our <a href="#" className="underline text-primary">Terms of Service</a> and <a href="#" className="underline text-primary">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}