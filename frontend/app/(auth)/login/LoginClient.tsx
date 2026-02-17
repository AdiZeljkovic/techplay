"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogIn, Shield, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Turnstile from "@/components/ui/Turnstile";
import axios from "@/lib/axios";

export default function LoginClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [requiresVerification, setRequiresVerification] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('verification_required') === 'true') {
            const email = searchParams.get('email');
            if (email) {
                setRequiresVerification(email);
            }
        }

        // Handle Discord OAuth errors
        const error = searchParams.get('error');
        if (error) {
            setErrors([decodeURIComponent(error)]);
        }
    }, [searchParams]);

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

    const handleTurnstileVerify = useCallback((token: string) => {
        setTurnstileToken(token);
    }, []);

    const handleTurnstileError = useCallback(() => {
        setTurnstileToken(null);
        setErrors(["Security verification failed. Please refresh the page."]);
    }, []);

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setErrors([]);
        setResendSuccess(false);

        await login({
            setErrors,
            setStatus,
            setRequiresVerification,
            ...data,
            recaptcha_token: turnstileToken
        });

        setIsLoading(false);
    };

    const handleResendVerification = async () => {
        if (!requiresVerification) return;

        setIsResending(true);
        setResendSuccess(false);

        try {
            await axios.post('/auth/email/resend', { email: requiresVerification });
            setResendSuccess(true);
        } catch (error: any) {
            setErrors([error.response?.data?.message || 'Failed to resend verification email.']);
        } finally {
            setIsResending(false);
        }
    };

    // Show verification required screen
    if (requiresVerification) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 text-center">
                        {/* Icon */}
                        <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-[var(--accent)]" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                            Verify Your Email
                        </h1>

                        {/* Message */}
                        <p className="text-[var(--text-secondary)] mb-6">
                            We've sent a verification link to{" "}
                            <span className="text-[var(--accent)] font-medium">{requiresVerification}</span>.
                            Please check your inbox and click the link to verify your account.
                        </p>

                        {/* Resend Success */}
                        {resendSuccess && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">
                                Verification email sent! Check your inbox.
                            </div>
                        )}

                        {/* Errors */}
                        {errors.length > 0 && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <ul className="text-sm text-red-500 list-disc list-inside">
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Resend Button */}
                        <Button
                            onClick={handleResendVerification}
                            variant="outline"
                            className="w-full mb-4"
                            isLoading={isResending}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Resend Verification Email
                        </Button>

                        {/* Divider */}
                        <div className="border-t border-[var(--border)] my-6" />

                        {/* Back to Login */}
                        <p className="text-sm text-[var(--text-muted)] mb-3">
                            Didn't receive the email? Check your spam folder or click above to resend.
                        </p>

                        <button
                            onClick={() => setRequiresVerification(null)}
                            className="text-sm text-[var(--accent)] hover:underline"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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

                        {/* Turnstile Widget */}
                        <Turnstile
                            onVerify={handleTurnstileVerify}
                            onError={handleTurnstileError}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                            disabled={!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_ENABLED !== 'false'}
                        >
                            Sign In
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-[var(--border)]" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[var(--bg-card)] px-2 text-[var(--text-muted)]">
                                    Or
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full relative hover:bg-[#5865F2]/10 hover:border-[#5865F2] hover:text-[#5865F2] transition-colors"
                            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/discord/redirect`}
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 127.14 96.36" fill="currentColor">
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c.12-23.61-4.38-47.56-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                            </svg>
                            Continue with Discord
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full relative hover:bg-blue-600/10 hover:border-blue-600 hover:text-blue-600 transition-colors mt-3"
                            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/battlenet/redirect?region=eu`}
                        >
                            <Shield className="w-5 h-5 mr-2" />
                            Continue with Battle.net
                        </Button>
                    </form>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                        <Shield className="w-3 h-3" />
                        Protected by Cloudflare Turnstile
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

