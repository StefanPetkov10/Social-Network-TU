import React from "react";
import { OTPForm } from "@frontend/components/auth-forms/otp-form";

export default function ForgotPasswordPage() {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
                <p className="mb-4">Please enter your email address to receive a password reset link.</p>
                <OTPForm />
            </div>
        </div>
    );
}   