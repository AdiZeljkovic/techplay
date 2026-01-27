"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Lock, Twitter, Facebook, Instagram, Youtube, ArrowRight, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

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

            <div className="relative z-10 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-12"
                >
                    <Image
                        src="/techplay-logo.png"
                        alt="TechPlay"
                        width={240}
                        height={60}
                        className="h-16 w-auto mx-auto mb-8"
                    />
                    <div className="inline-block px-4 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] font-bold text-sm tracking-widest uppercase mb-6">
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

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center gap-6"
                >
                    <SocialLink href="https://twitter.com" icon={Twitter} label="Twitter" />
                    <SocialLink href="https://facebook.com" icon={Facebook} label="Facebook" />
                    <SocialLink href="https://instagram.com" icon={Instagram} label="Instagram" />
                    <SocialLink href="https://youtube.com" icon={Youtube} label="YouTube" />
                </motion.div>
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
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors opacity-50 hover:opacity-100"
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
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Call Login API directly since auth context doesn't handle API calls
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // 2. Update Auth Context with retrieved token and user
            login(data.access_token, data.user);

            // 3. Set Bypass Cookie for Middleware
            document.cookie = `techplay_maintenance_bypass=true; path=/; max-age=86400; SameSite=Strict`;

            // 4. Redirect to home (middleware will allow pass)
            window.location.href = "/";
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-8 relative shadow-2xl"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Staff Access</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-2">Enter your credentials to bypass maintenance mode.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@techplay.gg"
                            className="bg-[var(--bg-elevated)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-[var(--bg-elevated)]"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isLoading ? 'Verifying...' : 'Access System'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
