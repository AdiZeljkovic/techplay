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
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                </div>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                    Leaderboard
                </h3>
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                    No entries yet. Be the first!
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                Top Players
            </h3>

            <div className="space-y-2">
                {entries.map((entry, index) => (
                    <motion.div
                        key={entry.username}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-gradient-to-r ${getRankColor(entry.rank)} border rounded-xl p-3 hover:scale-[1.02] transition-transform`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-8 text-center">
                                {getRankIcon(entry.rank) || (
                                    <span className="font-bold text-[var(--text-secondary)]">
                                        #{entry.rank}
                                    </span>
                                )}
                            </div>

                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold flex-shrink-0">
                                {entry.username[0].toUpperCase()}
                            </div>

                            {/* Username */}
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[var(--text-primary)] truncate">
                                    {entry.username}
                                </div>
                                {entry.rank <= 3 && (
                                    <div className="text-xs text-[var(--text-muted)]">
                                        {entry.rank === 1 ? "Leading" : entry.rank === 2 ? "Runner-up" : "3rd Place"}
                                    </div>
                                )}
                            </div>

                            {/* Points */}
                            <div className="text-right flex-shrink-0">
                                <div className="font-bold text-[var(--accent)]">
                                    {entry.points}
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">
                                    points
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Refresh indicator */}
            <div className="mt-4 text-xs text-[var(--text-muted)] text-center">
                Updates every 30 seconds
            </div>
        </div>
    );
}
