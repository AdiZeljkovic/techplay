'use client';

import { WowMythicPlus } from '@/types';
import { Trophy, TrendingUp, Check, X, AlertCircle } from 'lucide-react';

interface MythicPlusStatsProps {
    mythicPlus: WowMythicPlus | null;
}

export default function MythicPlusStats({ mythicPlus }: MythicPlusStatsProps) {
    if (!mythicPlus) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">No Mythic+ data available</p>
            </div>
        );
    }

    const getUpgradeLabel = (level: number): { text: string; color: string } => {
        if (level === 0) return { text: 'Depleted', color: 'text-red-500' };
        if (level === 1) return { text: '+1', color: 'text-yellow-500' };
        if (level === 2) return { text: '+2', color: 'text-blue-500' };
        if (level === 3) return { text: '+3', color: 'text-purple-500' };
        return { text: 'Unknown', color: 'text-[var(--text-secondary)]' };
    };

    const getScoreColor = (score: number): string => {
        if (score >= 3000) return 'text-purple-500';
        if (score >= 2500) return 'text-blue-500';
        if (score >= 2000) return 'text-green-500';
        if (score >= 1500) return 'text-yellow-500';
        return 'text-[var(--text-primary)]';
    };

    const getScoreRating = (score: number): string => {
        if (score >= 3000) return 'Elite';
        if (score >= 2500) return 'Expert';
        if (score >= 2000) return 'Advanced';
        if (score >= 1500) return 'Intermediate';
        if (score >= 1000) return 'Novice';
        return 'Beginner';
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* M+ Score */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            M+ Score
                        </h3>
                    </div>
                    <p className={`text-4xl font-bold ${getScoreColor(mythicPlus.score)}`}>
                        {mythicPlus.score.toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {getScoreRating(mythicPlus.score)}
                    </p>
                </div>

                {/* Vault Status */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            Great Vault
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {mythicPlus.vault_unlocked ? (
                            <>
                                <Check className="w-8 h-8 text-green-500" />
                                <p className="text-xl font-semibold text-green-500">Unlocked</p>
                            </>
                        ) : (
                            <>
                                <X className="w-8 h-8 text-[var(--text-secondary)]" />
                                <p className="text-xl font-semibold text-[var(--text-secondary)]">Not Active</p>
                            </>
                        )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">
                        Complete M+ runs to unlock weekly rewards
                    </p>
                </div>
            </div>

            {/* Best Runs Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase mb-6">Best Runs</h3>

                {mythicPlus.best_runs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] uppercase">
                                        Dungeon
                                    </th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] uppercase">
                                        Level
                                    </th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] uppercase">
                                        Status
                                    </th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] uppercase">
                                        Upgrade
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {mythicPlus.best_runs.map((run, index) => {
                                    const upgrade = getUpgradeLabel(run.upgrade_level);
                                    return (
                                        <tr
                                            key={index}
                                            className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                                        >
                                            <td className="py-4 px-4 text-[var(--text-primary)] font-semibold">
                                                {run.dungeon}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold">
                                                    +{run.level}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                {run.completed ? (
                                                    <span className="flex items-center justify-center gap-2 text-green-500">
                                                        <Check className="w-4 h-4" />
                                                        Timed
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2 text-red-500">
                                                        <X className="w-4 h-4" />
                                                        Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`font-semibold ${upgrade.color}`}>
                                                    {upgrade.text}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-[var(--text-secondary)]">No recorded runs this season</p>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6 rounded-3xl">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase mb-3">About M+ Score</h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Your Mythic+ score is calculated based on your best runs across all dungeons.
                    Higher keystone levels and faster completion times increase your score.
                    Completing keys within time grants upgrade levels (+1, +2, or +3) which boost your rating.
                </p>
            </div>
        </div>
    );
}
