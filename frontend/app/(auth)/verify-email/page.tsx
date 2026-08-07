"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";

export default function VerifyEmailPage() {
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
    const [isVerified, setIsVerified] = useState(false);

    const { user } = useAuth({ middleware: "auth" });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('verified')) {
            setIsVerified(true);
            return;
        }

        const checkStatus = async () => {
            try {
                const res = await axios.get("/email/status");
                if (res.data.verified) setIsVerified(true);
            } catch {}
        };

        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleResend = async () => {
        setIsResending(true);
        setResendStatus("idle");
        try {
            await axios.post("/email/resend");
            setResendStatus("success");
        } catch {
            setResendStatus("error");
        } finally {
            setIsResending(false);
        }
    };

    if (isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md rounded-[24px] overflow-hidden border border-[var(--line)] shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-[var(--surface-1)] p-10 text-center">
                    <div className="h-[3px] bg-[var(--accent)] w-full -mx-10 -mt-10 mb-10 rounded-t-[24px]" style={{ marginLeft: '-2.5rem', marginRight: '-2.5rem', width: 'calc(100% + 5rem)' }} />
                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                    </div>
                    <span className="text-[var(--accent)] font-bold tracking-[0.2em] text-[10px] uppercase block mb-2">Verification Complete</span>
                    <h1 className="font-display text-[28px] font-bold text-[var(--ink-hi)] uppercase tracking-tight mb-3">
                        Email Verified!
                    </h1>
                    <p className="text-[14px] text-[var(--ink-mid)] mb-8">
                        Your email has been successfully verified. You now have full access to TechPlay.
                    </p>
                    <Link href="/" className="btn-command flex items-center justify-center gap-2 w-full h-[52px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-colors uppercase tracking-[0.1em] text-[13px]">
                        Continue to TechPlay
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Link href="/" className="flex items-center mb-8 w-max mx-auto" aria-label="TechPlay — home">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/techplay-logo.png" alt="TechPlay" width={150} height={25} className="h-[25px] w-auto" />
                </Link>

                <div className="rounded-[24px] overflow-hidden border border-[var(--line)] shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-[var(--surface-1)]">
                    <div className="h-[3px] bg-[var(--accent)] w-full" />
                    <div className="p-8 md:p-10 text-center">
                        <div className="w-16 h-16 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-[var(--radius-card)] flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-[var(--accent)]" />
                        </div>

                        <span className="text-[var(--accent)] font-bold tracking-[0.2em] text-[10px] uppercase block mb-2">Almost There</span>
                        <h1 className="font-display text-[28px] font-bold text-[var(--ink-hi)] uppercase tracking-tight mb-3">
                            Verify Your Email
                        </h1>
                        <p className="text-[14px] text-[var(--ink-mid)] mb-6">
                            We've sent a verification link to{" "}
                            <span className="font-semibold text-[var(--ink-hi)]">{user?.email}</span>.
                            Check your inbox and click the link.
                        </p>

                        {resendStatus === "success" && (
                            <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-[var(--radius-card)] text-sm text-[var(--success)]">
                                Verification email sent successfully!
                            </div>
                        )}
                        {resendStatus === "error" && (
                            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-card)] text-sm text-[var(--danger)]">
                                Failed to send email. Please try again.
                            </div>
                        )}

                        <button
                            onClick={handleResend}
                            disabled={isResending}
                            className="btn-command group w-full h-[52px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-colors uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                        >
                            {isResending ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                            ) : (
                                <><RefreshCw className="w-4 h-4" /> Resend Verification Email</>
                            )}
                        </button>

                        <p className="text-[11px] text-[var(--ink-low)] mb-6">
                            Didn't receive it? Check your spam folder or resend above.
                        </p>

                        <div className="pt-5 border-t border-[var(--line)]">
                            <Link href="/" className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
