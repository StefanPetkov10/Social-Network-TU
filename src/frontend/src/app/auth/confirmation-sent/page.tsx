    "use client";

    import React, { useEffect, useState } from "react";
    import { useRouter } from "next/navigation";
    import { Card, CardContent } from "@frontend/components/ui/card";
    import { Button } from "@frontend/components/ui/button";
    import { Input } from "@frontend/components/ui/input";
    import { useResendConfirmation } from "@frontend/hooks/use-auth";
    import { getAxiosErrorMessage } from "@frontend/lib/utils";

    export default function ConfirmationSentPage() {
      const router = useRouter();
      const resendConfirmation = useResendConfirmation();      
      const [savedEmail, setSavedEmail] = useState("");
      const [manualEmail, setManualEmail] = useState("");
      const [message, setMessage] = useState("");
      const [accessChecked, setAccessChecked] = useState(false);

      useEffect(() => {
        const storedProgress = localStorage.getItem("registrationInProgress") === "true";
            
        if (!storedProgress) {
          router.replace("/auth/login");
        } else {
          setAccessChecked(true);
        }
      }, [router]);

      useEffect(() => {
        const emailFromStorage = localStorage.getItem("pendingConfirmationEmail") || "";
        setSavedEmail(emailFromStorage);
        setManualEmail(emailFromStorage);
      }, []);

      const handleResend = async (emailToUse: string) => {
        if (!emailToUse) {
          setMessage("Please enter your email address.");
          return;
        }
        
        resendConfirmation.mutate({ email: emailToUse }, {
          onSuccess: () => {
            setMessage("Confirmation email resent successfully!");
            if (!savedEmail) {
              localStorage.setItem("pendingConfirmationEmail", emailToUse);
              setSavedEmail(emailToUse);
            }
          },
          onError: (error: any) => {
            setMessage(getAxiosErrorMessage(error) || "Failed to resend confirmation email.");
          }
        });
      };

      const handleDirectResend = () => {
        handleResend(savedEmail);
      };

      const handleManualResend = () => {
        handleResend(manualEmail);
      };

      if (!accessChecked) {
      return <div className="p-8 max-w-xl mx-auto text-center">Loading...</div>;
      }

      return (
        <div className="p-8 max-w-xl mx-auto">
          <Card>
            <CardContent className="text-center p-6">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
                <p className="text-muted-foreground mb-4">
                  {savedEmail ? (
                    <>We've sent a confirmation link to <strong>{savedEmail}</strong></>
                  ) : (
                    <>We've sent a confirmation link to your email</>
                  )}
                </p>
              </div>

              <p className="mb-6 text-sm">
                Click the confirmation link in the email to activate your account. 
                The link will expire in 24 hours.
              </p>

              {message && (
                <div className={`p-3 rounded-md mb-4 ${
                  message.includes("successfully") 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {message}
                </div>
              )}

              <div className="flex flex-col gap-3 mb-4">
                {/* Ако ИМА запазен имейл - показваме САМО бутона за директен ресенд */}
                {savedEmail ? (
                  <Button 
                    onClick={handleDirectResend}
                    variant="outline"
                    disabled={resendConfirmation.isPending}
                  >
                    {resendConfirmation.isPending ? "Sending..." : "Resend Confirmation Email"}
                  </Button>
                ) : (
                  /* Ако НЯМА запазен имейл - показваме ръчно въвеждане */
                  <div className="space-y-3">
                    <div className="text-left">
                      <label htmlFor="email" className="text-sm font-medium mb-1 block">
                        Enter your registration email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter the email you used for registration"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be the same email you used during registration
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleManualResend}
                      disabled={resendConfirmation.isPending}
                      className="w-full"
                    >
                      {resendConfirmation.isPending ? "Sending..." : "Resend Confirmation"}
                    </Button>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => router.push("/auth/login")}
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>

              <div className="mt-6 p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the email?
                </p>
                <ul className="text-sm text-muted-foreground text-left space-y-1">
                  <li>• Check your spam folder</li>
                  <li>• Verify you entered the correct email address</li>
                  <li>• Wait a few minutes and try again</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }