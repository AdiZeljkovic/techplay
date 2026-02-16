'use client';

import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, X, TrendingUp, Target, Zap, Shield, Trophy, Swords } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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
        <div className="space-y-8">
            {/* Profesor Buffy's AI Tips */}
            <motion.div
                variants={fadeInUp}
                className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl hover:border-[var(--accent)] transition-colors"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] uppercase">
                            Profesor Buffy's Tips
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            AI-powered Midnight expansion guidance
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {data.ai_advice.map((tip, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-4 p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white">
                                {index + 1}
                            </div>
                            <p className="flex-1 text-[var(--text-primary)] leading-relaxed">{tip}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Character Improvement Roadmap */}
            <motion.div
                variants={fadeInUp}
                className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl hover:border-[var(--accent)] transition-colors"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-[var(--accent)] flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] uppercase">
                            Improvement Roadmap
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Prioritized actions to optimize your character
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Critical: Equipment Optimization */}
                    {data.equipment && (data.equipment.missing_enchants.length > 0 || data.equipment.missing_gems.length > 0) && (
                        <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-red-400 uppercase text-sm">Critical Priority</h4>
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 font-semibold">
                                            URGENT
                                        </span>
                                    </div>
                                    <p className="text-[var(--text-primary)] font-semibold mb-2">Optimize Equipment</p>
                                    <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                                        {data.equipment.missing_enchants.length > 0 && (
                                            <li>• Add enchants to {data.equipment.missing_enchants.length} items (+2-3% performance)</li>
                                        )}
                                        {data.equipment.missing_gems.length > 0 && (
                                            <li>• Socket gems in {data.equipment.missing_gems.length} slots (+1-2% stats)</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* High: Tier Set Progress */}
                    {data.equipment && data.equipment.tier_pieces < 4 && (
                        <div className="p-5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-yellow-400 uppercase text-sm">High Priority</h4>
                                    </div>
                                    <p className="text-[var(--text-primary)] font-semibold mb-2">Complete Tier Set</p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        You have {data.equipment.tier_pieces}/5 tier pieces. Get {4 - data.equipment.tier_pieces} more for 4-piece bonus (+15-20% performance boost)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Medium: Mythic+ Score */}
                    {data.mythic_plus && data.mythic_plus.score < 2500 && (
                        <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-blue-400 uppercase text-sm">Medium Priority</h4>
                                    </div>
                                    <p className="text-[var(--text-primary)] font-semibold mb-2">Push Mythic+ Rating</p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {data.mythic_plus.score < 2000
                                            ? `Current score: ${data.mythic_plus.score}. Push +10s or higher in all dungeons to reach 2000+ (Advanced tier)`
                                            : `Current score: ${data.mythic_plus.score}. Time all +15s to reach 2500+ (Expert tier)`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Raid Progression */}
                    {data.raids && !data.raids.summary.includes('8/8') && (
                        <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/20">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Swords className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-purple-400 uppercase text-sm">Progression</h4>
                                    </div>
                                    <p className="text-[var(--text-primary)] font-semibold mb-2">Continue Raid Progression</p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Current: {data.raids.summary}. Push higher difficulties for better loot and Midnight preparation
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Missing Essentials */}
            {data.missing_essentials.length > 0 && (
                <motion.div
                    variants={fadeInUp}
                    className="bg-[var(--bg-card)] border border-red-500/30 p-8 rounded-3xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                        <h3 className="text-2xl font-bold text-red-400 uppercase">Missing Essentials</h3>
                    </div>

                    <ul className="space-y-3">
                        {data.missing_essentials.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-center gap-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
                            >
                                <X className="w-6 h-6 text-red-400" />
                                <span className="text-[var(--text-primary)]">{item}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {/* Overall Readiness Score */}
            <motion.div
                variants={fadeInUp}
                className="bg-[var(--bg-card)] border border-[var(--border)] p-10 rounded-3xl hover:border-[var(--accent)] transition-colors"
            >
                <div className="text-center">
                    {/* Score Circle */}
                    <div className="relative inline-flex items-center justify-center w-60 h-60 md:w-72 md:h-72 mb-8">
                        <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                            <circle
                                cx="144"
                                cy="144"
                                r="130"
                                stroke="var(--border)"
                                strokeWidth="16"
                                fill="none"
                            />
                            <motion.circle
                                cx="144"
                                cy="144"
                                r="130"
                                stroke="var(--accent)"
                                strokeWidth="16"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 130}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 130 }}
                                animate={{
                                    strokeDashoffset: 2 * Math.PI * 130 * (1 - data.readiness_score / 100),
                                }}
                                transition={{ duration: 2, ease: 'easeOut' }}
                            />
                        </svg>

                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <span className={`text-7xl md:text-8xl font-bold ${getScoreColor(data.readiness_score)}`}>
                                {data.readiness_score}%
                            </span>
                            <span className="text-lg mt-3 font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                {getScoreLabel(data.readiness_score)}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] uppercase mb-3">
                        Overall Midnight Readiness
                    </h3>
                    <p className="text-base md:text-lg text-[var(--text-secondary)]">
                        Based on lore mastery, collections, housing prep, and Void affinity
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
