"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle, Gamepad2 } from "lucide-react";
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
                <div className="w-full max-w-md rounded-[24px] overflow-hidden border border-zinc-200 dark:border-[#161B22] shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0B0E14] p-10 text-center">
                    <div className="h-[3px] bg-tp-accent w-full -mx-10 -mt-10 mb-10 rounded-t-[24px]" style={{ marginLeft: '-2.5rem', marginRight: '-2.5rem', width: 'calc(100% + 5rem)' }} />
                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <span className="text-tp-accent font-bold tracking-[0.2em] text-[10px] uppercase block mb-2">Verification Complete</span>
                    <h1 className="font-display text-[28px] font-bold text-zinc-900 dark:text-white uppercase tracking-tight mb-3">
                        Email Verified!
                    </h1>
                    <p className="text-[14px] text-zinc-600 dark:text-[#A1A1AA] mb-8">
                        Your email has been successfully verified. You now have full access to TechPlay.
                    </p>
                    <Link href="/" className="flex items-center justify-center gap-2 w-full h-[52px] bg-tp-accent hover:bg-tp-accent-hover text-white font-bold rounded-lg transition-colors uppercase tracking-[0.1em] text-[13px] shadow-lg shadow-tp-accent/25">
                        Continue to TechPlay
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Link href="/" className="flex items-center gap-2.5 mb-8 w-max mx-auto">
                    <div className="w-9 h-9 bg-tp-accent rounded-lg flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <span className="font-display font-bold text-[15px] text-zinc-900 dark:text-white tracking-tight">TECHPLAY</span>
                </Link>

                <div className="rounded-[24px] overflow-hidden border border-zinc-200 dark:border-[#161B22] shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0B0E14]">
                    <div className="h-[3px] bg-tp-accent w-full" />
                    <div className="p-8 md:p-10 text-center">
                        <div className="w-16 h-16 bg-tp-accent/10 border border-tp-accent/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-tp-accent" />
                        </div>

                        <span className="text-tp-accent font-bold tracking-[0.2em] text-[10px] uppercase block mb-2">Almost There</span>
                        <h1 className="font-display text-[28px] font-bold text-zinc-900 dark:text-white uppercase tracking-tight mb-3">
                            Verify Your Email
                        </h1>
                        <p className="text-[14px] text-zinc-600 dark:text-[#A1A1AA] mb-6">
                            We've sent a verification link to{" "}
                            <span className="font-semibold text-zinc-900 dark:text-white">{user?.email}</span>.
                            Check your inbox and click the link.
                        </p>

                        {resendStatus === "success" && (
                            <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">
                                Verification email sent successfully!
                            </div>
                        )}
                        {resendStatus === "error" && (
                            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                                Failed to send email. Please try again.
                            </div>
                        )}

                        <button
                            onClick={handleResend}
                            disabled={isResending}
                            className="group w-full h-[52px] bg-tp-accent hover:bg-tp-accent-hover text-white font-bold rounded-lg transition-colors uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-tp-accent/25 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                        >
                            {isResending ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                            ) : (
                                <><RefreshCw className="w-4 h-4" /> Resend Verification Email</>
                            )}
                        </button>

                        <p className="text-[11px] text-zinc-500 dark:text-[#71717A] mb-6">
                            Didn't receive it? Check your spam folder or resend above.
                        </p>

                        <div className="pt-5 border-t border-zinc-200 dark:border-[#161B22]">
                            <Link href="/" className="text-[12px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#52525B] hover:text-tp-accent transition-colors">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
