"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Gamepad2, Shield, Check, X, Zap, Trophy, MessageSquare, Gift, ChevronsRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Turnstile from "@/components/ui/Turnstile";

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One number", test: (p) => /[0-9]/.test(p) },
    { label: "One special character (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const PERKS = [
    { icon: Zap,           text: "Earn XP for every comment and article you read" },
    { icon: Trophy,        text: "Level up and unlock community ranks" },
    { icon: MessageSquare, text: "Join discussions on the forum" },
    { icon: Gift,          text: "Enter exclusive giveaways" },
];

const inputClass = "w-full h-[48px] bg-zinc-50 dark:bg-[#05070A] border border-zinc-200 dark:border-[#161B22] rounded-lg px-4 text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525B] focus:outline-none focus:border-tp-accent/60 transition-colors";
const labelClass = "block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-[#71717A] mb-2";

const STRENGTH_LABELS = ["WEAK", "WEAK", "OK", "GOOD", "STRONG", "MAX"];
const STRENGTH_COLORS = ["bg-red-500", "bg-red-500", "bg-yellow-500", "bg-yellow-500", "bg-green-500", "bg-green-500"];

export default function RegisterClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const { register: registerAuth } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/verify-email'
    });

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors: formErrors },
    } = useForm({
        defaultValues: {
            username: "",
            email: "",
            password: "",
            password_confirmation: ""
        },
    });

    const password = watch("password", "");

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
        setSuccess(false);

        await registerAuth({
            setErrors,
            setSuccess,
            ...data,
            recaptcha_token: turnstileToken
        });
        setIsLoading(false);
    };

    const metCount = PASSWORD_REQUIREMENTS.filter(req => req.test(password)).length;
    const allRequirementsMet = metCount === PASSWORD_REQUIREMENTS.length;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-[1000px] grid lg:grid-cols-2 rounded-[24px] overflow-hidden border border-zinc-200 dark:border-[#161B22] shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0B0E14]">

                {/* ── Left: brand panel ── */}
                <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#05070A] overflow-hidden">
                    <div className="absolute -top-[120px] -left-[80px] w-[400px] h-[400px] bg-tp-accent/15 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-[150px] -right-[100px] w-[350px] h-[350px] bg-tp-accent/10 blur-[100px] rounded-full pointer-events-none" />
                    <div
                        className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.9) 1px, transparent 0)', backgroundSize: '28px 28px' }}
                    />
                    <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-tp-accent/40" />
                    <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-tp-accent/40" />

                    <Link href="/" className="relative z-10 flex items-center gap-3 group w-max">
                        <div className="w-10 h-10 bg-tp-accent rounded-lg flex items-center justify-center shadow-lg group-hover:bg-tp-accent-hover transition-colors">
                            <Gamepad2 className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-display font-bold text-[16px] text-white tracking-tight leading-none">TECHPLAY</span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mt-[3px]">GAMING PORTAL</span>
                        </div>
                    </Link>

                    <div className="relative z-10">
                        <span className="flex items-center gap-2 text-tp-accent font-bold tracking-[0.2em] text-[11px] uppercase mb-4">
                            <span className="w-2 h-2 rounded-full bg-tp-accent animate-pulse" />
                            NEW PLAYER
                        </span>
                        <h2 className="font-display text-[42px] font-black text-white uppercase leading-[0.95] tracking-tight mb-5">
                            START<br />
                            <span className="text-tp-accent">NEW GAME</span>
                        </h2>
                        <p className="text-[14px] text-[#A1A1AA] leading-relaxed max-w-[300px] mb-8">
                            Create your player profile and unlock everything TechPlay has to offer:
                        </p>

                        <ul className="flex flex-col gap-3.5">
                            {PERKS.map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-tp-accent" />
                                    </span>
                                    <span className="text-[13px] text-[#D4D4D8]">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative z-10 flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#71717A]">
                        <span><span className="text-white">15K+</span> MEMBERS</span>
                        <span className="w-1 h-1 rounded-full bg-tp-accent" />
                        <span><span className="text-white">50K+</span> GAMES</span>
                        <span className="w-1 h-1 rounded-full bg-tp-accent" />
                        <span><span className="text-white">FREE</span> FOREVER</span>
                    </div>
                </div>

                {/* ── Right: form ── */}
                <div className="relative p-8 md:p-10 lg:p-12">
                    {/* Mobile mini-logo */}
                    <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8 w-max">
                        <div className="w-9 h-9 bg-tp-accent rounded-lg flex items-center justify-center">
                            <Gamepad2 className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                        </div>
                        <span className="font-display font-bold text-[15px] text-zinc-900 dark:text-white tracking-tight">TECHPLAY</span>
                    </Link>

                    <div className="mb-8">
                        <span className="text-tp-accent font-bold tracking-[0.2em] text-[10px] uppercase block mb-2">CHARACTER CREATION</span>
                        <h1 className="font-display text-[28px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.03em] leading-tight mb-2">
                            Create Your <span className="text-tp-accent">Player</span>
                        </h1>
                        <p className="text-[13px] text-zinc-600 dark:text-[#A1A1AA]">
                            Set up your profile — it takes less than a minute.
                        </p>
                    </div>

                    {success && (
                        <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-sm text-green-500">
                                Registration successful! Please check your email to verify your account.
                            </p>
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <ul className="text-sm text-red-500 list-disc list-inside">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className={labelClass}>Username — your gamertag</label>
                            <input
                                placeholder="ProGamer2026"
                                className={inputClass}
                                {...register("username", {
                                    required: "Username is required",
                                    pattern: {
                                        value: /^[a-zA-Z0-9_-]+$/,
                                        message: "Only letters, numbers, underscores, and dashes"
                                    }
                                })}
                            />
                            {formErrors.username && <p className="text-red-500 text-xs mt-1.5">{formErrors.username.message as string}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className={inputClass}
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address"
                                    }
                                })}
                            />
                            {formErrors.email && <p className="text-red-500 text-xs mt-1.5">{formErrors.email.message as string}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className={inputClass}
                                {...register("password", {
                                    required: "Password is required",
                                    validate: () => allRequirementsMet || "Password doesn't meet all requirements"
                                })}
                            />
                            {formErrors.password && <p className="text-red-500 text-xs mt-1.5">{formErrors.password.message as string}</p>}

                            {/* Security level — gamified password strength */}
                            {password.length > 0 && (
                                <div className="mt-3 p-4 bg-zinc-50 dark:bg-[#05070A] rounded-xl border border-zinc-200 dark:border-[#161B22]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-[#71717A]">
                                            Security Level
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-[0.18em] ${metCount >= 4 ? "text-green-500" : metCount >= 2 ? "text-yellow-500" : "text-red-500"}`}>
                                            {STRENGTH_LABELS[metCount]}
                                        </span>
                                    </div>
                                    {/* Segmented progress bar */}
                                    <div className="flex gap-1 mb-3">
                                        {PASSWORD_REQUIREMENTS.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-[4px] flex-1 rounded-full transition-colors ${i < metCount ? STRENGTH_COLORS[metCount] : "bg-zinc-200 dark:bg-[#161B22]"}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="space-y-1.5">
                                        {PASSWORD_REQUIREMENTS.map((req, index) => {
                                            const passed = req.test(password);
                                            return (
                                                <div key={index} className={`flex items-center gap-2 text-[11px] ${passed ? 'text-green-500' : 'text-zinc-500 dark:text-[#71717A]'}`}>
                                                    {passed ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                                                    {req.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={labelClass}>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className={inputClass}
                                {...register("password_confirmation", {
                                    required: "Please confirm your password",
                                    validate: (value) => value === password || "Passwords don't match"
                                })}
                            />
                            {formErrors.password_confirmation && <p className="text-red-500 text-xs mt-1.5">{formErrors.password_confirmation.message as string}</p>}
                        </div>

                        <Turnstile
                            onVerify={handleTurnstileVerify}
                            onError={handleTurnstileError}
                        />

                        <button
                            type="submit"
                            disabled={isLoading || (!allRequirementsMet && password.length > 0) || (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_ENABLED !== 'false')}
                            className="group w-full h-[52px] bg-tp-accent hover:bg-tp-accent-hover text-white font-bold rounded-lg transition-colors uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-1.5 shadow-lg shadow-tp-accent/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Creating account..." : (
                                <>
                                    Create Player
                                    <ChevronsRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 dark:text-[#52525B] font-bold uppercase tracking-wider">
                        <Shield className="w-3 h-3" />
                        Protected by Cloudflare Turnstile
                    </div>

                    <div className="mt-7 pt-6 border-t border-zinc-200 dark:border-[#161B22] text-center">
                        <span className="text-[13px] text-zinc-600 dark:text-[#A1A1AA]">Already a player? </span>
                        <Link href="/login" className="text-[12px] font-bold uppercase tracking-wider text-tp-accent hover:text-tp-accent-hover transition-colors">
                            Sign in →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
