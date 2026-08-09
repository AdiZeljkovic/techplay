"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { ShieldCheck, ChevronsRight, ArrowLeft } from "lucide-react";
import axios from "@/lib/axios";

const inputClass = "w-full h-[48px] bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-card)] px-4 text-[14px] text-[var(--ink-hi)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]/60 transition-colors";
const labelClass = "block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-low)] mb-2";

type Fields = { password: string; password_confirmation: string };

export default function ResetPasswordClient() {
    const params = useSearchParams();
    const router = useRouter();

    // Both arrive in the emailed link; without them there is nothing to reset.
    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";

    const { register, handleSubmit, watch, formState: { errors } } = useForm<Fields>();
    const [saving, setSaving] = useState(false);
    const [failure, setFailure] = useState<string | null>(null);

    const onSubmit = async (values: Fields) => {
        setSaving(true);
        setFailure(null);
        try {
            await axios.post("/auth/reset-password", { token, email, ...values });
            router.push("/login?reset=1");
        } catch (err: any) {
            const data = err?.response?.data;
            setFailure(
                data?.errors?.password?.[0]
                    ?? data?.message
                    ?? "We could not reset that password. Request a fresh link and try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const linkIsUsable = token !== "" && email !== "";

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="relative w-full max-w-[460px] rounded-[var(--radius-panel)] overflow-hidden border border-[var(--line)] shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-[var(--surface-1)]">
                <span aria-hidden className="absolute top-0 left-8 right-8 h-[2px] z-10 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

                <div className="p-8 md:p-10">
                    <Link href="/" className="flex items-center mb-8 w-max" aria-label="TechPlay — home">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/techplay-logo.png" alt="TechPlay" width={144} height={24} className="h-[24px] w-auto" />
                    </Link>

                    {!linkIsUsable ? (
                        <>
                            <h1 className="font-display text-[26px] font-bold text-[var(--ink-hi)] uppercase tracking-[0.03em] leading-tight mb-3">
                                This link is <span className="text-[var(--accent)]">incomplete</span>
                            </h1>
                            <p className="text-[13px] text-[var(--ink-mid)] leading-relaxed mb-8">
                                Open the reset link straight from the email — copying only part of
                                the address leaves out the token it needs.
                            </p>
                            <Link
                                href="/forgot-password"
                                className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                            >
                                Request a new link
                                <ChevronsRight className="w-4 h-4" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="mb-8">
                                <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--accent)]/12 border border-[var(--accent)]/25 flex items-center justify-center mb-5">
                                    <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
                                </div>
                                <h1 className="font-display text-[26px] font-bold text-[var(--ink-hi)] uppercase tracking-[0.03em] leading-tight mb-2">
                                    Set a new <span className="text-[var(--accent)]">password</span>
                                </h1>
                                <p className="text-[13px] text-[var(--ink-mid)]">
                                    Resetting signs out every other device on the account.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label htmlFor="password" className={labelClass}>New password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        className={inputClass}
                                        {...register("password", {
                                            required: "Choose a password.",
                                            minLength: { value: 8, message: "At least 8 characters." },
                                        })}
                                    />
                                    {errors.password && (
                                        <p className="mt-2 text-[12px] text-[var(--accent)]">{errors.password.message}</p>
                                    )}
                                    <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
                                        At least 8 characters, with a letter, a number and a symbol.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className={labelClass}>Confirm password</label>
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        className={inputClass}
                                        {...register("password_confirmation", {
                                            required: "Type it once more.",
                                            validate: (value) => value === watch("password") || "The two do not match.",
                                        })}
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-2 text-[12px] text-[var(--accent)]">{errors.password_confirmation.message}</p>
                                    )}
                                </div>

                                {failure && (
                                    <p className="text-[12px] text-[var(--accent)] leading-relaxed">{failure}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-command group w-full h-[52px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-colors uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? "Saving…" : "Reset password"}
                                    {!saving && <ChevronsRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
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
