"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";

export default function VerifyEmailPage() {
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
    const [isVerified, setIsVerified] = useState(false);

    const { user } = useAuth({ middleware: "auth" });

    useEffect(() => {
        // Check if redirected from email link
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('verified')) {
            setIsVerified(true);
            return;
        }

        // Check verification status periodically
        const checkStatus = async () => {
            try {
                const res = await axios.get("/email/status");
                if (res.data.verified) {
                    setIsVerified(true);
                }
            } catch (error) {
                // Ignore errors
            }
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
        } catch (error) {
            setResendStatus("error");
        } finally {
            setIsResending(false);
        }
    };

    if (isVerified) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Email Verified!
                        </h1>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Your email has been successfully verified. You now have full access to TechPlay.
                        </p>
                        <Link href="/">
                            <Button className="w-full">
                                Continue to TechPlay
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        Verify Your Email
                    </h1>
                    <p className="text-[var(--text-secondary)] mb-6">
                        We've sent a verification link to <span className="font-semibold text-[var(--text-primary)]">{user?.email}</span>.
                        Please check your inbox and click the link to verify your account.
                    </p>

                    {/* Status Messages */}
                    {resendStatus === "success" && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">
                            Verification email sent successfully!
                        </div>
                    )}
                    {resendStatus === "error" && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                            Failed to send email. Please try again.
                        </div>
                    )}

                    {/* Resend Button */}
                    <Button
                        variant="outline"
                        className="w-full mb-4"
                        onClick={handleResend}
                        disabled={isResending}
                    >
                        {isResending ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend Verification Email
                            </>
                        )}
                    </Button>

                    {/* Help Text */}
                    <p className="text-xs text-[var(--text-muted)]">
                        Didn't receive the email? Check your spam folder or click above to resend.
                    </p>

                    {/* Back to Home */}
                    <div className="mt-6 pt-6 border-t border-[var(--border)]">
                        <Link
                            href="/"
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
