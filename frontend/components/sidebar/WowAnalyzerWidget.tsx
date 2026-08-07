"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Trophy, Zap } from "lucide-react";
import Link from "next/link";

export default function WowAnalyzerWidget() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden group"
        >
            {/* Glow Effect on Hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-[var(--accent)] rounded-[var(--radius-panel)] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-[var(--surface-1)] via-[var(--surface-1)] to-[#001a4d] border-2 border-[var(--line)] group-hover:border-[var(--accent)] rounded-[var(--radius-panel)] p-6 transition-all duration-300 shadow-2xl">

                {/* Decorative Accent Dot */}
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-full mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                        Free Tool
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black text-white mb-2 leading-tight">
                    WoW Character Analyzer
                </h3>

                {/* Description */}
                <p className="text-sm text-white/55 mb-5 leading-relaxed">
                    Check your <span className="text-white font-semibold">Midnight readiness</span> instantly! Get expert tips from Professor Buffy.
                </p>

                {/* Features */}
                <div className="space-y-2.5 mb-5">
                    <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center shrink-0">
                            <Trophy className="w-3 h-3 text-[var(--accent)]" />
                        </div>
                        <span className="text-white/55">Gear & M+ Score Check</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center shrink-0">
                            <Zap className="w-3 h-3 text-[var(--accent)]" />
                        </div>
                        <span className="text-white/55">Instant Analysis</span>
                    </div>
                </div>

                {/* CTA Button */}
                <Link
                    href="/wow-analyzer"
                    className="group/btn relative w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--accent)] to-orange-600 hover:from-orange-600 hover:to-[var(--accent)] text-white font-bold text-sm rounded-[var(--radius-card)] transition-all duration-300 shadow-lg shadow-[var(--accent)]/40 hover:shadow-[var(--accent)]/60 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span>Analyze Now</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>

                {/* Small Info Text */}
                <p className="text-xs text-white/35 text-center mt-3">
                    ✨ No login required • 100% Free
                </p>
            </div>
        </motion.div>
    );
}
