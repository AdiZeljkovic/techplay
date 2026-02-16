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
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                        Honor Level
                    </h3>
                </div>
                <p className="text-4xl font-bold text-[var(--accent)]">{pvp.honor_level}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Earned through all PvP activities
                </p>
            </div>

            {/* Arena Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2v2 Arena */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            2v2 Arena
                        </h3>
                    </div>
                    {pvp.arena_2v2 ? (
                        <>
                            <p className={`text-4xl font-bold ${getRatingColor(pvp.arena_2v2)}`}>
                                {pvp.arena_2v2}
                            </p>
                            <p className={`text-sm font-semibold mt-1 ${getRatingColor(pvp.arena_2v2)}`}>
                                {getRatingTitle(pvp.arena_2v2)}
                            </p>
                        </>
                    ) : (
                        <p className="text-2xl text-[var(--text-secondary)]">Not Ranked</p>
                    )}
                </div>

                {/* 3v3 Arena */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            3v3 Arena
                        </h3>
                    </div>
                    {pvp.arena_3v3 ? (
                        <>
                            <p className={`text-4xl font-bold ${getRatingColor(pvp.arena_3v3)}`}>
                                {pvp.arena_3v3}
                            </p>
                            <p className={`text-sm font-semibold mt-1 ${getRatingColor(pvp.arena_3v3)}`}>
                                {getRatingTitle(pvp.arena_3v3)}
                            </p>
                        </>
                    ) : (
                        <p className="text-2xl text-[var(--text-secondary)]">Not Ranked</p>
                    )}
                </div>
            </div>

            {/* Rated Battlegrounds */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-2">
                    <Flag className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                        Rated Battlegrounds
                    </h3>
                </div>
                {pvp.rbg_rating ? (
                    <div className="flex items-center gap-6">
                        <div>
                            <p className={`text-4xl font-bold ${getRatingColor(pvp.rbg_rating)}`}>
                                {pvp.rbg_rating}
                            </p>
                            <p className={`text-sm font-semibold mt-1 ${getRatingColor(pvp.rbg_rating)}`}>
                                {getRatingTitle(pvp.rbg_rating)}
                            </p>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-[var(--text-secondary)]">
                                10v10 objective-based battlegrounds with rating
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-2xl text-[var(--text-secondary)]">Not Ranked</p>
                )}
            </div>

            {/* Rating Explanation */}
            <div className="bg-gradient-to-br from-purple-500/5 to-[var(--accent)]/5 border border-purple-500/20 p-6 rounded-3xl">
                <h4 className="text-sm font-semibold text-purple-400 uppercase mb-3">
                    Rating Tiers
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                        <span className="text-yellow-500 font-semibold">1000-1399:</span>
                        <span className="text-[var(--text-secondary)] ml-2">Combatant</span>
                    </div>
                    <div>
                        <span className="text-green-500 font-semibold">1400-1799:</span>
                        <span className="text-[var(--text-secondary)] ml-2">Challenger</span>
                    </div>
                    <div>
                        <span className="text-blue-500 font-semibold">1800-2099:</span>
                        <span className="text-[var(--text-secondary)] ml-2">Rival</span>
                    </div>
                    <div>
                        <span className="text-purple-500 font-semibold">2100-2399:</span>
                        <span className="text-[var(--text-secondary)] ml-2">Duelist</span>
                    </div>
                    <div>
                        <span className="text-[var(--accent)] font-semibold">2400+:</span>
                        <span className="text-[var(--text-secondary)] ml-2">Gladiator</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
