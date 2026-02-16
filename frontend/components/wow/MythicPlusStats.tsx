'use client';

import { WowMythicPlus } from '@/types';
import { Trophy, TrendingUp, Check, X, AlertCircle, Sparkles } from 'lucide-react';

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

    const getScorePercentile = (score: number): string => {
        // Approximate percentiles based on Raider.IO data
        if (score >= 3000) return 'Top 1%';
        if (score >= 2800) return 'Top 3%';
        if (score >= 2500) return 'Top 10%';
        if (score >= 2200) return 'Top 25%';
        if (score >= 2000) return 'Top 40%';
        if (score >= 1500) return 'Top 60%';
        return 'Below Average';
    };

    const getNextMilestone = (score: number): { target: number; label: string } | null => {
        if (score < 1500) return { target: 1500, label: 'Intermediate' };
        if (score < 2000) return { target: 2000, label: 'Advanced' };
        if (score < 2500) return { target: 2500, label: 'Expert' };
        if (score < 3000) return { target: 3000, label: 'Elite' };
        return null;
    };

    const nextMilestone = getNextMilestone(mythicPlus.score);

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
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">
                            {getScoreRating(mythicPlus.score)}
                        </span>
                        <span className="text-[var(--border)]">•</span>
                        <span className={`text-sm font-semibold ${getScoreColor(mythicPlus.score)}`}>
                            {getScorePercentile(mythicPlus.score)}
                        </span>
                    </div>

                    {/* Progress to Next Milestone */}
                    {nextMilestone && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-[var(--text-secondary)]">
                                    Next: {nextMilestone.label}
                                </span>
                                <span className="text-xs font-semibold text-[var(--accent)]">
                                    {nextMilestone.target - mythicPlus.score} points
                                </span>
                            </div>
                            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5">
                                <div
                                    className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${Math.min(100, (mythicPlus.score / nextMilestone.target) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
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

            {/* Improvement Tips */}
            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 p-6 rounded-3xl">
                <h4 className="text-sm font-semibold text-blue-400 uppercase mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    How to Improve Your M+ Score
                </h4>
                <div className="space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    <p>• <strong className="text-[var(--text-primary)]">Time all dungeons:</strong> +2 and +3 chests award significantly more rating points</p>
                    <p>• <strong className="text-[var(--text-primary)]">Push higher keys:</strong> Each keystone level completed adds ~15-20 points per dungeon</p>
                    <p>• <strong className="text-[var(--text-primary)]">Complete both Tyrannical and Fortified:</strong> Full rating requires timing keys on both affixes</p>
                    <p>• <strong className="text-[var(--text-primary)]">Weekly Vault:</strong> Complete 8 M+ dungeons for maximum Great Vault rewards</p>
                    {mythicPlus.score < 2000 && (
                        <p className="pt-2 border-t border-[var(--border)] mt-3 text-blue-400">
                            💡 <strong>Next Goal:</strong> Time all dungeons at +10 or higher to reach 2000+ (Advanced tier)
                        </p>
                    )}
                    {mythicPlus.score >= 2000 && mythicPlus.score < 2500 && (
                        <p className="pt-2 border-t border-[var(--border)] mt-3 text-blue-400">
                            💡 <strong>Next Goal:</strong> Time all dungeons at +15 to reach 2500+ (Expert tier)
                        </p>
                    )}
                    {mythicPlus.score >= 2500 && (
                        <p className="pt-2 border-t border-[var(--border)] mt-3 text-purple-400">
                            🏆 <strong>Excellent!</strong> You're in the top tier. Push for +20s to join the Elite (3000+)
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
