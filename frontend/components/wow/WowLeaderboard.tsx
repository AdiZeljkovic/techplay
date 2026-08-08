"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Sword, Shield } from "lucide-react";
import axios from "@/lib/axios";
import { getClassColor, getFactionTheme } from "@/data/wow-theme";
import { MidnightTheme, glassCard } from "@/lib/wow-midnight-theme";
import Link from "next/link";

interface LeaderboardEntry {
    id: number;
    character_name: string;
    realm_slug: string;
    region: string;
    class: string;
    race: string;
    faction: string;
    level: number;
    achievement_points: number;
    readiness_score: number;
    portrait_url: string | null;
    created_at: string;
}

interface WowLeaderboardProps {
    initialLimit?: number;
}

export default function WowLeaderboard({ initialLimit = 10 }: WowLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [regionFilter, setRegionFilter] = useState<string | null>(null);
    const [factionFilter, setFactionFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, [regionFilter, factionFilter]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (regionFilter) params.append('region', regionFilter);
            if (factionFilter) params.append('faction', factionFilter);
            params.append('limit', initialLimit.toString());

            const response = await axios.get(`/wow/leaderboard?${params.toString()}`);
            setLeaderboard(response.data.data.leaderboard || []);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMedalIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="w-6 h-6 text-yellow-500" style={{ filter: 'drop-shadow(0 0 6px #FFD700)' }} />;
            case 2:
                return <Trophy className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Trophy className="w-6 h-6 text-amber-700" />;
            default:
                return <Sword className="w-5 h-5 text-[#8B7355]" />;
        }
    };

    const getRankBadgeStyle = (rank: number) => {
        if (rank === 1) {
            return {
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.6), inset 1px 1px 3px rgba(255,255,255,0.5)',
                border: '3px solid #B8860B' };
        }
        if (rank === 2) {
            return {
                background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
                boxShadow: '0 0 10px rgba(192, 192, 192, 0.5), inset 1px 1px 3px rgba(255,255,255,0.4)',
                border: '3px solid #808080' };
        }
        if (rank === 3) {
            return {
                background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                boxShadow: '0 0 10px rgba(205, 127, 50, 0.5), inset 1px 1px 3px rgba(255,255,255,0.3)',
                border: '3px solid #654321' };
        }
        return {
            background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
            border: '2px solid #8B7355' };
    };

    return (
        <motion.div
            className="relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            {/* Midnight Glass Header */}
            <motion.div
                className="relative mb-6 p-8 rounded-xl overflow-hidden"
                style={{
                    ...glassCard,
                    border: `2px solid ${MidnightTheme.void.primary}40`,
                    boxShadow: `
                        0 0 50px ${MidnightTheme.void.primary}30,
                        inset 0 0 50px ${MidnightTheme.void.primary}10
                    `
                }}
            >
                {/* Animated Background Glow */}
                <motion.div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 30% 50%, ${MidnightTheme.void.primary}40, transparent 70%)`,
                            `radial-gradient(circle at 70% 50%, ${MidnightTheme.light.primary}40, transparent 70%)`,
                            `radial-gradient(circle at 30% 50%, ${MidnightTheme.void.primary}40, transparent 70%)`
                        ]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Void Corner Accents */}
                {[0, 1, 2, 3].map((corner) => (
                    <motion.div
                        key={corner}
                        className="absolute w-3 h-3"
                        animate={{
                            boxShadow: [
                                `0 0 10px ${MidnightTheme.void.primary}60`,
                                `0 0 20px ${MidnightTheme.light.primary}60`,
                                `0 0 10px ${MidnightTheme.void.primary}60`
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            background: MidnightTheme.gradients.voidToLight,
                            transform: 'rotate(45deg)',
                            top: corner < 2 ? '12px' : 'auto',
                            bottom: corner >= 2 ? '12px' : 'auto',
                            left: corner % 2 === 0 ? '12px' : 'auto',
                            right: corner % 2 === 1 ? '12px' : 'auto' }}
                    />
                ))}

                {/* Title */}
                <div className="text-center mb-8 relative">
                    <motion.div
                        className="inline-block mb-4"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Trophy className="w-12 h-12" style={{
                            color: MidnightTheme.light.primary,
                            filter: `drop-shadow(0 0 15px ${MidnightTheme.light.primary})`
                        }} />
                    </motion.div>

                    <h2
                        className="text-4xl md:text-5xl font-black uppercase tracking-wider mb-3"
                        style={{
                            background: MidnightTheme.gradients.voidToLight,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: `drop-shadow(0 0 20px ${MidnightTheme.void.primary}60)`
                        }}
                    >
                        Hall of Champions
                    </h2>
                    <p className="text-base" style={{
                        color: MidnightTheme.text.muted,
                        textShadow: `0 0 10px ${MidnightTheme.void.primary}40`
                    }}>
                        The mightiest heroes prepared for Midnight's arrival
                    </p>
                </div>

                {/* Midnight Filters */}
                <div className="flex gap-4 justify-center flex-wrap relative">
                    {/* Region Filter */}
                    <div className="flex gap-2">
                        {['us', 'eu', 'kr', 'tw'].map((region) => (
                            <motion.button
                                key={region}
                                onClick={() => setRegionFilter(regionFilter === region ? null : region)}
                                className="px-5 py-2.5 rounded-lg uppercase font-bold text-sm transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    ...glassCard,
                                    background: regionFilter === region
                                        ? `linear-gradient(135deg, ${MidnightTheme.void.primary}60, ${MidnightTheme.void.deep}60)`
                                        : glassCard.background,
                                    border: `2px solid ${regionFilter === region ? MidnightTheme.void.primary : 'rgba(255,255,255,0.1)'}`,
                                    color: regionFilter === region ? MidnightTheme.text.bright : MidnightTheme.text.muted,
                                    boxShadow: regionFilter === region
                                        ? `0 0 25px ${MidnightTheme.void.primary}60, inset 0 0 15px ${MidnightTheme.void.primary}30`
                                        : `0 0 10px ${MidnightTheme.void.primary}20`,
                                    textShadow: regionFilter === region ? `0 0 10px ${MidnightTheme.void.primary}60` : 'none'
                                }}
                            >
                                {region}
                            </motion.button>
                        ))}
                    </div>

                    {/* Faction Filter */}
                    <div className="flex gap-2">
                        {['Alliance', 'Horde'].map((faction) => (
                            <motion.button
                                key={faction}
                                onClick={() => setFactionFilter(factionFilter === faction ? null : faction)}
                                className="px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    ...glassCard,
                                    background: factionFilter === faction
                                        ? faction === 'Alliance'
                                            ? `linear-gradient(135deg, rgba(0, 112, 221, 0.6), rgba(0, 82, 204, 0.6))`
                                            : `linear-gradient(135deg, rgba(220, 20, 60, 0.6), rgba(139, 0, 0, 0.6))`
                                        : glassCard.background,
                                    border: `2px solid ${factionFilter === faction
                                        ? (faction === 'Alliance' ? '#0070DD' : '#DC143C')
                                        : 'rgba(255,255,255,0.1)'}`,
                                    color: factionFilter === faction ? MidnightTheme.text.bright : MidnightTheme.text.muted,
                                    boxShadow: factionFilter === faction
                                        ? `0 0 25px ${faction === 'Alliance' ? 'rgba(0,112,221,0.6)' : 'rgba(220,20,60,0.6)'}`
                                        : `0 0 10px ${MidnightTheme.void.primary}20` }}
                            >
                                {faction === 'Alliance' ? <Shield className="w-4 h-4" /> : <Sword className="w-4 h-4" />}
                                {faction}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Leaderboard Entries - Midnight Glass Cards */}
            <div className="space-y-4">
                {loading ? (
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            className="w-16 h-16 border-4 rounded-full mx-auto"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={{
                                borderColor: `${MidnightTheme.void.primary} transparent ${MidnightTheme.light.primary} transparent`,
                                filter: `drop-shadow(0 0 10px ${MidnightTheme.void.primary})`
                            }}
                        />
                        <p className="mt-6" style={{ color: MidnightTheme.text.muted }}>Loading champions...</p>
                    </motion.div>
                ) : leaderboard.length === 0 ? (
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            ...glassCard,
                            padding: '3rem'
                        }}
                    >
                        <Shield className="w-20 h-20 mx-auto mb-4 opacity-20" style={{ color: MidnightTheme.void.primary }} />
                        <p style={{ color: MidnightTheme.text.muted }}>No champions found with these filters</p>
                    </motion.div>
                ) : (
                    leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        const classColor = getClassColor(entry.class);
                        const factionTheme = getFactionTheme(entry.faction);

                        const rankColor = rank === 1 ? MidnightTheme.light.primary :
                                           rank === 2 ? '#C0C0C0' :
                                           rank === 3 ? '#CD7F32' :
                                           MidnightTheme.void.primary;

                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.06, type: "spring" }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                className="relative group"
                            >
                                <motion.div
                                    className="relative p-5 rounded-xl transition-all cursor-pointer overflow-hidden"
                                    style={{
                                        ...glassCard,
                                        border: `2px solid ${rank <= 3 ? rankColor : MidnightTheme.void.primary}40`,
                                        boxShadow: rank <= 3
                                            ? `0 0 30px ${rankColor}40, inset 0 0 20px ${rankColor}10`
                                            : `0 0 20px ${MidnightTheme.void.primary}20, inset 0 0 15px ${MidnightTheme.void.primary}10`
                                    }}
                                >
                                    {/* Animated Glow for Top 3 */}
                                    {rank <= 3 && (
                                        <motion.div
                                            className="absolute inset-0 opacity-10 pointer-events-none"
                                            animate={{
                                                background: [
                                                    `radial-gradient(circle at 50% 50%, ${rankColor}60, transparent 70%)`,
                                                    `radial-gradient(circle at 30% 50%, ${rankColor}40, transparent 70%)`,
                                                    `radial-gradient(circle at 70% 50%, ${rankColor}60, transparent 70%)`,
                                                    `radial-gradient(circle at 50% 50%, ${rankColor}60, transparent 70%)`
                                                ]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                    )}
                                    <div className="flex items-center gap-5 relative">
                                        {/* Rank Badge - Midnight Style */}
                                        <motion.div
                                            className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold relative"
                                            animate={rank <= 3 ? {
                                                boxShadow: [
                                                    `0 0 20px ${rankColor}60`,
                                                    `0 0 35px ${rankColor}80`,
                                                    `0 0 20px ${rankColor}60`
                                                ]
                                            } : {}}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            style={{
                                                background: rank <= 3
                                                    ? `radial-gradient(circle, ${rankColor}80, ${rankColor}40)`
                                                    : `radial-gradient(circle, ${MidnightTheme.void.primary}60, ${MidnightTheme.void.deep}40)`,
                                                border: `2px solid ${rankColor}`,
                                                boxShadow: `0 0 20px ${rankColor}60, inset 0 0 15px ${rankColor}30`
                                            }}
                                        >
                                            {rank <= 3 ? (
                                                getMedalIcon(rank)
                                            ) : (
                                                <span style={{
                                                    color: MidnightTheme.text.bright,
                                                    fontSize: '1.25rem',
                                                    textShadow: `0 0 10px ${MidnightTheme.void.primary}`
                                                }}>
                                                    #{rank}
                                                </span>
                                            )}
                                        </motion.div>

                                        {/* Character Portrait */}
                                        {entry.portrait_url && (
                                            <div
                                                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                                                style={{
                                                    border: `3px solid ${classColor}`,
                                                    boxShadow: `0 0 15px ${classColor}60` }}
                                            >
                                                <img
                                                    src={entry.portrait_url}
                                                    alt={entry.character_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Character Info */}
                                        <div className="flex-1 min-w-0 relative">
                                            <h3
                                                className="text-xl font-bold truncate mb-1"
                                                style={{
                                                    color: classColor,
                                                    textShadow: `0 0 15px ${classColor}80, 2px 2px 4px rgba(0,0,0,0.5)`
                                                }}
                                            >
                                                {entry.character_name}
                                            </h3>
                                            <p className="text-sm" style={{ color: MidnightTheme.text.muted }}>
                                                <span className="font-semibold">{entry.race} {entry.class}</span>
                                                {' • '}
                                                <span className="uppercase">{entry.region}</span>-{entry.realm_slug}
                                            </p>
                                        </div>

                                        {/* Readiness Score - Midnight Glow */}
                                        <div className="flex-shrink-0 text-right relative">
                                            <motion.div
                                                className="text-5xl font-black"
                                                animate={{
                                                    textShadow: [
                                                        `0 0 20px ${entry.readiness_score >= 90 ? '#FF8000' : entry.readiness_score >= 75 ? '#A335EE' : '#0070DD'}60`,
                                                        `0 0 35px ${entry.readiness_score >= 90 ? '#FF8000' : entry.readiness_score >= 75 ? '#A335EE' : '#0070DD'}80`,
                                                        `0 0 20px ${entry.readiness_score >= 90 ? '#FF8000' : entry.readiness_score >= 75 ? '#A335EE' : '#0070DD'}60`
                                                    ]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                style={{
                                                    color: entry.readiness_score >= 90 ? '#FF8000' :
                                                           entry.readiness_score >= 75 ? '#A335EE' :
                                                           entry.readiness_score >= 50 ? '#0070DD' : '#1EFF00' }}
                                            >
                                                {entry.readiness_score}%
                                            </motion.div>
                                            <p className="text-xs uppercase font-bold tracking-widest" style={{
                                                color: MidnightTheme.text.muted
                                            }}>
                                                Readiness
                                            </p>
                                        </div>

                                        {/* Faction Badge - Midnight Style */}
                                        <motion.div
                                            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                            whileHover={{ rotate: 360, scale: 1.2 }}
                                            transition={{ duration: 0.6 }}
                                            style={{
                                                background: entry.faction === 'Alliance'
                                                    ? `radial-gradient(circle, rgba(0, 112, 221, 0.8), rgba(0, 82, 204, 0.6))`
                                                    : `radial-gradient(circle, rgba(220, 20, 60, 0.8), rgba(139, 0, 0, 0.6))`,
                                                border: `2px solid ${entry.faction === 'Alliance' ? '#0070DD' : '#DC143C'}`,
                                                boxShadow: `0 0 20px ${entry.faction === 'Alliance' ? 'rgba(0,112,221,0.6)' : 'rgba(220,20,60,0.6)'}` }}
                                        >
                                            {factionTheme.logo}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </motion.div>
    );
}
