"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Eye } from "lucide-react";
import axios from "@/lib/axios";
import { getClassColor, getFactionTheme } from "@/data/wow-theme";
import { MidnightTheme, glassCard } from "@/lib/wow-midnight-theme";
import { formatDistanceToNow } from "date-fns";

interface RecentAnalysis {
    id: number;
    character_name: string;
    realm_slug: string;
    region: string;
    class: string;
    race: string;
    faction: string;
    readiness_score: number;
    portrait_url: string | null;
    created_at: string;
    view_count: number;
}

interface WowRecentAnalysesProps {
    limit?: number;
}

export default function WowRecentAnalyses({ limit = 20 }: WowRecentAnalysesProps) {
    const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentAnalyses();
    }, []);

    const fetchRecentAnalyses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/wow/recent?limit=${limit}`);
            setAnalyses(response.data.data.recent || []);
        } catch (error) {
            console.error('Failed to fetch recent analyses:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#FF8000'; // Legendary
        if (score >= 75) return '#A335EE'; // Epic
        if (score >= 50) return '#0070DD'; // Rare
        if (score >= 25) return '#1EFF00'; // Uncommon
        return '#FFFFFF'; // Common
    };

    return (
        <motion.div
            className="relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
        >
            {/* Midnight Glass Header */}
            <motion.div
                className="relative mb-8 p-8 rounded-xl overflow-hidden"
                style={{
                    ...glassCard,
                    border: `2px solid ${MidnightTheme.light.primary}40`,
                    boxShadow: `
                        0 0 40px ${MidnightTheme.light.primary}30,
                        inset 0 0 40px ${MidnightTheme.light.primary}10
                    `
                }}
            >
                {/* Animated Background */}
                <motion.div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 50% 30%, ${MidnightTheme.light.primary}50, transparent 70%)`,
                            `radial-gradient(circle at 50% 70%, ${MidnightTheme.void.primary}50, transparent 70%)`,
                            `radial-gradient(circle at 50% 30%, ${MidnightTheme.light.primary}50, transparent 70%)`
                        ]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="text-center relative">
                    <motion.div
                        className="inline-block mb-4"
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <Clock className="w-10 h-10" style={{
                            color: MidnightTheme.light.primary,
                            filter: `drop-shadow(0 0 12px ${MidnightTheme.light.primary})`
                        }} />
                    </motion.div>

                    <h3
                        className="text-4xl md:text-5xl font-black uppercase tracking-wider mb-3"
                        style={{
                            background: `linear-gradient(to right, ${MidnightTheme.light.primary}, ${MidnightTheme.light.warm}, ${MidnightTheme.light.primary})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: `drop-shadow(0 0 20px ${MidnightTheme.light.primary}60)`
                        }}
                    >
                        Recent Analyses
                    </h3>
                    <p className="text-base" style={{
                        color: MidnightTheme.text.muted,
                        textShadow: `0 0 10px ${MidnightTheme.light.primary}40`
                    }}>
                        Champions recently tested for Midnight readiness
                    </p>
                </div>
            </motion.div>

            {/* Analysis Grid */}
            {loading ? (
                <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        className="w-14 h-14 border-4 rounded-full mx-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{
                            borderColor: `${MidnightTheme.light.primary} transparent ${MidnightTheme.void.primary} transparent`,
                            filter: `drop-shadow(0 0 10px ${MidnightTheme.light.primary})`
                        }}
                    />
                    <p className="mt-6" style={{ color: MidnightTheme.text.muted }}>Loading recent analyses...</p>
                </motion.div>
            ) : analyses.length === 0 ? (
                <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        ...glassCard,
                        padding: '3rem'
                    }}
                >
                    <Clock className="w-20 h-20 mx-auto mb-4 opacity-20" style={{ color: MidnightTheme.light.primary }} />
                    <p style={{ color: MidnightTheme.text.muted }}>No recent analyses found</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyses.map((analysis, index) => {
                        const classColor = getClassColor(analysis.class);
                        const factionTheme = getFactionTheme(analysis.faction);
                        const scoreColor = getScoreColor(analysis.readiness_score);

                        return (
                            <motion.div
                                key={analysis.id}
                                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: index * 0.04, type: "spring" }}
                                whileHover={{ y: -8, scale: 1.03 }}
                                className="relative group cursor-pointer"
                            >
                                <motion.div
                                    className="relative p-5 rounded-xl transition-all overflow-hidden"
                                    style={{
                                        ...glassCard,
                                        border: `2px solid ${MidnightTheme.void.primary}30`,
                                        boxShadow: `0 0 25px ${MidnightTheme.void.primary}20, inset 0 0 20px ${MidnightTheme.void.primary}10`
                                    }}
                                >
                                    {/* Subtle Animated Glow */}
                                    <motion.div
                                        className="absolute inset-0 opacity-10 pointer-events-none"
                                        animate={{
                                            background: [
                                                `radial-gradient(circle at 50% 30%, ${scoreColor}40, transparent 70%)`,
                                                `radial-gradient(circle at 50% 70%, ${MidnightTheme.void.primary}40, transparent 70%)`,
                                                `radial-gradient(circle at 50% 30%, ${scoreColor}40, transparent 70%)`
                                            ]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    {/* Character Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        {/* Portrait */}
                                        {analysis.portrait_url && (
                                            <div
                                                className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden"
                                                style={{
                                                    border: `3px solid ${classColor}`,
                                                    boxShadow: `0 0 10px ${classColor}50`,
                                                }}
                                            >
                                                <img
                                                    src={analysis.portrait_url}
                                                    alt={analysis.character_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Name & Info */}
                                        <div className="flex-1 min-w-0 relative">
                                            <h4
                                                className="text-lg font-bold truncate mb-0.5"
                                                style={{
                                                    color: classColor,
                                                    textShadow: `0 0 12px ${classColor}80, 2px 2px 4px rgba(0,0,0,0.5)`
                                                }}
                                            >
                                                {analysis.character_name}
                                            </h4>
                                            <p className="text-xs truncate" style={{ color: MidnightTheme.text.muted }}>
                                                {analysis.race} {analysis.class}
                                            </p>
                                        </div>

                                        {/* Faction Badge */}
                                        <motion.div
                                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base"
                                            whileHover={{ rotate: 180, scale: 1.2 }}
                                            transition={{ duration: 0.4 }}
                                            style={{
                                                background: analysis.faction === 'Alliance'
                                                    ? `radial-gradient(circle, rgba(0, 112, 221, 0.8), rgba(0, 82, 204, 0.6))`
                                                    : `radial-gradient(circle, rgba(220, 20, 60, 0.8), rgba(139, 0, 0, 0.6))`,
                                                border: `2px solid ${analysis.faction === 'Alliance' ? '#0070DD' : '#DC143C'}`,
                                                boxShadow: `0 0 15px ${analysis.faction === 'Alliance' ? 'rgba(0,112,221,0.5)' : 'rgba(220,20,60,0.5)'}`,
                                            }}
                                        >
                                            {factionTheme.logo}
                                        </motion.div>
                                    </div>

                                    {/* Readiness Score Bar */}
                                    <div className="mb-4 relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{
                                                color: MidnightTheme.text.muted
                                            }}>
                                                Readiness
                                            </span>
                                            <motion.span
                                                className="text-xl font-black"
                                                animate={{
                                                    textShadow: [
                                                        `0 0 15px ${scoreColor}60`,
                                                        `0 0 25px ${scoreColor}80`,
                                                        `0 0 15px ${scoreColor}60`
                                                    ]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                style={{ color: scoreColor }}
                                            >
                                                {analysis.readiness_score}%
                                            </motion.span>
                                        </div>
                                        <div
                                            className="h-2.5 rounded-full overflow-hidden relative"
                                            style={{
                                                background: `${MidnightTheme.void.dark}80`,
                                                border: `1px solid ${MidnightTheme.void.primary}40`,
                                                boxShadow: `inset 0 0 8px ${MidnightTheme.void.primary}20`
                                            }}
                                        >
                                            <motion.div
                                                className="h-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${analysis.readiness_score}%` }}
                                                transition={{ duration: 1, delay: index * 0.05, ease: "easeOut" }}
                                                style={{
                                                    background: `linear-gradient(to right, ${scoreColor}, ${scoreColor}DD)`,
                                                    boxShadow: `0 0 15px ${scoreColor}80`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Metadata Footer */}
                                    <div className="flex items-center justify-between text-xs relative" style={{ color: MidnightTheme.text.muted }}>
                                        <span className="flex items-center gap-1.5" suppressHydrationWarning>
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5" />
                                            {analysis.view_count || 0}
                                        </span>
                                    </div>

                                    {/* Realm Info */}
                                    <div className="mt-3 pt-3 relative" style={{
                                        borderTop: `1px solid ${MidnightTheme.void.primary}40`
                                    }}>
                                        <p className="text-xs text-center uppercase font-bold tracking-widest" style={{
                                            color: MidnightTheme.text.muted,
                                            textShadow: `0 0 8px ${MidnightTheme.void.primary}30`
                                        }}>
                                            {analysis.region.toUpperCase()}-{analysis.realm_slug}
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
