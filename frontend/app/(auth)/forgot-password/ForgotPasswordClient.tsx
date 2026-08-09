"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Mail, ChevronsRight, ArrowLeft } from "lucide-react";
import axios from "@/lib/axios";

const inputClass = "w-full h-[48px] bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-card)] px-4 text-[14px] text-[var(--ink-hi)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]/60 transition-colors";
const labelClass = "block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-low)] mb-2";

export default function ForgotPasswordClient() {
    const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const onSubmit = async ({ email }: { email: string }) => {
        setSending(true);
        try {
            await axios.post("/auth/forgot-password", { email });
        } catch {
            // The endpoint answers the same way whether or not the address has
            // an account, so there is nothing useful to show on failure either.
        } finally {
            setSending(false);
            setSent(true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="relative w-full max-w-[460px] rounded-[var(--radius-panel)] overflow-hidden border border-[var(--line)] shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-[var(--surface-1)]">
                <span aria-hidden className="absolute top-0 left-8 right-8 h-[2px] z-10 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

                <div className="p-8 md:p-10">
                    <Link href="/" className="flex items-center mb-8 w-max" aria-label="TechPlay — home">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/techplay-logo.png" alt="TechPlay" width={144} height={24} className="h-[24px] w-auto" />
                    </Link>

                    {sent ? (
                        <>
                            <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--accent)]/12 border border-[var(--accent)]/25 flex items-center justify-center mb-5">
                                <Mail className="w-5 h-5 text-[var(--accent)]" />
                            </div>
                            <h1 className="font-display text-[26px] font-bold text-[var(--ink-hi)] uppercase tracking-[0.03em] leading-tight mb-3">
                                Check your <span className="text-[var(--accent)]">inbox</span>
                            </h1>
                            <p className="text-[13px] text-[var(--ink-mid)] leading-relaxed mb-8">
                                If that address has an account, a reset link is on its way. It is
                                good for 60 minutes. Look in spam if it has not arrived in a
                                few minutes.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to sign in
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="mb-8">
                                <span className="text-[var(--accent)] font-bold tracking-[0.2em] text-[10px] uppercase block mb-2">ACCOUNT RECOVERY</span>
                                <h1 className="font-display text-[26px] font-bold text-[var(--ink-hi)] uppercase tracking-[0.03em] leading-tight mb-2">
                                    Forgot your <span className="text-[var(--accent)]">password</span>?
                                </h1>
                                <p className="text-[13px] text-[var(--ink-mid)]">
                                    Give us the address on the account and we will send a link to set a new one.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className={labelClass}>Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        className={inputClass}
                                        {...register("email", { required: "Enter the email on your account." })}
                                    />
                                    {errors.email && (
                                        <p className="mt-2 text-[12px] text-[var(--accent)]">{errors.email.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="btn-command group w-full h-[52px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-colors uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? "Sending…" : "Send reset link"}
                                    {!sending && <ChevronsRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-[var(--line)]">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--ink-low)] hover:text-[var(--ink-hi)] transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to sign in
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
