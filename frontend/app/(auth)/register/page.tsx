"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserPlus, Shield, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTurnstile } from "@/components/providers/TurnstileProvider";

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

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const { executeTurnstile } = useTurnstile();

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

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setErrors([]);

        // Execute Turnstile
        const recaptchaToken = await executeTurnstile("register");

        await registerAuth({
            setErrors,
            ...data,
            recaptcha_token: recaptchaToken
        });
        setIsLoading(false);
    };

    const allRequirementsMet = PASSWORD_REQUIREMENTS.every(req => req.test(password));

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-[var(--accent)] rounded-xl flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Join TechPlay
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            Create your account to get started
                        </p>
                    </div>

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

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            label="Username"
                            placeholder="johndoe"
                            {...register("username", {
                                required: "Username is required",
                                pattern: {
                                    value: /^[a-zA-Z0-9_-]+$/,
                                    message: "Only letters, numbers, underscores, and dashes"
                                }
                            })}
                            error={formErrors.username?.message as string}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                            error={formErrors.email?.message as string}
                        />

                        <div>
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                {...register("password", {
                                    required: "Password is required",
                                    validate: () => allRequirementsMet || "Password doesn't meet all requirements"
                                })}
                                error={formErrors.password?.message as string}
                            />

                            {/* Password Requirements */}
                            {password.length > 0 && (
                                <div className="mt-3 p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                                    <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Password Requirements:</p>
                                    <div className="space-y-1">
                                        {PASSWORD_REQUIREMENTS.map((req, index) => {
                                            const passed = req.test(password);
                                            return (
                                                <div key={index} className={`flex items-center gap-2 text-xs ${passed ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                                                    {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                    {req.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            {...register("password_confirmation", {
                                required: "Please confirm your password",
                                validate: (value) => value === password || "Passwords don't match"
                            })}
                            error={formErrors.password_confirmation?.message as string}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                            disabled={!allRequirementsMet && password.length > 0}
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                        <Shield className="w-3 h-3" />
                        Protected by Cloudflare Turnstile
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-[var(--accent)] font-medium hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
