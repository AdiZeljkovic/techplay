"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Lock, X, Loader2, AlertCircle, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function ComingSoonPage() {
    const [showLogin, setShowLogin] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center relative overflow-hidden text-center p-4">

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-16 flex flex-col items-center"
                >
                    {/* Brand Logo */}
                    <div className="flex items-center gap-5 group cursor-default select-none">
                        <div className="w-20 h-20 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-white shadow-[0_0_50px_-10px_var(--accent)] group-hover:scale-105 transition-transform duration-500">
                            <Gamepad2 className="w-10 h-10" />
                        </div>
                        <div className="flex flex-col justify-center text-left">
                            <span className="font-black text-6xl leading-none text-[var(--text-primary)] tracking-tight">
                                TECH<span className="text-[var(--accent)]">PLAY</span>
                            </span>
                            <span className="text-sm font-bold text-[var(--text-muted)] tracking-[0.3em] uppercase leading-none mt-3 group-hover:text-[var(--accent)] transition-colors pl-1">
                                Gaming Portal
                            </span>
                        </div>
                    </div>

                    <div className="mt-12 inline-block px-6 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] font-bold text-xs tracking-[0.2em] uppercase backdrop-blur-sm">
                        System Upgrade In Progress
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-7xl font-black text-[var(--text-primary)] mb-6 leading-tight"
                >
                    We Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-500">Leveling Up</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[var(--text-secondary)] text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed"
                >
                    TechPlay is currently under maintenance. We're deploying new features, optimizing performance, and crafting a better experience for you.
                    <br /><span className="text-[var(--text-muted)] text-base mt-4 block">We'll be back online shortly.</span>
                </motion.p>
            </div>

            {/* Staff Login Trigger */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 right-8 z-20"
            >
                <button
                    onClick={() => setShowLogin(true)}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors opacity-50 hover:opacity-100 font-medium"
                >
                    <Lock className="w-3 h-3" /> Staff Access
                </button>
            </motion.div>

            {/* Staff Login Modal */}
            {showLogin && <StaffLoginModal onClose={() => setShowLogin(false)} />}
        </div>
    );
}

function SocialLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all group"
            aria-label={label}
        >
            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </a>
    );
}

function StaffLoginModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Staff access bypasses Turnstile - it's a hidden feature requiring valid credentials
            await login({
                email,
                password,
                recaptcha_token: 'staff-bypass', // Backend should allow staff logins without captcha
                setErrors: (errs: string[]) => {
                    setError(errs[0] || "Login failed");
                    setIsLoading(false);
                },
                setStatus: () => { },
                setRequiresVerification: () => {
                    setError("Please verify your email first.");
                    setIsLoading(false);
                }
            });

            if (localStorage.getItem('token')) {
                document.cookie = `techplay_maintenance_bypass=true; path=/; max-age=86400; SameSite=Strict`;
                window.location.href = "/";
            } else {
                setIsLoading(false);
            }

        } catch (err: any) {
            console.error("Login error", err);
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0f172a] border border-slate-700/50 rounded-2xl w-full max-w-md p-8 relative shadow-2xl"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Staff Access</h2>
                    <p className="text-slate-400 text-sm mt-2">Enter your credentials to bypass maintenance mode.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                        </div>
                    )}

                    <div className="space-y-2 text-left">
                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@techplay.gg"
                            className="bg-slate-800/50 border-slate-700 text-white"
                        />
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="text-sm font-medium text-slate-300">Password</label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-slate-800/50 border-slate-700 text-white"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isLoading ? 'Verifying...' : 'Access System'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
