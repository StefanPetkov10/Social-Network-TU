"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, Lock, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";

import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@frontend/components/ui/card";
import { Separator } from "@frontend/components/ui/separator";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@frontend/components/ui/form";

import { MainLayout } from "@frontend/components/main-layout";
import ProtectedRoute from "@frontend/components/protected-route";

import { useProfile, useChangePassword } from "@frontend/hooks/use-profile";
import { useForgotPasswordOtp } from "@frontend/hooks/use-auth";
import { useAuthStore } from "@frontend/stores/useAuthStore";
import { getAxiosErrorMessage, getUserDisplayName } from "@frontend/lib/utils";
import { LoadingScreen } from "@frontend/components/common/loading-screen";

function getEmailFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.email || decoded.Email || null;
    } catch {
        return null;
    }
}

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Моля, въведете текущата парола."),
    newPassword: z.string()
        .min(8, "Минимум 8 символа.")
        .regex(/[A-Z]/, "Трябва да съдържа главна буква.")
        .regex(/[a-z]/, "Трябва да съдържа малка буква.")
        .regex(/[^a-zA-Z0-9]/, "Трябва да съдържа специален символ."),
    confirmNewPassword: z.string().min(1, "Моля, потвърдете новата парола."),
}).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "Паролите не съвпадат.",
    path: ["confirmNewPassword"],
}).refine(data => data.newPassword !== data.currentPassword, {
    message: "Новата парола трябва да е различна от текущата.",
    path: ["newPassword"],
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
    const router = useRouter();

    const { data: profile, isLoading: isProfileLoading } = useProfile();
    const { mutate: changePassword, isPending } = useChangePassword();
    const { mutate: forgotPasswordOtp, isPending: isForgotPending } = useForgotPasswordOtp();
    const token = useAuthStore((s) => s.token);
    const userEmail = useMemo(() => getEmailFromToken(token), [token]);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [forgotSent, setForgotSent] = useState(false);

    const form = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    const onSubmit = (data: ChangePasswordValues) => {
        setApiError(null);
        setSuccessMessage(null);

        changePassword(data, {
            onSuccess: () => {
                setSuccessMessage("Паролата е променена успешно!");
                form.reset();
                setTimeout(() => {
                    router.push("/profile");
                }, 2_000);
            },
            onError: (error: any) => {
                setApiError(getAxiosErrorMessage(error) || "Грешка при смяна на паролата.");
            },
        });
    };

    const handleForgotPassword = () => {
        if (!userEmail) return;

        setApiError(null);
        forgotPasswordOtp(
            { email: userEmail },
            {
                onSuccess: (response) => {
                    const sessionToken = response?.data?.sessionToken;
                    if (sessionToken) {
                        sessionStorage.setItem("resetPasswordSessionToken", sessionToken);
                    }
                    sessionStorage.setItem("passwordChangeFlow", "true");
                    setForgotSent(true);
                    setTimeout(() => {
                        router.push("/auth/forgot-password-otp");
                    }, 1_500);
                },
                onError: (error: any) => {
                    setApiError(getAxiosErrorMessage(error) || "Грешка при изпращане на кода.");
                },
            }
        );
    };

    if (isProfileLoading) return <LoadingScreen />;

    const displayName = profile ? getUserDisplayName(profile) : "";
    const userForLayout = {
        name: displayName,
        avatar: profile?.authorAvatar || "",
    };

    return (
        <ProtectedRoute>
            <MainLayout user={userForLayout}>
                <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-5 pb-10 px-4">
                    <div className="w-full max-w-md">

                        <Button
                            variant="ghost"
                            onClick={() => router.push("/profile")}
                            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Обратно към профила
                        </Button>

                        <Card className="shadow-xl border-0 bg-background rounded-2xl overflow-hidden">
                            <CardHeader className="text-center pb-2 pt-8 px-8">
                                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                                    <ShieldCheck className="h-8 w-8 text-white" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Смяна на парола</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Въведете текущата и новата парола, за да я промените.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="px-8 pb-8">
                                {successMessage && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium text-center animate-in fade-in zoom-in duration-300">
                                        ✅ {successMessage}
                                    </div>
                                )}

                                {apiError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center animate-in fade-in zoom-in duration-300" role="alert">
                                        {apiError}
                                    </div>
                                )}

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                                        <FormField
                                            control={form.control}
                                            name="currentPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold text-foreground/80">
                                                        Текуща парола
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type={showCurrentPassword ? "text" : "password"}
                                                                placeholder="Въведете текущата парола"
                                                                className="pl-10 pr-10 h-11 rounded-xl"
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                                tabIndex={-1}
                                                            >
                                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <Separator />

                                        <FormField
                                            control={form.control}
                                            name="newPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold text-foreground/80">
                                                        Нова парола
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type={showNewPassword ? "text" : "password"}
                                                                placeholder="Въведете новата парола"
                                                                className="pl-10 pr-10 h-11 rounded-xl"
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                                tabIndex={-1}
                                                            >
                                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5 pl-1">
                                                        <p>• Минимум 8 символа</p>
                                                        <p>• Главна и малка буква</p>
                                                        <p>• Специален символ (!@#$%...)</p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="confirmNewPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold text-foreground/80">
                                                        Потвърдете новата парола
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                placeholder="Повторете новата парола"
                                                                className="pl-10 pr-10 h-11 rounded-xl"
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                                tabIndex={-1}
                                                            >
                                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full h-11 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                                            disabled={isPending}
                                        >
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Промяна...
                                                </>
                                            ) : "Промени паролата"}
                                        </Button>
                                    </form>
                                </Form>

                                <Separator className="my-6" />

                                <div className="text-center space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Не помните текущата си парола?
                                    </p>

                                    {forgotSent ? (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-medium animate-in fade-in zoom-in duration-300">
                                            📧 Код за верификация е изпратен на {userEmail}. Пренасочване...
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={handleForgotPassword}
                                            disabled={isForgotPending || !userEmail}
                                            className="w-full h-auto py-2.5 rounded-xl border-dashed flex flex-col items-center gap-1"
                                        >
                                            {isForgotPending ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Изпращане...
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="flex items-center gap-2 font-medium">
                                                        <Lock className="h-4 w-4" />
                                                        Забравена парола?
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-normal">
                                                        Получете код на {userEmail}
                                                    </span>
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </MainLayout>
        </ProtectedRoute>
    );
}
