'use client';

import { WowRaidProgress } from '@/types';
import { Skull, Check, X, AlertCircle } from 'lucide-react';

interface RaidProgressProps {
    raids: WowRaidProgress | null;
}

export default function RaidProgress({ raids }: RaidProgressProps) {
    if (!raids) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">No raid data available</p>
            </div>
        );
    }

    const getDifficultyColor = (difficulty: 'normal' | 'heroic' | 'mythic'): string => {
        const colors = {
            normal: 'text-blue-500',
            heroic: 'text-purple-500',
            mythic: 'text-[var(--accent)]',
        };
        return colors[difficulty];
    };

    const getDifficultyLabel = (difficulty: 'normal' | 'heroic' | 'mythic'): string => {
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    };

    const countKills = (difficulty: 'normal' | 'heroic' | 'mythic'): number => {
        return raids.bosses.filter((boss) => boss[difficulty]).length;
    };

    const normalKills = countKills('normal');
    const heroicKills = countKills('heroic');
    const mythicKills = countKills('mythic');
    const totalBosses = raids.bosses.length;

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Raid Name */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-red-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-6 rounded-3xl shadow-2xl hover:border-[var(--accent)] transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-red-500 flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
                                <Skull className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                Current Tier
                            </h3>
                        </div>
                        <p className="text-xl font-black text-[var(--text-primary)]">{raids.current_tier}</p>
                    </div>
                </div>

                {/* Normal Progress */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-6 rounded-3xl shadow-2xl hover:border-blue-500 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <h3 className="text-xs font-black text-blue-500 uppercase tracking-wider">Normal</h3>
                        </div>
                        <p className="text-4xl font-black text-blue-500">
                            {normalKills}<span className="text-2xl text-[var(--text-secondary)]">/{totalBosses}</span>
                        </p>
                    </div>
                </div>

                {/* Heroic Progress */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-6 rounded-3xl shadow-2xl hover:border-purple-500 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <h3 className="text-xs font-black text-purple-500 uppercase tracking-wider">Heroic</h3>
                        </div>
                        <p className="text-4xl font-black text-purple-500">
                            {heroicKills}<span className="text-2xl text-[var(--text-secondary)]">/{totalBosses}</span>
                        </p>
                    </div>
                </div>

                {/* Mythic Progress */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-orange-500 rounded-3xl blur-xl opacity-25" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-6 rounded-3xl shadow-2xl hover:border-[var(--accent)] transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                            <h3 className="text-xs font-black text-[var(--accent)] uppercase tracking-wider">Mythic</h3>
                        </div>
                        <p className="text-4xl font-black text-[var(--accent)]">
                            {mythicKills}<span className="text-2xl text-[var(--text-secondary)]">/{totalBosses}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Boss Kill Matrix */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-[var(--accent)] to-blue-500 rounded-3xl blur-xl opacity-15" />
                <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl">
                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase mb-6 tracking-tight">Boss Kills</h3>

                    {raids.bosses.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-[var(--border)]">
                                        <th className="text-left py-4 px-4 text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                            Boss Name
                                        </th>
                                        <th className="text-center py-4 px-4 text-sm font-black text-blue-500 uppercase tracking-wider">
                                            Normal
                                        </th>
                                        <th className="text-center py-4 px-4 text-sm font-black text-purple-500 uppercase tracking-wider">
                                            Heroic
                                        </th>
                                        <th className="text-center py-4 px-4 text-sm font-black text-[var(--accent)] uppercase tracking-wider">
                                            Mythic
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {raids.bosses.map((boss, index) => (
                                        <tr
                                            key={index}
                                            className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all group"
                                        >
                                            <td className="py-5 px-4 text-[var(--text-primary)] font-bold group-hover:text-[var(--accent)] transition-colors">
                                                {boss.name}
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                {boss.normal ? (
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                            <Check className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <X className="w-5 h-5 text-[var(--text-secondary)] mx-auto opacity-30" />
                                                )}
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                {boss.heroic ? (
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                            <Check className="w-5 h-5 text-purple-500" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <X className="w-5 h-5 text-[var(--text-secondary)] mx-auto opacity-30" />
                                                )}
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                {boss.mythic ? (
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                                                            <Check className="w-5 h-5 text-[var(--accent)]" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <X className="w-5 h-5 text-[var(--text-secondary)] mx-auto opacity-30" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Skull className="w-16 h-16 text-[var(--text-secondary)] opacity-30 mx-auto mb-3" />
                            <p className="text-[var(--text-secondary)] font-medium">No raid encounters recorded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Summary & Next Steps */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-2 border-blue-500/30 p-8 rounded-3xl shadow-2xl">
                    <h4 className="text-sm font-black text-blue-400 uppercase mb-4 tracking-wider">
                        Overall Progress
                    </h4>
                    <p className="text-3xl font-black text-[var(--text-primary)] mb-3">{raids.summary}</p>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
                        Complete boss encounters to unlock better loot and advance through raid tiers
                    </p>

                    {/* What's Next */}
                    <div className="pt-6 border-t-2 border-blue-500/20 space-y-3">
                        <p className="text-xs font-black text-blue-400 uppercase tracking-wider mb-3">What's Next?</p>
                        {mythicKills < totalBosses && (
                            <div className="flex items-start gap-3">
                                <span className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                                <p className="text-sm font-bold text-[var(--text-primary)]">
                                    Push Mythic difficulty - <span className="text-[var(--accent)]">{totalBosses - mythicKills} bosses remaining</span>
                                </p>
                            </div>
                        )}
                        {heroicKills < totalBosses && mythicKills === 0 && (
                            <div className="flex items-start gap-3">
                                <span className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                                <p className="text-sm font-bold text-[var(--text-primary)]">
                                    Complete Heroic - <span className="text-purple-500">{totalBosses - heroicKills} bosses to go</span>
                                </p>
                            </div>
                        )}
                        {normalKills === totalBosses && heroicKills < totalBosses && (
                            <div className="flex items-start gap-3">
                                <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                <p className="text-sm font-bold text-[var(--text-primary)]">
                                    Start Heroic progression for better item level gear (630+)
                                </p>
                            </div>
                        )}
                        <div className="pt-4 mt-4 border-t-2 border-blue-500/20">
                            <p className="text-sm text-blue-300 bg-blue-500/10 px-4 py-3 rounded-xl font-bold">
                                💡 Raid experience prepares you for Midnight launch raids
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
