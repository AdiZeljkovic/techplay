"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Trophy, Medal, Award, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
    rank: number;
    username: string;
    avatar: string | null;
    points: number;
}

interface LeaderboardProps {
    slug: string;
}

export default function Leaderboard({ slug }: LeaderboardProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(`/giveaways/${slug}/leaderboard`);
                setEntries(res.data.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();

        // Refresh leaderboard every 30 seconds
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, [slug]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-5 h-5 text-yellow-400" />;
            case 2:
                return <Medal className="w-5 h-5 text-gray-400" />;
            case 3:
                return <Award className="w-5 h-5 text-orange-400" />;
            default:
                return null;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "from-yellow-500/20 to-orange-500/20 border-yellow-500/50";
            case 2:
                return "from-gray-400/20 to-gray-500/20 border-gray-400/50";
            case 3:
                return "from-orange-400/20 to-red-500/20 border-orange-400/50";
            default:
                return "from-[var(--bg-elevated)] to-[var(--bg-elevated)] border-[var(--border)]";
        }
    };

    if (loading) {
        return (
            <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                </div>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="glass-card rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                    Leaderboard
                </h3>
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                    No entries yet. Be the first!
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                    Top Players
                </h3>

                <div className="space-y-3">
                    {entries.map((entry, index) => (
                        <motion.div
                            key={entry.rank}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative group/item"
                        >
                            <div className={`absolute inset-0 rounded-xl blur-lg transition-opacity duration-300 ${
                                entry.rank <= 3 ? 'opacity-30 group-hover/item:opacity-50' : 'opacity-0 group-hover/item:opacity-20'
                            } ${
                                entry.rank === 1 ? 'bg-yellow-500/30' :
                                entry.rank === 2 ? 'bg-gray-400/30' :
                                entry.rank === 3 ? 'bg-orange-400/30' :
                                'bg-[var(--accent)]/20'
                            }`} />
                            <div className={`relative/50 border rounded-xl p-3 transition-all duration-300 hover:scale-[1.02] ${
                                entry.rank === 1 ? 'border-yellow-500/50' :
                                entry.rank === 2 ? 'border-gray-400/50' :
                                entry.rank === 3 ? 'border-orange-400/50' :
                                'border-[var(--border)] hover:border-[var(--accent)]/50'
                            }`}>
                                <div className="flex items-center gap-3">
                                    {/* Rank */}
                                    <div className="flex-shrink-0 w-8 flex items-center justify-center">
                                        {getRankIcon(entry.rank) || (
                                            <span className="font-bold text-[var(--text-secondary)] text-sm">
                                                #{entry.rank}
                                            </span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                                        entry.rank === 1 ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                                        entry.rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                                        entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                                        'bg-gradient-to-br from-[var(--accent)] to-orange-600'
                                    }`}>
                                        {entry.username?.[0]?.toUpperCase() ?? "?"}
                                    </div>

                                    {/* Username */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white truncate">
                                            {entry.username}
                                        </div>
                                        {entry.rank <= 3 && (
                                            <div className={`text-xs ${
                                                entry.rank === 1 ? 'text-yellow-400' :
                                                entry.rank === 2 ? 'text-gray-400' :
                                                'text-orange-400'
                                            }`}>
                                                {entry.rank === 1 ? "🏆 Leading" : entry.rank === 2 ? "🥈 Runner-up" : "🥉 3rd Place"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Points */}
                                    <div className="text-right flex-shrink-0">
                                        <div className="font-bold text-[var(--accent)]">
                                            {entry.points}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)]">
                                            pts
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Refresh indicator */}
                <div className="mt-4 text-xs text-[var(--text-muted)] text-center flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live updates every 30s
                </div>
            </div>
        </div>
    );
}
