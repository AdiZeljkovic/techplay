'use client';

import { WowPvP } from '@/types';
import { Swords, Trophy, Flag, Star, AlertCircle } from 'lucide-react';

interface PvPStatsProps {
    pvp: WowPvP | null;
}

export default function PvPStats({ pvp }: PvPStatsProps) {
    if (!pvp) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">No PvP data available</p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Play some Arenas or Rated Battlegrounds to see your ratings here!
                </p>
            </div>
        );
    }

    const getRatingColor = (rating: number | null): string => {
        if (!rating || rating === 0) return 'text-[var(--text-secondary)]';
        if (rating >= 2400) return 'text-[var(--accent)]'; // Gladiator
        if (rating >= 2100) return 'text-purple-500'; // Duelist
        if (rating >= 1800) return 'text-blue-500'; // Rival
        if (rating >= 1400) return 'text-green-500'; // Challenger
        return 'text-yellow-500'; // Combatant
    };

    const getRatingTitle = (rating: number | null): string => {
        if (!rating || rating === 0) return 'Unranked';
        if (rating >= 2400) return 'Gladiator';
        if (rating >= 2100) return 'Duelist';
        if (rating >= 1800) return 'Rival';
        if (rating >= 1400) return 'Challenger';
        if (rating >= 1000) return 'Combatant';
        return 'Beginner';
    };

    const hasAnyPvP = pvp.arena_2v2 || pvp.arena_3v3 || pvp.rbg_rating || pvp.honor_level > 0;

    if (!hasAnyPvP) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <Swords className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No PvP Activity</h3>
                <p className="text-[var(--text-secondary)] mb-4">
                    You haven't participated in rated PvP this season.
                </p>
                <div className="max-w-md mx-auto text-left bg-[var(--bg-secondary)] p-4 rounded-xl">
                    <p className="text-sm text-[var(--text-secondary)] mb-2 font-semibold">Get Started:</p>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                        <li>• Queue for 2v2 or 3v3 Arena</li>
                        <li>• Join Rated Battlegrounds (RBG)</li>
                        <li>• Earn Honor and Conquest gear</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Honor Level */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] via-yellow-500 to-[var(--accent)] rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-[var(--accent)] transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-yellow-500 flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
                            <Star className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                            Honor Level
                        </h3>
                    </div>
                    <p className="text-5xl font-black text-[var(--accent)]">{pvp.honor_level}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">
                        Earned through all PvP activities
                    </p>
                </div>
            </div>

            {/* Arena Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* 2v2 Arena */}
                <div className="relative h-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative h-full bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-blue-500 transition-all flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                2v2 Arena
                            </h3>
                        </div>
                        {pvp.arena_2v2 ? (
                            <>
                                <p className={`text-5xl font-black ${getRatingColor(pvp.arena_2v2)}`}>
                                    {pvp.arena_2v2}
                                </p>
                                <p className={`text-sm font-black mt-2 ${getRatingColor(pvp.arena_2v2)}`}>
                                    {getRatingTitle(pvp.arena_2v2)}
                                </p>
                            </>
                        ) : (
                            <p className="text-3xl font-black text-[var(--text-secondary)]">Not Ranked</p>
                        )}
                    </div>
                </div>

                {/* 3v3 Arena */}
                <div className="relative h-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative h-full bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-purple-500 transition-all flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                3v3 Arena
                            </h3>
                        </div>
                        {pvp.arena_3v3 ? (
                            <>
                                <p className={`text-5xl font-black ${getRatingColor(pvp.arena_3v3)}`}>
                                    {pvp.arena_3v3}
                                </p>
                                <p className={`text-sm font-black mt-2 ${getRatingColor(pvp.arena_3v3)}`}>
                                    {getRatingTitle(pvp.arena_3v3)}
                                </p>
                            </>
                        ) : (
                            <p className="text-3xl font-black text-[var(--text-secondary)]">Not Ranked</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Rated Battlegrounds */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-green-500 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <Flag className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                            Rated Battlegrounds
                        </h3>
                    </div>
                    {pvp.rbg_rating ? (
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div>
                                <p className={`text-5xl font-black ${getRatingColor(pvp.rbg_rating)}`}>
                                    {pvp.rbg_rating}
                                </p>
                                <p className={`text-sm font-black mt-2 ${getRatingColor(pvp.rbg_rating)}`}>
                                    {getRatingTitle(pvp.rbg_rating)}
                                </p>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    10v10 objective-based battlegrounds with rating
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-3xl font-black text-[var(--text-secondary)]">Not Ranked</p>
                    )}
                </div>
            </div>

            {/* Rating Explanation */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-[var(--accent)] rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-gradient-to-br from-purple-500/10 to-[var(--accent)]/5 border-2 border-purple-500/30 p-8 rounded-3xl shadow-2xl">
                    <h4 className="text-sm font-black text-purple-400 uppercase mb-6 tracking-wider flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Rating Tiers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="p-4 bg-[var(--bg-card)] border border-yellow-500/30 rounded-xl">
                            <span className="text-yellow-500 font-black text-base">1000-1399</span>
                            <p className="text-[var(--text-secondary)] mt-1 font-semibold">Combatant</p>
                        </div>
                        <div className="p-4 bg-[var(--bg-card)] border border-green-500/30 rounded-xl">
                            <span className="text-green-500 font-black text-base">1400-1799</span>
                            <p className="text-[var(--text-secondary)] mt-1 font-semibold">Challenger</p>
                        </div>
                        <div className="p-4 bg-[var(--bg-card)] border border-blue-500/30 rounded-xl">
                            <span className="text-blue-500 font-black text-base">1800-2099</span>
                            <p className="text-[var(--text-secondary)] mt-1 font-semibold">Rival</p>
                        </div>
                        <div className="p-4 bg-[var(--bg-card)] border border-purple-500/30 rounded-xl">
                            <span className="text-purple-500 font-black text-base">2100-2399</span>
                            <p className="text-[var(--text-secondary)] mt-1 font-semibold">Duelist</p>
                        </div>
                        <div className="p-4 bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded-xl">
                            <span className="text-[var(--accent)] font-black text-base">2400+</span>
                            <p className="text-[var(--text-secondary)] mt-1 font-semibold">Gladiator</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
