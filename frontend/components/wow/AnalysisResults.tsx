"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles, AlertCircle, Share2, Check, X, ExternalLink, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getClassColor, getFactionTheme, getScoreQuality } from "@/data/wow-theme";
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
            {/* COMMAND CENTER TITLE */}
            <div className="text-center py-6">
                <motion.h1
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-5xl font-bold uppercase mb-3"
                    style={{
                        background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF8C00)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontFamily: 'serif',
                        letterSpacing: '0.1em',
                    }}
                >
                    <Trophy className="inline w-10 h-10 md:w-12 md:h-12 mb-2 mr-3" style={{ color: '#FFD700', WebkitTextFillColor: '#FFD700' }} />
                    MIDNIGHT COMMAND CENTER
                </motion.h1>
                <p className="text-lg md:text-xl italic" style={{ color: '#C9B388', fontFamily: 'serif' }}>
                    Complete Readiness Analysis for {data.character.name}
                </p>
            </div>

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
            <div
                className="relative border-2 rounded-2xl p-6 overflow-hidden"
                style={{
                    background: 'linear-gradient(to bottom, #f5f5dc 0%, #e8e0c8 100%)',
                    borderColor: classColor,
                    boxShadow: `0 8px 20px rgba(0,0,0,0.3), 0 0 30px ${classColor}40`,
                }}
            >
                <div className="absolute top-4 right-4 text-6xl opacity-10">{factionTheme.logo}</div>
                <div
                    className="absolute inset-0 opacity-10 blur-3xl pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${classColor}, transparent)` }}
                />

                <div className="relative flex items-start gap-6 flex-wrap">
                    {data.character.portrait_url && (
                        <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 0.6 }}
                            className="relative flex-shrink-0"
                        >
                            <div
                                className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-4 shadow-2xl"
                                style={{ borderColor: classColor, boxShadow: `0 0 30px ${classColor}60` }}
                            >
                                <img src={data.character.portrait_url} alt={data.character.name} className="w-full h-full object-cover" />
                            </div>
                            <div
                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2"
                                style={{ backgroundColor: classColor, color: '#000', borderColor: '#FFF' }}
                            >
                                {data.character.level}
                            </div>
                        </motion.div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: classColor }}>
                                    {data.character.name}
                                </h2>
                                <p className="text-base md:text-lg" style={{ color: '#5D4037' }}>
                                    {data.character.race} {data.character.class}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => window.open(armoryUrl, '_blank')} size="sm">
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" onClick={handleShare} size="sm">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(139,115,85,0.2)' }}>
                                <Shield className="w-4 h-4" style={{ color: classColor }} />
                                <span className="text-sm font-semibold" style={{ color: '#5D4037' }}>
                                    {data.character.achievement_points.toLocaleString()} Points
                                </span>
                            </div>

                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${factionTheme.gradient}`}>
                                <span className="text-sm font-semibold text-white">{factionTheme.logo} {data.character.faction}</span>
                            </div>

                            {data.has_void_elf && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                                    style={{ background: 'rgba(147,112,219,0.2)', borderColor: '#9370DB' }}
                                >
                                    <Check className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-purple-700">Void Elf Ready</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* HOUSING READINESS */}
            {data.housing && <HousingReadiness housing={data.housing} />}

            {/* PREPARATION CHECKLIST */}
            {data.checklist && <PreparationChecklist checklist={data.checklist} />}

            {/* AI ADVICE */}
            <div
                className="p-6 rounded-2xl"
                style={{
                    background: 'linear-gradient(to bottom, #f5f5dc 0%, #e8e0c8 100%)',
                    border: '6px solid #8B7355',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #FF8C00, #FF6B00)', boxShadow: '0 4px 8px rgba(255,140,0,0.5)' }}
                    >
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold uppercase" style={{ color: '#3E2723' }}>Profesor Buffy's Tips</h3>
                        <p className="text-xs italic" style={{ color: '#8B7355' }}>AI-powered Midnight guidance</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {data.ai_advice.map((tip, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(139,115,85,0.15)', border: '2px solid #C9B388' }}>
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                                    style={{ background: `linear-gradient(135deg, ${classColor}, ${classColor}DD)`, color: '#FFF' }}
                                >
                                    {index + 1}
                                </div>
                                <p className="flex-1 font-medium" style={{ color: '#3E2723' }}>{tip}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* MISSING ESSENTIALS */}
            {data.missing_essentials.length > 0 && (
                <div
                    className="p-6 rounded-2xl"
                    style={{ background: 'linear-gradient(to bottom, #FFF5F5, #FFE8E8)', border: '4px solid rgba(220,20,60,0.5)' }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <h3 className="text-xl font-bold uppercase" style={{ color: '#8B0000' }}>Missing Essentials</h3>
                    </div>
                    <ul className="space-y-2">
                        {data.missing_essentials.map((item, index) => (
                            <li key={index} className="flex items-center gap-3" style={{ color: '#5D4037' }}>
                                <X className="w-5 h-5 text-red-500" />
                                <span className="font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* READINESS SCORE SUMMARY */}
            <div
                className="relative p-8 rounded-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #2a1810, #1a0f08)',
                    border: '8px solid',
                    borderImage: 'linear-gradient(135deg, #5D4037, #3E2723) 1',
                    boxShadow: `0 8px 20px rgba(0,0,0,0.6), 0 0 30px ${scoreColor}60`,
                }}
            >
                <div className="relative text-center">
                    <div className="relative inline-flex items-center justify-center w-40 h-40 md:w-48 md:h-48 mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
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
                                style={{ filter: `drop-shadow(0 0 8px ${scoreColor})` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-4xl md:text-5xl font-bold"
                                style={{ color: scoreColor }}
                            >
                                {data.readiness_score}%
                            </motion.span>
                            <span className="text-sm mt-1 font-bold uppercase" style={{ color: scoreColor }}>
                                {getScoreLabel(data.readiness_score)}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-bold uppercase mb-2" style={{ color: '#FFD700' }}>
                        Overall Midnight Readiness
                    </h3>
                    <p className="text-base md:text-lg" style={{ color: '#C9B388' }}>
                        Based on lore, collections, housing, and Void mastery
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
