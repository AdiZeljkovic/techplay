"use client";

import { motion } from "framer-motion";
import { Mail, Download, ArrowDown, BarChart3, Users, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import DeviceMockupsReal from "./DeviceMockupsReal";

interface EnhancedHeroProps {
    contactEmail?: string;
    onDownloadPDF: () => void;
    stats?: {
        totalContent?: number;
        monthlyVisitors?: number;
        socialReach?: number;
    };
}

// Trust metric badge
function TrustBadge({ icon: Icon, value, label, delay }: { icon: any; value: string; label: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-3 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]
                       rounded-2xl px-5 py-3 hover:bg-white/[0.08] hover:border-[var(--accent)]/30
                       transition-all duration-500 group"
        >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5
                           flex items-center justify-center group-hover:from-[var(--accent)]/30 group-hover:to-[var(--accent)]/10
                           transition-all duration-500">
                <Icon className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
                <div className="text-lg font-black text-white leading-tight">{value}</div>
                <div className="text-xs text-white/50 font-medium">{label}</div>
            </div>
        </motion.div>
    );
}

export default function EnhancedHero({ contactEmail, onDownloadPDF, stats }: EnhancedHeroProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="relative min-h-[100vh] overflow-hidden flex items-center justify-center">
            {/* Layered background */}
            <div className="absolute inset-0 bg-[var(--bg-secondary)]" />

            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Primary gradient orb — top right */}
            <motion.div
                className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(252, 65, 0, 0.12) 0%, rgba(252, 65, 0, 0.03) 40%, transparent 70%)',
                }}
                animate={mounted ? {
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8],
                } : {}}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Secondary gradient orb — bottom left */}
            <motion.div
                className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
                }}
                animate={mounted ? {
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 0.9, 0.6],
                } : {}}
                transition={{
                    duration: 12,
                    delay: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Noise grain overlay */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

            {/* Content container */}
            <div className="relative z-10 container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[100vh] py-32">
                    {/* Left — Text content */}
                    <div className="flex flex-col justify-center">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <span className="inline-flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20
                                           text-[var(--accent)] text-sm font-semibold px-4 py-2 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                                Official Media Kit 2026
                            </span>
                        </motion.div>

                        {/* Main headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15 }}
                            className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-6 tracking-tight"
                        >
                            <span className="text-white">Reach Gamers Who</span>
                            <br />
                            <span className="relative">
                                <span className="bg-gradient-to-r from-[var(--accent)] via-orange-400 to-[var(--accent)]
                                               bg-clip-text text-transparent">
                                    Actually Buy Stuff
                                </span>
                                {/* Glow underline */}
                                <motion.span
                                    className="absolute -bottom-2 left-0 right-0 h-1 rounded-full
                                               bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                                />
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-lg md:text-xl text-white/60 mb-10 max-w-xl leading-relaxed font-light"
                        >
                            Over <span className="text-white font-medium">20,000 monthly readers</span> who trust our reviews when making tech purchases.
                            No bots, no fake traffic — just real people who genuinely care about gaming and tech.
                        </motion.p>

                        {/* CTA buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.8 }}
                            className="flex flex-wrap gap-4 mb-12"
                        >
                            {/* Primary CTA */}
                            <motion.a
                                href={`mailto:${contactEmail || 'marketing@techplay.gg'}`}
                                className="group relative inline-flex items-center gap-3 px-8 py-4
                                         bg-gradient-to-r from-[var(--accent)] to-orange-600
                                         text-white font-bold rounded-2xl overflow-hidden
                                         shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl hover:shadow-[var(--accent)]/40
                                         transition-shadow duration-500"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Shine sweep */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                                    initial={{ x: '-150%' }}
                                    whileHover={{ x: '150%' }}
                                    transition={{ duration: 0.7, ease: "easeInOut" }}
                                />
                                <Mail className="w-5 h-5 relative z-10" />
                                <span className="relative z-10 text-lg">Let's Talk</span>
                            </motion.a>

                            {/* Secondary CTA */}
                            <motion.button
                                onClick={onDownloadPDF}
                                className="group inline-flex items-center gap-3 px-8 py-4
                                         bg-white/[0.04] backdrop-blur-xl
                                         border border-white/[0.1] text-white font-bold rounded-2xl
                                         hover:bg-white/[0.08] hover:border-white/[0.2]
                                         transition-all duration-500"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-300" />
                                <span className="text-lg">Download Media Kit</span>
                            </motion.button>
                        </motion.div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap gap-3">
                            <TrustBadge
                                icon={Newspaper}
                                value={stats?.totalContent ? `${Math.floor(stats.totalContent / 100) * 100}+` : "200+"}
                                label="In-Depth Reviews"
                                delay={0.7}
                            />
                            <TrustBadge
                                icon={Users}
                                value={stats?.monthlyVisitors ? `${Math.floor(stats.monthlyVisitors / 1000)}K+` : "20K+"}
                                label="Monthly Readers"
                                delay={0.85}
                            />
                            <TrustBadge
                                icon={BarChart3}
                                value={stats?.socialReach ? `${Math.floor(stats.socialReach / 1000)}K+` : "2K+"}
                                label="Social Following"
                                delay={1.0}
                            />
                        </div>
                    </div>

                    {/* Right — Device Mockups */}
                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className="hidden lg:block relative"
                    >
                        <div className="relative h-[600px]">
                            <DeviceMockupsReal />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
            >
                <span className="text-xs text-white/30 font-medium uppercase tracking-widest">Scroll</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ArrowDown className="w-4 h-4 text-white/30" />
                </motion.div>
            </motion.div>

            {/* Bottom gradient fade into page */}
            <div className="absolute bottom-0 left-0 right-0 h-32
                           bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none z-20" />
        </section>
    );
}
