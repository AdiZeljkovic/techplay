"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Shield, Mail, RefreshCw, ChevronsRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Turnstile from "@/components/ui/Turnstile";
import axios from "@/lib/axios";
import BrandPanel from "@/components/auth/BrandPanel";

/**
 * The strip along the foot of the brand panel.
 *
 * Marketing copy, and only the login page makes these claims — BrandPanel
 * takes it as a prop so nothing else inherits numbers it cannot show its
 * working for.
 */
const LOGIN_FOOTNOTE = (
    <>
        <span><span className="text-white">15K+</span> MEMBERS</span>
        <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
        <span><span className="text-white">50K+</span> GAMES</span>
        <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
        <span><span className="text-white">24/7</span> COMMUNITY</span>
    </>
);

const inputClass = "w-full h-[48px] bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-card)] px-4 text-[14px] text-[var(--ink-hi)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]/60 transition-colors";
const labelClass = "block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-low)] mb-2";

export default function LoginClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    // The check can fail on a blocker, a proxy or a flaky network, and
    // when it does the button below simply stops working. This is what
    // tells the reader why.
    const [captchaFailed, setCaptchaFailed] = useState(false);
    const [requiresVerification, setRequiresVerification] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [passwordWasReset, setPasswordWasReset] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('verification_required') === 'true') {
            const email = searchParams.get('email');
            if (email) {
                setRequiresVerification(email);
            }
        }

        // Arriving straight from a completed password reset.
        if (searchParams.get('reset') === '1') {
            setPasswordWasReset(true);
        }

        // Handle Discord OAuth errors
        const error = searchParams.get('error');
        if (error) {
            setErrors([error === 'oauth_failed' ? 'That sign-in did not complete. Please try again.' : decodeURIComponent(error)]);
        }
    }, [searchParams]);

    /**
     * Where to land after signing in.
     *
     * The gates around the site send people here with the page they wanted
     * attached, so signing in finishes the trip instead of dropping them on the
     * homepage. Only site-relative paths are honoured: a `//host` value is a
     * path to the browser and an open redirect to everyone else.
     */
    const wanted = searchParams.get('redirect');
    const afterLogin = wanted && wanted.startsWith('/') && !wanted.startsWith('//') ? wanted : '/';

    const { login } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: afterLogin
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
        setCaptchaFailed(true);
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
            await axios.post('/email/resend-public', { email: requiresVerification });
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
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="relative overflow-hidden bg-[var(--surface-1)] border border-[var(--line)] rounded-[24px] p-8 text-center shadow-[0_20px_48px_rgba(0,0,0,0.6)]">
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />
                        <div className="absolute -top-[80px] left-1/2 -translate-x-1/2 w-[250px] h-[180px] bg-[var(--accent)]/10 blur-[70px] rounded-full pointer-events-none" />

                        <div className="relative w-16 h-16 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-[var(--radius-panel)] flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-7 h-7 text-[var(--accent)]" />
                        </div>

                        <span className="text-[var(--accent)] font-bold tracking-[0.2em] text-[10px] uppercase block mb-2">ONE MORE STEP</span>
                        <h1 className="font-display text-[24px] font-bold text-[var(--ink-hi)] uppercase tracking-[0.04em] mb-3">
                            Verify Your Email
                        </h1>

                        <p className="text-[14px] text-[var(--ink-mid)] leading-relaxed mb-6">
                            We've sent a verification link to{" "}
                            <span className="text-[var(--accent)] font-bold">{requiresVerification}</span>.
                            Check your inbox and click the link to activate your account.
                        </p>

                        {resendSuccess && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-[var(--radius-card)] text-sm text-[var(--success)]">
                                Verification email sent! Check your inbox.
                            </div>
                        )}

                        {errors.length > 0 && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-card)]">
                                <ul className="text-sm text-[var(--danger)] list-disc list-inside">
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="w-full h-[48px] border border-[var(--line)] text-[var(--ink-mid)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] font-bold rounded-[var(--radius-card)] transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center gap-2 disabled:opacity-50 mb-6"
                        >
                            <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
                            {isResending ? "Sending..." : "Resend Verification Email"}
                        </button>

                        <p className="text-[12px] text-[var(--ink-low)] mb-3">
                            Didn't receive the email? Check your spam folder or click above to resend.
                        </p>

                        <button
                            onClick={() => setRequiresVerification(null)}
                            className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="relative w-full max-w-[1000px] grid lg:grid-cols-2 rounded-[var(--radius-panel)] overflow-hidden border border-[var(--line)] shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-[var(--surface-1)]">
                    <span aria-hidden className="absolute top-0 left-8 right-8 h-[2px] z-10 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

                <BrandPanel footnote={LOGIN_FOOTNOTE} />

                {/* Form side */}
                <div className="relative p-8 md:p-10 lg:p-12">
                    {/* Mobile mini-logo */}
                    <Link href="/" className="lg:hidden flex items-center mb-8 w-max" aria-label="TechPlay — home">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/techplay-logo.png" alt="TechPlay" width={144} height={24} className="h-[24px] w-auto" />
                    </Link>

                    <div className="mb-8">
                        <span className="text-[var(--accent)] font-bold tracking-[0.2em] text-[10px] uppercase block mb-2">PLAYER 1 — READY?</span>
                        <h1 className="font-display text-[28px] font-bold text-[var(--ink-hi)] uppercase tracking-[0.03em] leading-tight mb-2">
                            Welcome <span className="text-[var(--accent)]">Back</span>
                        </h1>
                        <p className="text-[13px] text-[var(--ink-mid)]">
                            Insert credentials to continue.
                        </p>
                    </div>

                    {passwordWasReset && (
                        <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-[var(--radius-card)] text-sm text-[var(--success)]">
                            Your password has been reset. Sign in with the new one.
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-card)]">
                            <ul className="text-sm text-[var(--danger)] list-disc list-inside">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {status && (
                        <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-[var(--radius-card)] text-sm text-[var(--success)]">
                            {status}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className={inputClass}
                                {...register("email", { required: "Email is required" })}
                            />
                            {formErrors.email && <p className="text-[var(--danger)] text-xs mt-1.5">{formErrors.email.message as string}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={`${labelClass} mb-0`}>Password</label>
                                <Link href="/forgot-password" className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className={inputClass}
                                {...register("password", { required: "Password is required" })}
                            />
                            {formErrors.password && <p className="text-[var(--danger)] text-xs mt-1.5">{formErrors.password.message as string}</p>}
                        </div>

                        <Turnstile
                            onVerify={handleTurnstileVerify}
                            onError={handleTurnstileError}
                        />

                        {captchaFailed && (
                            <p className="text-[12.5px] text-[var(--danger)] leading-snug">
                                The security check could not load, so we cannot let you
                                sign in yet. Reload the page, and if it keeps happening try
                                turning off a blocker for this site.{" "}
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="font-bold underline underline-offset-2 hover:brightness-110"
                                >
                                    Reload
                                </button>
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_ENABLED !== 'false')}
                            className="btn-command group w-full h-[52px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-colors uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Signing in..." : (
                                <>
                                    Press Start
                                    <ChevronsRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="relative py-1">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-[var(--line)]" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-[var(--surface-1)] px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="h-[48px] rounded-[var(--radius-card)] border border-[var(--line)] text-[var(--ink-mid)] hover:border-[#5865F2] hover:text-[#5865F2] hover:bg-[#5865F2]/5 font-bold text-[12px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/discord/redirect`}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
                                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c.12-23.61-4.38-47.56-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                                </svg>
                                Discord
                            </button>

                            <button
                                type="button"
                                className="h-[48px] rounded-[var(--radius-card)] border border-[var(--line)] text-[var(--ink-mid)] hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/5 font-bold text-[12px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/battlenet/redirect?region=eu`}
                            >
                                <Shield className="w-4 h-4" />
                                Battle.net
                            </button>
                        </div>
                    </form>

                    <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-[var(--ink-faint)] font-bold uppercase tracking-wider">
                        <Shield className="w-3 h-3" />
                        Protected by Cloudflare Turnstile
                    </div>

                    <div className="mt-7 pt-6 border-t border-[var(--line)] text-center">
                        <span className="text-[13px] text-[var(--ink-mid)]">New player? </span>
                        <Link href="/register" className="text-[12px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                            Create your account →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
