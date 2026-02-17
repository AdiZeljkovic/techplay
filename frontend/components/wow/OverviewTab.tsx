'use client';

import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, X, TrendingUp, Target, Zap, Shield, Trophy, Swords } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

import { MidnightFaction } from '@/types';

interface OverviewTabProps {
    data: {
        readiness_score: number;
        ai_advice: string[];
        missing_essentials: string[];
        equipment?: {
            item_level: number;
            missing_enchants: string[];
            missing_gems: string[];
            tier_pieces: number;
        } | null;
        mythic_plus?: {
            score: number;
        } | null;
        raids?: {
            summary: string;
        } | null;
        reputations?: {
            midnight_factions: MidnightFaction[];
        } | null;
    };
}

export default function OverviewTab({ data }: OverviewTabProps) {
    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'Legendary';
        if (score >= 75) return 'Epic';
        if (score >= 50) return 'Rare';
        if (score >= 25) return 'Uncommon';
        return 'Common';
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-400';
        if (score >= 50) return 'text-yellow-400';
        return 'text-orange-400';
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Profesor Buffy's AI Tips */}
            <motion.div
                variants={fadeInUp}
                className="relative"
            >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-[var(--accent)] rounded-3xl blur-xl opacity-20" />

                <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl hover:border-[var(--accent)] transition-all shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-orange-600 flex items-center justify-center shadow-lg shadow-[var(--accent)]/40">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                                Profesor Buffy's Tips
                            </h3>
                            <p className="text-sm font-semibold text-[var(--text-secondary)]">
                                AI-powered Midnight expansion guidance
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data.ai_advice.map((tip, index) => (
                            <div
                                key={index}
                                className="group flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-secondary)] border-2 border-[var(--border)] hover:border-[var(--accent)]/30 hover:shadow-lg transition-all"
                            >
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-orange-600 flex items-center justify-center font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                                    {index + 1}
                                </div>
                                <p className="flex-1 text-[var(--text-primary)] leading-relaxed font-medium">{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Character Improvement Roadmap */}
            <motion.div
                variants={fadeInUp}
                className="relative"
            >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-[var(--accent)] to-purple-500 rounded-3xl blur-xl opacity-20" />

                <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl hover:border-[var(--accent)] transition-all shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-[var(--accent)] flex items-center justify-center shadow-lg shadow-purple-500/40">
                            <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                                Improvement Roadmap
                            </h3>
                            <p className="text-sm font-semibold text-[var(--text-secondary)]">
                                Prioritized actions to optimize your character
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* CRITICAL: Midnight Factions (Housing Access!) */}
                        {data.reputations?.midnight_factions && data.reputations.midnight_factions.some(f => f.tier < 7) && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-red-500/15 to-orange-500/10 border-2 border-red-500/40 shadow-lg shadow-red-500/20">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/40">
                                            <AlertCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="font-black text-red-400 uppercase text-base tracking-wide">CRITICAL: Midnight Housing</h4>
                                                <span className="px-3 py-1 text-xs rounded-full bg-red-500/30 text-red-200 font-black border border-red-500/40 animate-pulse">
                                                    REQUIRED FOR MIDNIGHT!
                                                </span>
                                            </div>
                                    <p className="text-[var(--text-primary)] font-semibold mb-3">
                                        Quel'Thalas Reputation Required
                                    </p>
                                    {data.reputations.midnight_factions.filter(f => f.tier < 7).map((faction, idx) => (
                                        <div key={idx} className="mb-2 last:mb-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                    {faction.name}
                                                </span>
                                                <span className="text-xs text-red-400 font-semibold">
                                                    {faction.standing} ({faction.tier}/7)
                                                </span>
                                            </div>
                                            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5">
                                                <div
                                                    className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${(faction.progress.current / faction.progress.max) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                                {faction.progress.max - faction.progress.current} rep to {faction.tier === 6 ? 'Exalted' : 'next level'}
                                            </p>
                                        </div>
                                    ))}
                                            <p className="text-sm text-red-200 mt-3 font-bold bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                                                💡 Exalted with Quel'Thalas factions is REQUIRED for Midnight housing access!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Critical: Equipment Optimization */}
                        {data.equipment && (data.equipment.missing_enchants.length > 0 || data.equipment.missing_gems.length > 0) && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border-2 border-red-500/30 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                                            <Shield className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="font-black text-red-400 uppercase text-base tracking-wide">Critical Priority</h4>
                                                <span className="px-3 py-1 text-xs rounded-full bg-red-500/30 text-red-200 font-black border border-red-500/40">
                                                    URGENT
                                                </span>
                                            </div>
                                            <p className="text-[var(--text-primary)] font-bold text-lg mb-3">Optimize Equipment</p>
                                            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                                                {data.equipment.missing_enchants.length > 0 && (
                                                    <li className="flex items-center gap-2 font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                        Add enchants to {data.equipment.missing_enchants.length} items (+2-3% performance)
                                                    </li>
                                                )}
                                                {data.equipment.missing_gems.length > 0 && (
                                                    <li className="flex items-center gap-2 font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                        Socket gems in {data.equipment.missing_gems.length} slots (+1-2% stats)
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* High: Tier Set Progress */}
                        {data.equipment && data.equipment.tier_pieces < 4 && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-35 transition-opacity" />
                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-2 border-yellow-500/30 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="font-black text-yellow-400 uppercase text-base tracking-wide">High Priority</h4>
                                            </div>
                                            <p className="text-[var(--text-primary)] font-bold text-lg mb-3">Complete Tier Set</p>
                                            <p className="text-sm text-[var(--text-secondary)] font-medium">
                                                You have {data.equipment.tier_pieces}/5 tier pieces. Get {4 - data.equipment.tier_pieces} more for 4-piece bonus (+15-20% performance boost)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Medium: Mythic+ Score */}
                        {data.mythic_plus && data.mythic_plus.score < 2500 && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-15 group-hover:opacity-30 transition-opacity" />
                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-2 border-blue-500/30 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                            <Trophy className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="font-black text-blue-400 uppercase text-base tracking-wide">Medium Priority</h4>
                                            </div>
                                            <p className="text-[var(--text-primary)] font-bold text-lg mb-3">Push Mythic+ Rating</p>
                                            <p className="text-sm text-[var(--text-secondary)] font-medium">
                                                {data.mythic_plus.score < 2000
                                                    ? `Current score: ${data.mythic_plus.score}. Push +10s or higher in all dungeons to reach 2000+ (Advanced tier)`
                                                    : `Current score: ${data.mythic_plus.score}. Time all +15s to reach 2500+ (Expert tier)`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Raid Progression */}
                        {data.raids && !data.raids.summary.includes('8/8') && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-15 group-hover:opacity-30 transition-opacity" />
                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-2 border-purple-500/30 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                            <Swords className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="font-black text-purple-400 uppercase text-base tracking-wide">Progression</h4>
                                            </div>
                                            <p className="text-[var(--text-primary)] font-bold text-lg mb-3">Continue Raid Progression</p>
                                            <p className="text-sm text-[var(--text-secondary)] font-medium">
                                                Current: {data.raids.summary}. Push higher difficulties for better loot and Midnight preparation
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Missing Essentials */}
            {data.missing_essentials.length > 0 && (
                <motion.div
                    variants={fadeInUp}
                    className="relative"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl blur-xl opacity-25" />

                    <div className="relative bg-[var(--bg-card)] border-2 border-red-500/40 p-8 rounded-3xl shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/40">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-red-400 uppercase tracking-tight">Missing Essentials</h3>
                        </div>

                        <ul className="space-y-3">
                            {data.missing_essentials.map((item, index) => (
                                <li
                                    key={index}
                                    className="group flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-secondary)] border-2 border-[var(--border)] hover:border-red-500/30 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <X className="w-5 h-5 text-red-400" />
                                    </div>
                                    <span className="text-[var(--text-primary)] font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            )}

            {/* Overall Readiness Score */}
            <motion.div
                variants={fadeInUp}
                className="relative"
            >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-[var(--accent)] to-purple-500 rounded-3xl blur-2xl opacity-25" />

                <div className="relative bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-secondary)] to-[var(--bg-card)] border-2 border-[var(--border)] p-10 md:p-12 rounded-3xl hover:border-[var(--accent)] transition-all shadow-2xl">
                    <div className="text-center">
                        {/* Score Circle */}
                        <div className="relative inline-flex items-center justify-center w-72 h-72 md:w-96 md:h-96 mb-8">
                            {/* Background glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 rounded-full blur-2xl" />

                            {/* Mobile SVG (w-72 = 288px, center = 144, radius = 120) */}
                            <svg className="w-full h-full transform -rotate-90 absolute inset-0 md:hidden" viewBox="0 0 288 288">
                                <circle
                                    cx="144"
                                    cy="144"
                                    r="120"
                                    stroke="var(--border)"
                                    strokeWidth="20"
                                    fill="none"
                                    opacity="0.3"
                                />
                                <motion.circle
                                    cx="144"
                                    cy="144"
                                    r="120"
                                    stroke="url(#scoreGradientMobile)"
                                    strokeWidth="20"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 120}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                                    animate={{
                                        strokeDashoffset: 2 * Math.PI * 120 * (1 - data.readiness_score / 100),
                                    }}
                                    transition={{ duration: 2, ease: 'easeOut' }}
                                    filter="drop-shadow(0 0 10px var(--accent))"
                                />
                                <defs>
                                    <linearGradient id="scoreGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="var(--accent)" />
                                        <stop offset="50%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="var(--accent)" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Desktop SVG (w-96 = 384px, center = 192, radius = 160) */}
                            <svg className="w-full h-full transform -rotate-90 absolute inset-0 hidden md:block" viewBox="0 0 384 384">
                                <circle
                                    cx="192"
                                    cy="192"
                                    r="160"
                                    stroke="var(--border)"
                                    strokeWidth="24"
                                    fill="none"
                                    opacity="0.3"
                                />
                                <motion.circle
                                    cx="192"
                                    cy="192"
                                    r="160"
                                    stroke="url(#scoreGradientDesktop)"
                                    strokeWidth="24"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 160}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 160 }}
                                    animate={{
                                        strokeDashoffset: 2 * Math.PI * 160 * (1 - data.readiness_score / 100),
                                    }}
                                    transition={{ duration: 2, ease: 'easeOut' }}
                                    filter="drop-shadow(0 0 12px var(--accent))"
                                />
                                <defs>
                                    <linearGradient id="scoreGradientDesktop" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="var(--accent)" />
                                        <stop offset="50%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="var(--accent)" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <div className="relative z-10 flex flex-col items-center justify-center px-4">
                                <span className={`text-5xl md:text-7xl lg:text-8xl font-black ${getScoreColor(data.readiness_score)} drop-shadow-2xl`}>
                                    {data.readiness_score}%
                                </span>
                                <span className="text-sm md:text-lg mt-3 md:mt-4 font-black uppercase tracking-widest text-[var(--accent)] px-3 md:px-5 py-1 md:py-1.5 bg-[var(--accent)]/10 rounded-full border-2 border-[var(--accent)]/30">
                                    {getScoreLabel(data.readiness_score)}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-purple-500 uppercase mb-4 tracking-tight">
                            Overall Midnight Readiness
                        </h3>
                        <p className="text-lg md:text-xl text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">
                            Based on lore mastery, collections, housing prep, and Void affinity
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
