"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "@/lib/axios";

interface PriveeEntry {
    id: number;
    privee_email: string | null;
    privee_display_name: string | null;
    entered_at: string;
}

interface PriveeLoginCardProps {
    slug: string;
    onSuccess: (entry: PriveeEntry) => void;
}

type Tab = "email" | "google";

const GOOGLE_CLIENT_ID = "626931165892-9d30nhqljoc52782ifibgeg5jqb64a3f.apps.googleusercontent.com";

// Step indicator
function StepBadge({ number, label, active }: { number: number; label: string; active: boolean }) {
    return (
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${active ? "opacity-100" : "opacity-40"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0
                            ${active
                    ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/40"
                    : "bg-white/[0.08] text-white/60"
                }`}>
                {number}
            </div>
            <span className={`text-xs font-semibold ${active ? "text-white" : "text-white/50"}`}>{label}</span>
        </div>
    );
}

export default function PriveeLoginCard({ slug, onSuccess }: PriveeLoginCardProps) {
    const [tab, setTab]             = useState<Tab>("email");
    const [email, setEmail]         = useState("");
    const [password, setPassword]   = useState("");
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [gsiReady, setGsiReady]   = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);

    // Wait for Google GSI script (loaded in layout.tsx) to become available
    useEffect(() => {
        let cancelled = false;
        const tryInit = () => {
            if (cancelled) return;
            if ((window as any).google?.accounts) {
                console.log("[GSI] google.accounts found, initializing...");
                console.log("[GSI] client_id:", GOOGLE_CLIENT_ID);
                try {
                    (window as any).google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleGoogleCredential,
                        auto_select: false,
                    });
                    console.log("[GSI] initialize() succeeded");
                    setGsiReady(true);
                } catch (err) {
                    console.error("[GSI] initialize() threw:", err);
                }
            } else {
                console.log("[GSI] google.accounts not available yet, retrying in 50ms...");
                setTimeout(tryInit, 50);
            }
        };
        tryInit();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Render Google button when tab is "google" and GIS is ready
    useEffect(() => {
        console.log("[GSI render] tab:", tab, "| gsiReady:", gsiReady, "| ref:", googleBtnRef.current);

        if (tab !== "google") {
            console.log("[GSI render] skipped — tab is not 'google'");
            return;
        }
        if (!gsiReady) {
            console.log("[GSI render] skipped — gsiReady is false");
            return;
        }
        if (!googleBtnRef.current) {
            console.log("[GSI render] skipped — googleBtnRef.current is NULL (div not mounted yet)");
            return;
        }

        const container = googleBtnRef.current;
        console.log("[GSI render] container dimensions:", container.offsetWidth, "x", container.offsetHeight);
        console.log("[GSI render] container visible:", container.offsetParent !== null);
        console.log("[GSI render] container in DOM:", document.body.contains(container));

        try {
            container.innerHTML = "";
            (window as any).google.accounts.id.renderButton(container, {
                type: "standard",
                shape: "rectangular",
                theme: "filled_black",
                text: "signin_with",
                size: "large",
                width: 320,
                logo_alignment: "left",
            });
            console.log("[GSI render] renderButton() called successfully");

            // Check if Google actually created the iframe
            setTimeout(() => {
                const iframe = container.querySelector("iframe");
                const div = container.querySelector("div");
                console.log("[GSI render] after render — iframe found:", !!iframe, "| child div found:", !!div);
                console.log("[GSI render] container innerHTML:", container.innerHTML.substring(0, 200));
            }, 500);
        } catch (err) {
            console.error("[GSI render] renderButton() threw:", err);
        }
    }, [tab, gsiReady]);

    const handleGoogleCredential = async (response: { credential: string }) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`/giveaways/${slug}/privee/google-login`, {
                google_token: response.credential,
            });
            onSuccess(data.entry);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Google login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`/giveaways/${slug}/privee/login`, {
                email,
                password,
            });
            onSuccess(data.entry);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Invalid credentials. Please check and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="w-full space-y-5">

                {/* ── STEP 1: Download the app ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
                >
                    <div className="flex items-start gap-3 mb-4">
                        <StepBadge number={1} label="Get the Privee app" active={true} />
                    </div>

                    <p className="text-white/50 text-xs leading-relaxed mb-4">
                        This giveaway runs through Privee. Download the app, create a free account, and come back here to continue.
                    </p>

                    {/* Store buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* App Store */}
                        <a
                            href="https://apps.apple.com/pl/app/privee-world/id1629866639"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl
                                       bg-white/[0.05] border border-white/[0.10]
                                       hover:bg-white/[0.08] hover:border-white/[0.18]
                                       transition-all duration-200 group"
                        >
                            {/* Apple logo */}
                            <svg className="w-7 h-7 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            <div>
                                <div className="text-[10px] text-white/40 leading-none">Download on the</div>
                                <div className="text-sm font-bold text-white leading-tight">App Store</div>
                            </div>
                        </a>

                        {/* Google Play */}
                        <a
                            href="https://play.google.com/store/apps/details?id=com.privee.privee_mobile"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl
                                       bg-white/[0.05] border border-white/[0.10]
                                       hover:bg-white/[0.08] hover:border-white/[0.18]
                                       transition-all duration-200 group"
                        >
                            {/* Google Play logo */}
                            <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="none">
                                <path d="M3.18 23.76c.3.17.65.17.96.02l13.5-7.5-2.93-2.93-11.53 10.41z" fill="#EA4335"/>
                                <path d="M22.24 9.6L19.14 7.86 15.85 11l3.27 3.27 3.14-1.74c.9-.5.9-1.93-.02-2.93z" fill="#FBBC04"/>
                                <path d="M3.18.24C2.87.4 2.67.72 2.67 1.1v21.8c0 .38.2.7.51.86l12.3-11.06L3.18.24z" fill="#4285F4"/>
                                <path d="M4.14.26L17.64 7.76 14.67 10.7 3.18.26C3.48.09 3.83.09 4.14.26z" fill="#34A853"/>
                            </svg>
                            <div>
                                <div className="text-[10px] text-white/40 leading-none">Get it on</div>
                                <div className="text-sm font-bold text-white leading-tight">Google Play</div>
                            </div>
                        </a>
                    </div>
                </motion.div>

                {/* ── STEP 2: Register ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 }}
                    className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
                >
                    <div className="flex items-start gap-3 mb-2">
                        <StepBadge number={2} label="Create your account" active={true} />
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed pl-8">
                        Register with your email or Google — takes less than a minute and it&apos;s completely free. Already have one? Skip to step 3.
                    </p>
                </motion.div>

                {/* ── STEP 3: Log in here ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.16 }}
                    className="rounded-2xl bg-white/[0.04] border border-[var(--accent)]/25 overflow-hidden"
                >
                    {/* Step header */}
                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
                        <StepBadge number={3} label="Sign in to enter" active={true} />
                        <p className="text-white/40 text-xs leading-relaxed mt-2 pl-8">
                            All set on Privee? Sign in below — that&apos;s it, you&apos;re in the draw.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/[0.06]">
                        {(["email", "google"] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); setError(null); }}
                                className={`flex-1 py-3 text-xs font-bold transition-colors duration-200
                                            ${tab === t
                                    ? "text-white border-b-2 border-[var(--accent)] bg-[var(--accent)]/5"
                                    : "text-white/35 hover:text-white/60"
                                }`}
                            >
                                {t === "email" ? "Email login" : "Google login"}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        <AnimatePresence mode="wait">

                            {/* Email tab */}
                            {tab === "email" && (
                                <motion.form
                                    key="email"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={{ duration: 0.15 }}
                                    onSubmit={handleEmailLogin}
                                    className="space-y-3"
                                >
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        placeholder="Privee email"
                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10]
                                                   text-white placeholder-white/25 text-sm outline-none
                                                   focus:border-[var(--accent)]/60 focus:bg-white/[0.07]
                                                   transition-colors duration-200"
                                    />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10]
                                                   text-white placeholder-white/25 text-sm outline-none
                                                   focus:border-[var(--accent)]/60 focus:bg-white/[0.07]
                                                   transition-colors duration-200"
                                    />

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full py-3.5 rounded-xl font-bold text-white text-sm
                                                   bg-gradient-to-r from-[var(--accent)] to-orange-600
                                                   shadow-lg shadow-[var(--accent)]/20
                                                   disabled:opacity-50 disabled:cursor-not-allowed
                                                   transition-all duration-200"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                                Entering...
                                            </span>
                                        ) : "Enter the giveaway"}
                                    </motion.button>
                                </motion.form>
                            )}

                            {/* Google tab */}
                            {tab === "google" && (
                                <motion.div
                                    key="google"
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-3"
                                >
                                    <p className="text-white/40 text-xs text-center">
                                        Use the Google account you signed up with on Privee.
                                    </p>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    <div className="flex justify-center">
                                        {gsiReady ? (
                                            <div ref={googleBtnRef} className="w-full" />
                                        ) : (
                                            <div className="h-10 w-full rounded-lg bg-white/[0.05] animate-pulse" />
                                        )}
                                    </div>

                                    {loading && (
                                        <p className="text-white/30 text-xs text-center animate-pulse">
                                            Signing you in...
                                        </p>
                                    )}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </motion.div>

            </div>
        </>
    );
}
