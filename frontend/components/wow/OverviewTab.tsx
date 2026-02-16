'use client';

import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, X } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface OverviewTabProps {
    data: {
        readiness_score: number;
        ai_advice: string[];
        missing_essentials: string[];
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
