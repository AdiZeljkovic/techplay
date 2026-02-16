"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles, AlertCircle, Share2, Check, X, ExternalLink, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import axios from "@/lib/axios";

// TechPlay Design System - Simple animations
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

interface AnalysisResultsProps {
    data: {
        id?: number;
        character: {
            name: string;
            level: number;
            class: string;
            race: string;
            faction: string;
            achievement_points: number;
            portrait_url?: string | null;
        };
        readiness_score: number;
        ai_advice: string[];
        missing_essentials: string[];
        daily_priority?: string[];
        void_mounts_count: number;
        has_void_elf: boolean;
        housing?: {
            housing_score: number;
            mount_count: number;
            mount_target: number;
            achievement_count: number;
            void_mount_count: number;
            rating: string;
        };
        timeline?: {
            days_until_launch: number;
            launch_date: string;
            urgency_level: string;
            limited_content_available: {
                royal_voidwing: boolean;
                faceless_one_title: boolean;
            };
        };
        checklist?: any;
    };
}

export default function AnalysisResults({ data }: AnalysisResultsProps) {
    const getScoreLabel = (score: number) => {
        if (score >= 90) return "Legendary";
        if (score >= 75) return "Epic";
        if (score >= 50) return "Rare";
        if (score >= 25) return "Uncommon";
        return "Common";
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return "text-green-400";
        if (score >= 50) return "text-yellow-400";
        return "text-orange-400";
    };

    const handleShare = async () => {
        const url = window.location.href;
        const text = `My ${data.character.name} has ${data.readiness_score}% Midnight readiness! 🏆`;

        // Track share event
        if (data.id) {
            try {
                await axios.post(`/wow/analysis/${data.id}/share`);
            } catch (error) {
                console.error('Failed to track share:', error);
            }
        }

        if (navigator.share) {
            try {
                await navigator.share({ title: "WoW Midnight Readiness", text, url });
                toast.success("Shared successfully!");
            } catch (error) {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(`${text} ${url}`);
            toast.success("Link copied to clipboard!");
        }
    };

    const armoryUrl = `https://worldofwarcraft.blizzard.com/en-us/character/us/${data.character.name.toLowerCase()}`;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8 max-w-5xl mx-auto"
        >
            {/* Character Card */}
            <motion.div
                variants={fadeInUp}
                className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl hover:border-[var(--accent)] transition-colors"
            >
                <div className="flex items-start gap-6 flex-wrap">
                    {/* Character Portrait */}
                    {data.character.portrait_url && (
                        <div className="relative flex-shrink-0">
                            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-[var(--border)]">
                                <img
                                    src={data.character.portrait_url}
                                    alt={data.character.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-[var(--accent)] text-white border-2 border-[var(--bg-card)]">
                                {data.character.level}
                            </div>
                        </div>
                    )}

                    {/* Character Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">
                                    {data.character.name}
                                </h2>
                                <p className="text-lg md:text-xl text-[var(--text-secondary)]">
                                    {data.character.race} {data.character.class}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => window.open(armoryUrl, '_blank')}
                                    size="sm"
                                    className="border border-[var(--border)]"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleShare}
                                    size="sm"
                                    className="border border-[var(--border)]"
                                >
                                    <Share2 className="w-4 h-4 mr-1" />
                                    <span>Share</span>
                                </Button>
                            </div>
                        </div>

                        {/* Character Stats Badges */}
                        <div className="flex gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                                <Shield className="w-5 h-5 text-[var(--accent)]" />
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                    {data.character.achievement_points.toLocaleString()} Points
                                </span>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                    {data.character.faction}
                                </span>
                            </div>

                            {data.has_void_elf && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] border border-[var(--accent)] text-white">
                                    <Check className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Void Elf Ready</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

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
                            <p className="flex-1 text-[var(--text-primary)] leading-relaxed">
                                {tip}
                            </p>
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
                        <h3 className="text-2xl font-bold text-red-400 uppercase">
                            Missing Essentials
                        </h3>
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
                                animate={{ strokeDashoffset: 2 * Math.PI * 130 * (1 - data.readiness_score / 100) }}
                                transition={{ duration: 2, ease: "easeOut" }}
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
        </motion.div>
    );
}
