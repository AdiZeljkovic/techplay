"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Eye, Share2 } from "lucide-react";
import axios from "@/lib/axios";
import { getClassColor, getFactionTheme } from "@/data/wow-theme";
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
        <div className="relative">
            {/* WoW Quest Header */}
            <div
                className="relative mb-6 p-5 rounded-lg"
                style={{
                    background: 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
                    border: '8px solid',
                    borderImage: 'linear-gradient(135deg, #5D4037, #3E2723) 1',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 0 6px 15px rgba(0,0,0,0.5)',
                }}
            >
                <h3
                    className="text-3xl font-bold uppercase tracking-wider text-center"
                    style={{
                        color: '#FFD700',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,215,0,0.4)',
                        fontFamily: 'serif',
                    }}
                >
                    <Clock className="w-7 h-7 inline mr-2 mb-1" />
                    Recent Analyses
                </h3>
                <p className="text-center mt-2 text-sm italic" style={{ color: '#C9B388', fontFamily: 'serif' }}>
                    Champions recently tested for Midnight readiness
                </p>
            </div>

            {/* Analysis Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-10 h-10 border-4 border-[#8B7355] border-t-[#FFD700] rounded-full mx-auto" />
                    <p className="mt-4 text-[#C9B388] italic text-sm">Loading recent analyses...</p>
                </div>
            ) : analyses.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="w-14 h-14 mx-auto mb-3 text-[#8B7355] opacity-30" />
                    <p className="text-[#C9B388] italic">No recent analyses found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyses.map((analysis, index) => {
                        const classColor = getClassColor(analysis.class);
                        const factionTheme = getFactionTheme(analysis.faction);
                        const scoreColor = getScoreColor(analysis.readiness_score);

                        return (
                            <motion.div
                                key={analysis.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="relative group cursor-pointer"
                            >
                                <div
                                    className="relative p-4 rounded-lg transition-all hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #f5f5dc 0%, #e8e0c8 100%)',
                                        border: '4px solid #C9B388',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
                                    }}
                                >
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
                                        <div className="flex-1 min-w-0">
                                            <h4
                                                className="text-lg font-bold truncate"
                                                style={{ color: classColor, textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
                                            >
                                                {analysis.character_name}
                                            </h4>
                                            <p className="text-xs truncate" style={{ color: '#5D4037' }}>
                                                {analysis.race} {analysis.class}
                                            </p>
                                        </div>

                                        {/* Faction Badge */}
                                        <div
                                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                                            style={{
                                                background: analysis.faction === 'Alliance'
                                                    ? 'linear-gradient(135deg, #0078FF, #0052CC)'
                                                    : 'linear-gradient(135deg, #B30000, #8B0000)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            }}
                                        >
                                            {factionTheme.logo}
                                        </div>
                                    </div>

                                    {/* Readiness Score Bar */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#8B7355' }}>
                                                Readiness
                                            </span>
                                            <span
                                                className="text-lg font-bold"
                                                style={{ color: scoreColor, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                                            >
                                                {analysis.readiness_score}%
                                            </span>
                                        </div>
                                        <div
                                            className="h-2 rounded-full overflow-hidden"
                                            style={{
                                                background: 'linear-gradient(to right, #3E2723, #2a1810)',
                                                border: '1px solid #8B7355',
                                            }}
                                        >
                                            <div
                                                className="h-full transition-all duration-500"
                                                style={{
                                                    width: `${analysis.readiness_score}%`,
                                                    background: `linear-gradient(to right, ${scoreColor}, ${scoreColor}CC)`,
                                                    boxShadow: `0 0 8px ${scoreColor}`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Metadata Footer */}
                                    <div className="flex items-center justify-between text-xs" style={{ color: '#8B7355' }}>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {analysis.view_count || 0}
                                        </span>
                                    </div>

                                    {/* Realm Info */}
                                    <div className="mt-2 pt-2 border-t border-[#C9B388]/30">
                                        <p className="text-xs text-center uppercase font-semibold tracking-wide" style={{ color: '#8B7355' }}>
                                            {analysis.region.toUpperCase()}-{analysis.realm_slug}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
