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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Raid Name */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Skull className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            Current Tier
                        </h3>
                    </div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{raids.current_tier}</p>
                </div>

                {/* Normal Progress */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <h3 className="text-sm font-semibold text-blue-500 uppercase mb-2">Normal</h3>
                    <p className="text-3xl font-bold text-blue-500">
                        {normalKills}/{totalBosses}
                    </p>
                </div>

                {/* Heroic Progress */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <h3 className="text-sm font-semibold text-purple-500 uppercase mb-2">Heroic</h3>
                    <p className="text-3xl font-bold text-purple-500">
                        {heroicKills}/{totalBosses}
                    </p>
                </div>

                {/* Mythic Progress */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <h3 className="text-sm font-semibold text-[var(--accent)] uppercase mb-2">Mythic</h3>
                    <p className="text-3xl font-bold text-[var(--accent)]">
                        {mythicKills}/{totalBosses}
                    </p>
                </div>
            </div>

            {/* Boss Kill Matrix */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase mb-6">Boss Kills</h3>

                {raids.bosses.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] uppercase">
                                        Boss Name
                                    </th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-blue-500 uppercase">
                                        Normal
                                    </th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-purple-500 uppercase">
                                        Heroic
                                    </th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--accent)] uppercase">
                                        Mythic
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {raids.bosses.map((boss, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                        <td className="py-4 px-4 text-[var(--text-primary)] font-semibold">
                                            {boss.name}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {boss.normal ? (
                                                <Check className="w-5 h-5 text-blue-500 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-[var(--text-secondary)] mx-auto opacity-30" />
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {boss.heroic ? (
                                                <Check className="w-5 h-5 text-purple-500 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-[var(--text-secondary)] mx-auto opacity-30" />
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {boss.mythic ? (
                                                <Check className="w-5 h-5 text-[var(--accent)] mx-auto" />
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
                    <div className="text-center py-8">
                        <p className="text-[var(--text-secondary)]">No raid encounters recorded</p>
                    </div>
                )}
            </div>

            {/* Progress Summary & Next Steps */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6 rounded-3xl">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase mb-3">
                    Overall Progress
                </h4>
                <p className="text-xl font-bold text-[var(--text-primary)]">{raids.summary}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-2 mb-4">
                    Complete boss encounters to unlock better loot and advance through raid tiers
                </p>

                {/* What's Next */}
                <div className="pt-4 border-t border-[var(--border)] space-y-2">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">What's Next?</p>
                    {mythicKills < totalBosses && (
                        <p className="text-sm text-[var(--text-primary)]">
                            • Push Mythic difficulty - {totalBosses - mythicKills} bosses remaining
                        </p>
                    )}
                    {heroicKills < totalBosses && mythicKills === 0 && (
                        <p className="text-sm text-[var(--text-primary)]">
                            • Complete Heroic - {totalBosses - heroicKills} bosses to go
                        </p>
                    )}
                    {normalKills === totalBosses && heroicKills < totalBosses && (
                        <p className="text-sm text-[var(--text-primary)]">
                            • Start Heroic progression for better item level gear (630+)
                        </p>
                    )}
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                        💡 Raid experience prepares you for Midnight launch raids
                    </p>
                </div>
            </div>
        </div>
    );
}
