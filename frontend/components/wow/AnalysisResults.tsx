"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles, AlertCircle, Share2, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getClassColor, getFactionTheme, getScoreQuality } from "@/data/wow-theme";
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
            portrait_url?: string | null;
        };
        readiness_score: number;
        ai_advice: string[];
        missing_essentials: string[];
        void_mounts_count: number;
        has_void_elf: boolean;
    };
}

export default function AnalysisResults({ data }: AnalysisResultsProps) {
    const classColor = getClassColor(data.character.class);
    const factionTheme = getFactionTheme(data.character.faction);
    const scoreColor = getScoreQuality(data.readiness_score);

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

    const armoryUrl = `https://worldofwarcraft.blizzard.com/en-us/character/us/${data.character.name.toLowerCase()}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Character Header with Portrait */}
            <div
                className="relative bg-[var(--bg-card)] border-2 rounded-2xl p-6 overflow-hidden"
                style={{ borderColor: classColor }}
            >
                {/* Faction Watermark */}
                <div className="absolute top-4 right-4 text-6xl opacity-5">
                    {factionTheme.logo}
                </div>

                {/* Class Glow Effect */}
                <div
                    className="absolute inset-0 opacity-10 blur-3xl"
                    style={{ background: `radial-gradient(circle at top right, ${classColor}, transparent)` }}
                />

                <div className="relative flex items-start gap-6">
                    {/* Character Portrait */}
                    {data.character.portrait_url && (
                        <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 0.6 }}
                            className="relative flex-shrink-0"
                        >
                            <div
                                className="w-32 h-32 rounded-xl overflow-hidden border-4 shadow-2xl"
                                style={{
                                    borderColor: classColor,
                                    boxShadow: `0 0 30px ${classColor}40`
                                }}
                            >
                                <img
                                    src={data.character.portrait_url}
                                    alt={data.character.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Level Badge */}
                            <div
                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 border-[var(--bg-card)]"
                                style={{
                                    backgroundColor: classColor,
                                    color: '#000'
                                }}
                            >
                                {data.character.level}
                            </div>
                        </motion.div>
                    )}

                    {/* Character Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2
                                    className="text-3xl font-bold mb-1"
                                    style={{ color: classColor }}
                                >
                                    {data.character.name}
                                </h2>
                                <p className="text-[var(--text-muted)] text-lg">
                                    {data.character.race} {data.character.class}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => window.open(armoryUrl, '_blank')}
                                    size="sm"
                                    title="View on Armory"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" onClick={handleShare} size="sm">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-4 flex-wrap">
                            {/* Achievement Points */}
                            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] px-4 py-2 rounded-lg">
                                <Shield className="w-4 h-4" style={{ color: classColor }} />
                                <span className="text-[var(--text-secondary)] text-sm">
                                    {data.character.achievement_points.toLocaleString()} Points
                                </span>
                            </div>

                            {/* Faction Badge */}
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${factionTheme.gradient}`}
                            >
                                <span className="text-sm font-semibold">
                                    {factionTheme.logo} {data.character.faction}
                                </span>
                            </div>

                            {/* Void Elf Badge */}
                            {data.has_void_elf && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/50"
                                >
                                    <Check className="w-4 h-4 text-purple-400" />
                                    <span className="text-purple-300 text-sm font-semibold">Void Elf Ready</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Readiness Score Card with Legendary Glow */}
            <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 overflow-hidden">
                {/* Animated Background Glow */}
                <motion.div
                    className="absolute inset-0 opacity-20 blur-3xl"
                    animate={{
                        background: [
                            `radial-gradient(circle at 20% 50%, ${scoreColor}, transparent)`,
                            `radial-gradient(circle at 80% 50%, ${scoreColor}, transparent)`,
                            `radial-gradient(circle at 20% 50%, ${scoreColor}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                />

                <div className="relative text-center">
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
                                stroke={scoreColor}
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 88}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - data.readiness_score / 100) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                style={{
                                    filter: `drop-shadow(0 0 8px ${scoreColor})`
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="text-5xl font-bold"
                                style={{ color: scoreColor }}
                            >
                                {data.readiness_score}%
                            </motion.span>
                            <span
                                className="text-sm mt-1 font-semibold"
                                style={{ color: scoreColor }}
                            >
                                {getScoreLabel(data.readiness_score)}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        Midnight Readiness Score
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                        Based on achievements, mounts, and Quel'Thalas lore completion
                    </p>
                </div>
            </div>

            {/* AI Advice - Profesor Buffy's Recommendations */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">
                            Profesor Buffy's Recommendations
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">AI-powered analysis for Midnight expansion</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {data.ai_advice.map((tip, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            className="group relative"
                        >
                            <div className="flex items-start gap-3 bg-[var(--bg-elevated)] p-4 rounded-lg hover:bg-[var(--bg-card)] transition-all">
                                <div
                                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm"
                                    style={{
                                        backgroundColor: `${classColor}30`,
                                        color: classColor,
                                        border: `2px solid ${classColor}`
                                    }}
                                >
                                    {index + 1}
                                </div>
                                <p className="text-[var(--text-primary)] leading-relaxed flex-1">{tip}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Missing Essentials */}
            {data.missing_essentials.length > 0 && (
                <div className="bg-[var(--bg-card)] border-2 border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">
                            Missing Essentials for Midnight
                        </h3>
                    </div>

                    <ul className="space-y-2">
                        {data.missing_essentials.map((item, index) => (
                            <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span>{item}</span>
                            </motion.li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Stats Footer */}
            <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                        <motion.p
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="text-4xl font-bold mb-1"
                            style={{ color: classColor }}
                        >
                            {data.void_mounts_count}
                        </motion.p>
                        <p className="text-sm text-[var(--text-muted)]">Void-Themed Mounts</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Ready for Midnight's dark aesthetic</p>
                    </div>
                    <div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring" }}
                            className={`text-4xl font-bold mb-1 ${factionTheme.textColor}`}
                        >
                            {factionTheme.logo}
                        </motion.div>
                        <p className="text-sm text-[var(--text-muted)]">{data.character.faction} Loyalty</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Quel'Thalas awaits your arrival</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
