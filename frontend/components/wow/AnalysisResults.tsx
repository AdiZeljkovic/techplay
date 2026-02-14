"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles, AlertCircle, Share2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface AnalysisResultsProps {
    data: {
        character: {
            name: string;
            level: number;
            class: string;
            race: string;
            faction: string;
            achievement_points: number;
        };
        readiness_score: number;
        ai_advice: string[];
        missing_essentials: string[];
        void_mounts_count: number;
        has_void_elf: boolean;
    };
}

export default function AnalysisResults({ data }: AnalysisResultsProps) {
    const getScoreColor = (score: number) => {
        if (score >= 75) return { from: "#10b981", to: "#059669" }; // green
        if (score >= 50) return { from: "#f59e0b", to: "#d97706" }; // yellow
        return { from: "#ef4444", to: "#dc2626" }; // red
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return "Legendary";
        if (score >= 75) return "Epic";
        if (score >= 50) return "Rare";
        if (score >= 25) return "Uncommon";
        return "Common";
    };

    const handleShare = async () => {
        const url = window.location.href;
        const text = `My ${data.character.name} has ${data.readiness_score}% readiness for WoW: Midnight!`;

        if (navigator.share) {
            try {
                await navigator.share({ title: "WoW Character Analysis", text, url });
            } catch (error) {
                // User cancelled share
            }
        } else {
            await navigator.clipboard.writeText(`${text} ${url}`);
            toast.success("Link copied to clipboard!");
        }
    };

    const scoreColors = getScoreColor(data.readiness_score);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Character Header */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                            {data.character.name}
                        </h2>
                        <p className="text-[var(--text-muted)]">
                            Level {data.character.level} {data.character.race} {data.character.class}
                        </p>
                    </div>
                    <Button variant="ghost" onClick={handleShare} size="sm">
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                </div>

                <div className="flex gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-[var(--text-secondary)]">
                            {data.character.achievement_points.toLocaleString()} Achievement Points
                        </span>
                    </div>
                    {data.has_void_elf && (
                        <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1 rounded-full">
                            <Check className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300 text-xs font-semibold">Void Elf Unlocked</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Readiness Score Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8">
                <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-48 h-48 mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke="var(--border)"
                                strokeWidth="12"
                                fill="none"
                            />
                            <motion.circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke={scoreColors.from}
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 88}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - data.readiness_score / 100) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="text-5xl font-bold text-[var(--text-primary)]"
                            >
                                {data.readiness_score}%
                            </motion.span>
                            <span className="text-sm text-[var(--text-muted)] mt-1">
                                {getScoreLabel(data.readiness_score)}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        Midnight Readiness Score
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                        Based on achievements, mounts, and lore completion
                    </p>
                </div>
            </div>

            {/* AI Advice */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        Profesor Buffy's Recommendations
                    </h3>
                </div>

                <div className="space-y-3">
                    {data.ai_advice.map((tip, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 bg-[var(--bg-elevated)] p-4 rounded-lg"
                        >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                                {index + 1}
                            </div>
                            <p className="text-[var(--text-primary)] leading-relaxed">{tip}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Missing Essentials */}
            {data.missing_essentials.length > 0 && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">
                            Missing Essentials
                        </h3>
                    </div>

                    <ul className="space-y-2">
                        {data.missing_essentials.map((item, index) => (
                            <li key={index} className="flex items-center gap-3 text-[var(--text-secondary)]">
                                <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Stats Footer */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                        <p className="text-3xl font-bold text-[var(--accent)]">
                            {data.void_mounts_count}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Void Mounts</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-[var(--accent)]">
                            {data.character.faction}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Faction</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
