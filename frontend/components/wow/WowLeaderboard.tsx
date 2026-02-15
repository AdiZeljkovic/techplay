"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Sword, Shield, ChevronDown } from "lucide-react";
import axios from "@/lib/axios";
import { getClassColor, getFactionTheme } from "@/data/wow-theme";
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
                border: '3px solid #B8860B',
            };
        }
        if (rank === 2) {
            return {
                background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
                boxShadow: '0 0 10px rgba(192, 192, 192, 0.5), inset 1px 1px 3px rgba(255,255,255,0.4)',
                border: '3px solid #808080',
            };
        }
        if (rank === 3) {
            return {
                background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                boxShadow: '0 0 10px rgba(205, 127, 50, 0.5), inset 1px 1px 3px rgba(255,255,255,0.3)',
                border: '3px solid #654321',
            };
        }
        return {
            background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
            border: '2px solid #8B7355',
        };
    };

    return (
        <div className="relative">
            {/* WoW Quest Header - Stone Frame */}
            <div
                className="relative mb-6 p-6 rounded-xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
                    border: '10px solid',
                    borderImage: 'linear-gradient(135deg, #5D4037, #3E2723) 1',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.6)',
                }}
            >
                {/* Decorative Metal Corners */}
                {[0, 1, 2, 3].map((corner) => (
                    <div
                        key={corner}
                        className="absolute w-6 h-6 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, #8B7355 0%, #5D4037 100%)',
                            boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.5)',
                            top: corner < 2 ? '8px' : 'auto',
                            bottom: corner >= 2 ? '8px' : 'auto',
                            left: corner % 2 === 0 ? '8px' : 'auto',
                            right: corner % 2 === 1 ? '8px' : 'auto',
                        }}
                    />
                ))}

                {/* Title */}
                <div className="text-center mb-6">
                    <h2
                        className="text-4xl font-bold uppercase tracking-wider mb-2"
                        style={{
                            color: '#FFD700',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.5)',
                            fontFamily: 'serif',
                        }}
                    >
                        <Trophy className="w-8 h-8 inline mr-3 mb-1" />
                        Hall of Champions
                    </h2>
                    <p className="text-base italic" style={{ color: '#C9B388', fontFamily: 'serif' }}>
                        The mightiest heroes prepared for Midnight's arrival
                    </p>
                </div>

                {/* Filters - Quest Objective Style */}
                <div className="flex gap-4 justify-center flex-wrap mb-4">
                    {/* Region Filter */}
                    <div className="flex gap-2">
                        {['us', 'eu', 'kr', 'tw'].map((region) => (
                            <button
                                key={region}
                                onClick={() => setRegionFilter(regionFilter === region ? null : region)}
                                className="px-4 py-2 rounded-lg uppercase font-bold text-sm transition-all"
                                style={{
                                    background: regionFilter === region
                                        ? 'linear-gradient(135deg, #8B7355 0%, #6B5345 100%)'
                                        : 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
                                    border: '2px solid #8B7355',
                                    color: regionFilter === region ? '#FFD700' : '#C9B388',
                                    boxShadow: regionFilter === region
                                        ? 'inset 1px 1px 3px rgba(0,0,0,0.6), 0 0 10px rgba(139,115,85,0.4)'
                                        : 'inset 1px 1px 2px rgba(255,255,255,0.1)',
                                }}
                            >
                                {region}
                            </button>
                        ))}
                    </div>

                    {/* Faction Filter */}
                    <div className="flex gap-2">
                        {['Alliance', 'Horde'].map((faction) => (
                            <button
                                key={faction}
                                onClick={() => setFactionFilter(factionFilter === faction ? null : faction)}
                                className="px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                                style={{
                                    background: factionFilter === faction
                                        ? faction === 'Alliance'
                                            ? 'linear-gradient(135deg, #0078FF 0%, #0052CC 100%)'
                                            : 'linear-gradient(135deg, #B30000 0%, #8B0000 100%)'
                                        : 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
                                    border: '2px solid #8B7355',
                                    color: factionFilter === faction ? '#FFF' : '#C9B388',
                                    boxShadow: factionFilter === faction
                                        ? '0 0 15px rgba(139,115,85,0.6)'
                                        : 'none',
                                }}
                            >
                                {faction === 'Alliance' ? '🛡️' : '⚔️'} {faction}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leaderboard Entries - Parchment Scroll */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-[#8B7355] border-t-[#FFD700] rounded-full mx-auto" />
                        <p className="mt-4 text-[#C9B388] italic">Loading champions...</p>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                        <Shield className="w-16 h-16 mx-auto mb-4 text-[#8B7355] opacity-30" />
                        <p className="text-[#C9B388] italic">No champions found with these filters</p>
                    </div>
                ) : (
                    leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        const classColor = getClassColor(entry.class);
                        const factionTheme = getFactionTheme(entry.faction);

                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative group"
                            >
                                <div
                                    className="relative p-4 rounded-lg transition-all cursor-pointer"
                                    style={{
                                        background: rank <= 3
                                            ? 'linear-gradient(135deg, #F4ECD8 0%, #E8DCC8 100%)'
                                            : 'linear-gradient(135deg, #f5f5dc 0%, #e8e0c8 100%)',
                                        border: `4px solid ${rank <= 3 ? '#8B7355' : '#C9B388'}`,
                                        boxShadow: rank <= 3
                                            ? '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                                            : '0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Rank Badge */}
                                        <div
                                            className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold"
                                            style={getRankBadgeStyle(rank)}
                                        >
                                            {rank <= 3 ? (
                                                getMedalIcon(rank)
                                            ) : (
                                                <span style={{ color: '#F4ECD8', fontSize: '1.25rem' }}>#{rank}</span>
                                            )}
                                        </div>

                                        {/* Character Portrait */}
                                        {entry.portrait_url && (
                                            <div
                                                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                                                style={{
                                                    border: `3px solid ${classColor}`,
                                                    boxShadow: `0 0 15px ${classColor}60`,
                                                }}
                                            >
                                                <img
                                                    src={entry.portrait_url}
                                                    alt={entry.character_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Character Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className="text-xl font-bold truncate"
                                                style={{ color: classColor, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                                            >
                                                {entry.character_name}
                                            </h3>
                                            <p className="text-sm" style={{ color: '#5D4037' }}>
                                                <span className="font-semibold">{entry.race} {entry.class}</span>
                                                {' • '}
                                                <span className="uppercase">{entry.region}</span>-{entry.realm_slug}
                                            </p>
                                        </div>

                                        {/* Readiness Score - Large & Glowing */}
                                        <div className="flex-shrink-0 text-right">
                                            <div
                                                className="text-4xl font-bold"
                                                style={{
                                                    color: entry.readiness_score >= 90 ? '#FF8000' :
                                                           entry.readiness_score >= 75 ? '#A335EE' :
                                                           entry.readiness_score >= 50 ? '#0070DD' : '#1EFF00',
                                                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                                }}
                                            >
                                                {entry.readiness_score}%
                                            </div>
                                            <p className="text-xs uppercase font-bold tracking-wide" style={{ color: '#8B7355' }}>
                                                Readiness
                                            </p>
                                        </div>

                                        {/* Faction Badge */}
                                        <div
                                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg"
                                            style={{
                                                background: entry.faction === 'Alliance'
                                                    ? 'linear-gradient(135deg, #0078FF, #0052CC)'
                                                    : 'linear-gradient(135deg, #B30000, #8B0000)',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                            }}
                                        >
                                            {factionTheme.logo}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
