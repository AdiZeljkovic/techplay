"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles, AlertCircle, Share2, Check, X, ExternalLink, Trophy, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getClassColor, getFactionTheme, getScoreQuality } from "@/data/wow-theme";
import { MidnightTheme, QualityColors, glassCard } from "@/lib/wow-midnight-theme";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import TimelineTracker from "./TimelineTracker";
import PreparationChecklist from "./PreparationChecklist";
import HousingReadiness from "./HousingReadiness";
import DailyPlanner from "./DailyPlanner";

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

    const getQualityColors = (score: number) => {
        if (score >= 90) return QualityColors.legendary;
        if (score >= 75) return QualityColors.epic;
        if (score >= 60) return QualityColors.rare;
        if (score >= 40) return QualityColors.uncommon;
        return QualityColors.common;
    };

    const qualityColors = getQualityColors(data.readiness_score);

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* MIDNIGHT COMMAND CENTER TITLE */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.7, type: "spring" }}
                className="relative text-center py-10 overflow-hidden rounded-2xl"
                style={{
                    background: MidnightTheme.backgrounds.void,
                    border: `3px solid ${MidnightTheme.light.primary}`,
                    boxShadow: `0 0 50px ${MidnightTheme.light.glow}, ${MidnightTheme.shadows.depth}`,
                }}
            >
                {/* Animated Background */}
                <motion.div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 30% 50%, ${MidnightTheme.void.primary}, transparent)`,
                            `radial-gradient(circle at 70% 50%, ${MidnightTheme.light.primary}, transparent)`,
                            `radial-gradient(circle at 30% 50%, ${MidnightTheme.void.primary}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative z-10">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                        <Trophy
                            className="inline w-14 h-14 md:w-16 md:h-16 mb-4"
                            style={{
                                color: MidnightTheme.light.primary,
                                filter: `drop-shadow(0 0 20px ${MidnightTheme.light.glow})`,
                            }}
                        />
                    </motion.div>

                    <motion.h1
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-4xl md:text-6xl font-bold uppercase mb-3"
                        style={{
                            background: MidnightTheme.gradients.voidToLight,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: `0 0 30px ${MidnightTheme.void.glow}`,
                            fontFamily: 'serif',
                            letterSpacing: '0.15em',
                        }}
                    >
                        MIDNIGHT COMMAND CENTER
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg md:text-xl italic"
                        style={{ color: MidnightTheme.text.void, fontFamily: 'serif' }}
                    >
                        Complete Readiness Analysis for <span style={{ color: classColor, textShadow: `0 0 10px ${classColor}` }}>{data.character.name}</span>
                    </motion.p>
                </div>
            </motion.div>

            {/* TIMELINE TRACKER */}
            {data.timeline && <TimelineTracker timeline={data.timeline} />}

            {/* DAILY PLANNER */}
            {data.daily_priority && data.daily_priority.length > 0 && (
                <DailyPlanner
                    dailyPriority={data.daily_priority}
                    daysUntilLaunch={data.timeline?.days_until_launch || 16}
                />
            )}

            {/* CHARACTER CARD */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative rounded-2xl p-8 overflow-hidden"
                style={{
                    ...glassCard,
                    border: `3px solid ${classColor}`,
                    boxShadow: `0 0 40px ${classColor}60, ${MidnightTheme.shadows.depth}`,
                }}
            >
                {/* Class Color Glow */}
                <motion.div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at top right, ${classColor}, transparent)`,
                            `radial-gradient(circle at bottom left, ${classColor}, transparent)`,
                            `radial-gradient(circle at top right, ${classColor}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />

                {/* Faction Logo Watermark */}
                <div
                    className="absolute top-6 right-6 text-8xl opacity-5 pointer-events-none"
                    style={{ filter: `drop-shadow(0 0 20px ${classColor})` }}
                >
                    {factionTheme.logo}
                </div>

                <div className="relative z-10 flex items-start gap-6 flex-wrap">
                    {/* Character Portrait */}
                    {data.character.portrait_url && (
                        <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="relative flex-shrink-0"
                        >
                            <div
                                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4"
                                style={{
                                    borderColor: classColor,
                                    boxShadow: `0 0 30px ${classColor}80, ${MidnightTheme.shadows.depth}`,
                                }}
                            >
                                <img
                                    src={data.character.portrait_url}
                                    alt={data.character.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Level Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-3"
                                style={{
                                    background: `linear-gradient(135deg, ${classColor}, ${classColor}DD)`,
                                    color: '#FFF',
                                    borderColor: MidnightTheme.light.primary,
                                    boxShadow: `0 0 20px ${classColor}`,
                                }}
                            >
                                {data.character.level}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Character Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                            <div>
                                <h2
                                    className="text-3xl md:text-4xl font-bold mb-2"
                                    style={{
                                        color: classColor,
                                        textShadow: `0 0 15px ${classColor}80, 2px 2px 4px rgba(0,0,0,0.8)`,
                                    }}
                                >
                                    {data.character.name}
                                </h2>
                                <p
                                    className="text-lg md:text-xl font-semibold"
                                    style={{ color: MidnightTheme.text.bright }}
                                >
                                    {data.character.race} {data.character.class}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => window.open(armoryUrl, '_blank')}
                                    size="sm"
                                    style={{
                                        background: MidnightTheme.backgrounds.glassLight,
                                        border: `1px solid ${MidnightTheme.void.primary}`,
                                    }}
                                >
                                    <ExternalLink className="w-4 h-4" style={{ color: MidnightTheme.void.ethereal }} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleShare}
                                    size="sm"
                                    style={{
                                        background: MidnightTheme.backgrounds.glassLight,
                                        border: `1px solid ${MidnightTheme.light.primary}`,
                                    }}
                                >
                                    <Share2 className="w-4 h-4 mr-1" style={{ color: MidnightTheme.light.primary }} />
                                    <span style={{ color: MidnightTheme.text.bright }}>Share</span>
                                </Button>
                            </div>
                        </div>

                        {/* Character Stats Badges */}
                        <div className="flex gap-3 flex-wrap">
                            {/* Achievement Points */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                                style={{
                                    ...glassCard,
                                    border: `1px solid ${classColor}`,
                                }}
                            >
                                <Shield className="w-5 h-5" style={{ color: classColor }} />
                                <span className="text-sm font-bold" style={{ color: MidnightTheme.text.bright }}>
                                    {data.character.achievement_points.toLocaleString()} Points
                                </span>
                            </motion.div>

                            {/* Faction Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                                style={{
                                    background: `linear-gradient(to right, ${factionTheme.gradient})`,
                                    boxShadow: `0 0 15px rgba(${data.character.faction === 'Alliance' ? '0,112,221' : '220,20,60'}, 0.5)`,
                                }}
                            >
                                <span className="text-sm font-bold text-white">
                                    {factionTheme.logo} {data.character.faction}
                                </span>
                            </motion.div>

                            {/* Void Elf Badge */}
                            {data.has_void_elf && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.6, type: "spring" }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${MidnightTheme.void.primary}, ${MidnightTheme.void.deep})`,
                                        border: `2px solid ${MidnightTheme.void.ethereal}`,
                                        boxShadow: `0 0 20px ${MidnightTheme.void.glow}`,
                                    }}
                                >
                                    <Check className="w-5 h-5 text-white" />
                                    <span className="text-sm font-bold text-white">Void Elf Ready</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* HOUSING READINESS */}
            {data.housing && <HousingReadiness housing={data.housing} />}

            {/* PREPARATION CHECKLIST */}
            {data.checklist && <PreparationChecklist checklist={data.checklist} />}

            {/* PROFESOR BUFFY'S AI TIPS */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative p-8 rounded-2xl overflow-hidden"
                style={{
                    ...glassCard,
                    border: `3px solid ${MidnightTheme.void.primary}`,
                    boxShadow: MidnightTheme.shadows.voidGlow,
                }}
            >
                {/* Animated Glow */}
                <motion.div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 20% 80%, ${MidnightTheme.void.primary}, transparent)`,
                            `radial-gradient(circle at 80% 20%, ${MidnightTheme.light.warm}, transparent)`,
                            `radial-gradient(circle at 20% 80%, ${MidnightTheme.void.primary}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <motion.div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{
                                background: MidnightTheme.gradients.voidToLight,
                                boxShadow: `0 0 25px ${MidnightTheme.void.glow}`,
                            }}
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Sparkles className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h3
                                className="text-3xl font-bold uppercase"
                                style={{
                                    background: MidnightTheme.gradients.voidToLight,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Profesor Buffy's Tips
                            </h3>
                            <p className="text-sm italic" style={{ color: MidnightTheme.text.void }}>
                                AI-powered Midnight expansion guidance
                            </p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="space-y-4">
                        {data.ai_advice.map((tip, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                className="flex items-start gap-4 p-5 rounded-xl"
                                style={{
                                    background: MidnightTheme.backgrounds.glassLight,
                                    border: `2px solid ${MidnightTheme.void.primary}`,
                                    boxShadow: `0 0 15px ${MidnightTheme.void.glow}`,
                                }}
                                whileHover={{ scale: 1.02, x: 5 }}
                            >
                                <motion.div
                                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${classColor}, ${classColor}DD)`,
                                        color: '#FFF',
                                        boxShadow: `0 0 15px ${classColor}60`,
                                    }}
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                >
                                    {index + 1}
                                </motion.div>
                                <p
                                    className="flex-1 font-semibold leading-relaxed"
                                    style={{
                                        color: MidnightTheme.text.bright,
                                        textShadow: `0 0 8px ${MidnightTheme.void.glow}`,
                                    }}
                                >
                                    {tip}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* MISSING ESSENTIALS */}
            {data.missing_essentials.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="relative p-8 rounded-2xl overflow-hidden"
                    style={{
                        ...glassCard,
                        border: `3px solid ${MidnightTheme.urgency.critical}`,
                        boxShadow: MidnightTheme.shadows.urgencyGlow,
                    }}
                >
                    {/* Urgency Pulse */}
                    <motion.div
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        animate={{
                            background: [
                                `radial-gradient(circle at center, ${MidnightTheme.urgency.critical}, transparent)`,
                                `radial-gradient(circle at center, ${MidnightTheme.urgency.dark}, transparent)`,
                                `radial-gradient(circle at center, ${MidnightTheme.urgency.critical}, transparent)`,
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <AlertCircle
                                    className="w-8 h-8"
                                    style={{
                                        color: MidnightTheme.urgency.high,
                                        filter: `drop-shadow(0 0 15px ${MidnightTheme.urgency.glow})`,
                                    }}
                                />
                            </motion.div>
                            <h3
                                className="text-2xl font-bold uppercase"
                                style={{
                                    color: MidnightTheme.urgency.high,
                                    textShadow: `0 0 15px ${MidnightTheme.urgency.glow}`,
                                }}
                            >
                                Missing Essentials
                            </h3>
                        </div>

                        <ul className="space-y-3">
                            {data.missing_essentials.map((item, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + index * 0.1 }}
                                    className="flex items-center gap-4 p-4 rounded-lg"
                                    style={{
                                        background: MidnightTheme.backgrounds.glassLight,
                                        border: `1px solid ${MidnightTheme.urgency.dark}`,
                                    }}
                                >
                                    <X className="w-6 h-6" style={{ color: MidnightTheme.urgency.high }} />
                                    <span className="font-semibold" style={{ color: MidnightTheme.text.bright }}>
                                        {item}
                                    </span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            )}

            {/* OVERALL READINESS SCORE */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="relative p-10 rounded-2xl overflow-hidden"
                style={{
                    background: MidnightTheme.backgrounds.void,
                    border: `4px solid ${qualityColors.primary}`,
                    boxShadow: `0 0 60px ${qualityColors.glow}, ${MidnightTheme.shadows.depth}`,
                }}
            >
                {/* Quality Glow Animation */}
                <motion.div
                    className="absolute inset-0 opacity-25 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 50% 50%, ${qualityColors.primary}, transparent)`,
                            `radial-gradient(circle at 30% 70%, ${qualityColors.primary}, transparent)`,
                            `radial-gradient(circle at 70% 30%, ${qualityColors.primary}, transparent)`,
                            `radial-gradient(circle at 50% 50%, ${qualityColors.primary}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                />

                <div className="relative z-10 text-center">
                    {/* Crown Icon (if Legendary) */}
                    {data.readiness_score >= 90 && (
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 1, type: "spring" }}
                        >
                            <Crown
                                className="inline w-16 h-16 mb-4"
                                style={{
                                    color: qualityColors.primary,
                                    filter: `drop-shadow(0 0 20px ${qualityColors.glow})`,
                                }}
                            />
                        </motion.div>
                    )}

                    {/* Score Circle */}
                    <div className="relative inline-flex items-center justify-center w-60 h-60 md:w-72 md:h-72 mb-8">
                        <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                            <circle
                                cx="144"
                                cy="144"
                                r="130"
                                stroke={MidnightTheme.backgrounds.glassLight}
                                strokeWidth="16"
                                fill="none"
                            />
                            <motion.circle
                                cx="144"
                                cy="144"
                                r="130"
                                stroke={qualityColors.primary}
                                strokeWidth="16"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 130}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 130 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 130 * (1 - data.readiness_score / 100) }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                style={{
                                    filter: `drop-shadow(0 0 15px ${qualityColors.primary})`,
                                }}
                            />
                        </svg>

                        {/* Inner Glow */}
                        <motion.div
                            className="absolute inset-0 rounded-full opacity-40"
                            style={{
                                background: `radial-gradient(circle, ${qualityColors.glow}, transparent)`,
                            }}
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />

                        {/* Score Text */}
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.2, duration: 0.8, type: "spring" }}
                                className="text-7xl md:text-8xl font-bold"
                                style={{
                                    color: qualityColors.primary,
                                    textShadow: `0 0 30px ${qualityColors.glow}`,
                                }}
                            >
                                {data.readiness_score}%
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                className="text-lg mt-3 font-bold uppercase tracking-wider"
                                style={{
                                    color: qualityColors.primary,
                                    textShadow: `0 0 15px ${qualityColors.glow}`,
                                }}
                            >
                                {getScoreLabel(data.readiness_score)}
                            </motion.span>
                        </div>
                    </div>

                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                        className="text-3xl md:text-4xl font-bold uppercase mb-3"
                        style={{
                            background: MidnightTheme.gradients.voidToLight,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Overall Midnight Readiness
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8 }}
                        className="text-base md:text-lg"
                        style={{ color: MidnightTheme.text.void }}
                    >
                        Based on lore mastery, collections, housing prep, and Void affinity
                    </motion.p>
                </div>
            </motion.div>
        </motion.div>
    );
}
