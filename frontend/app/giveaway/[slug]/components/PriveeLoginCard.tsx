"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
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

export default function PriveeLoginCard({ slug, onSuccess }: PriveeLoginCardProps) {
    const [tab, setTab]         = useState<Tab>("email");
    const [email, setEmail]     = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);
    const [gsiReady, setGsiReady] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);

    // Initialize Google Identity Services once the script is loaded
    const initGoogle = () => {
        if (typeof window === "undefined" || !(window as any).google) return;

        (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
        });

        setGsiReady(true);
    };

    // Render the Google button when tab switches to "google" and GIS is ready
    useEffect(() => {
        if (tab !== "google" || !gsiReady || !googleBtnRef.current) return;

        googleBtnRef.current.innerHTML = "";

        (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            shape: "rectangular",
            theme: "filled_black",
            text: "signin_with",
            size: "large",
            width: googleBtnRef.current.offsetWidth || 320,
            logo_alignment: "left",
        });
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
            {/* Load Google Identity Services */}
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="lazyOnload"
                onLoad={initGoogle}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md mx-auto"
            >
                {/* Privee branding header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                                    bg-[var(--accent)]/10 border border-[var(--accent)]/30 mb-4">
                        <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest">
                            Privee account required
                        </span>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed">
                        To enter this giveaway you need a Privee account.{" "}
                        <a
                            href="https://privee.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] hover:underline"
                        >
                            Download the app
                        </a>
                        , register, then log in below.
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">

                    {/* Tabs */}
                    <div className="flex border-b border-white/[0.08]">
                        {(["email", "google"] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); setError(null); }}
                                className={`flex-1 py-3.5 text-sm font-semibold transition-colors duration-200
                                            ${tab === t
                                    ? "text-white border-b-2 border-[var(--accent)] bg-[var(--accent)]/5"
                                    : "text-white/40 hover:text-white/70"
                                }`}
                            >
                                {t === "email" ? "Email login" : "Google login"}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">

                            {/* Email tab */}
                            {tab === "email" && (
                                <motion.form
                                    key="email"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleEmailLogin}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-xs font-semibold text-white/60 mb-1.5">
                                            Privee email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10]
                                                       text-white placeholder-white/25 text-sm outline-none
                                                       focus:border-[var(--accent)]/60 focus:bg-white/[0.07]
                                                       transition-colors duration-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-white/60 mb-1.5">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10]
                                                       text-white placeholder-white/25 text-sm outline-none
                                                       focus:border-[var(--accent)]/60 focus:bg-white/[0.07]
                                                       transition-colors duration-200"
                                        />
                                    </div>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-xs font-medium bg-red-500/10
                                                       border border-red-500/20 rounded-lg px-3 py-2"
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
                                                   shadow-lg shadow-[var(--accent)]/25
                                                   hover:shadow-[var(--accent)]/40
                                                   disabled:opacity-50 disabled:cursor-not-allowed
                                                   transition-all duration-300"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                                Verifying...
                                            </span>
                                        ) : (
                                            "Log in with Privee & enter giveaway"
                                        )}
                                    </motion.button>
                                </motion.form>
                            )}

                            {/* Google tab */}
                            {tab === "google" && (
                                <motion.div
                                    key="google"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <p className="text-white/50 text-sm text-center">
                                        Sign in with the Google account linked to your Privee account.
                                    </p>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-400 text-xs font-medium bg-red-500/10
                                                       border border-red-500/20 rounded-lg px-3 py-2 text-center"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    {/* Google Sign-In button rendered by GIS SDK */}
                                    <div className="flex justify-center">
                                        {gsiReady ? (
                                            <div ref={googleBtnRef} className="w-full" />
                                        ) : (
                                            <div className="h-10 w-full rounded-lg bg-white/[0.05] animate-pulse" />
                                        )}
                                    </div>

                                    {loading && (
                                        <p className="text-white/40 text-xs text-center animate-pulse">
                                            Verifying with Privee...
                                        </p>
                                    )}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                <p className="text-center text-white/25 text-xs mt-4">
                    Don&apos;t have Privee?{" "}
                    <a
                        href="https://privee.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/50 hover:text-white/80 underline transition-colors"
                    >
                        Download the app
                    </a>{" "}
                    and register first.
                </p>
            </motion.div>
        </>
    );
}
