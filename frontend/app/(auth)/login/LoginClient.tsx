"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogIn, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRecaptcha } from "@/components/providers/RecaptchaProvider";

export default function LoginClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const { executeRecaptcha } = useRecaptcha();

    const { login } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/'
    });

    const {
        register,
        handleSubmit,
        formState: { errors: formErrors },
    } = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setErrors([]);

        // Execute reCAPTCHA
        const recaptchaToken = await executeRecaptcha("login");

        await login({
            setErrors,
            setStatus,
            ...data,
            recaptcha_token: recaptchaToken
        });
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-[var(--accent)] rounded-xl flex items-center justify-center mx-auto mb-4">
                            <LogIn className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            Sign in to continue to TechPlay
                        </p>
                    </div>

                    {/* API Errors */}
                    {errors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <ul className="text-sm text-red-500 list-disc list-inside">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Status Message */}
                    {status && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">
                            {status}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            {...register("email", { required: "Email is required" })}
                            error={formErrors.email?.message as string}
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            {...register("password", { required: "Password is required" })}
                            error={formErrors.password?.message as string}
                        />

                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-[var(--accent)] hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* reCAPTCHA Notice */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                        <Shield className="w-3 h-3" />
                        Protected by reCAPTCHA
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                        Don't have an account?{" "}
                        <Link
                            href="/register"
                            className="text-[var(--accent)] font-medium hover:underline"
                        >
                            Create one
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
