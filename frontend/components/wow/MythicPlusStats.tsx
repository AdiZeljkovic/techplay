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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* M+ Score */}
                <div className="relative h-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-[var(--accent)] rounded-3xl blur-xl opacity-20" />
                    <div className="relative h-full bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-[var(--accent)] transition-all flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                M+ Score
                            </h3>
                        </div>
                        <p className={`text-5xl font-black ${getScoreColor(mythicPlus.score)}`}>
                            {mythicPlus.score.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)]">
                                {getScoreRating(mythicPlus.score)}
                            </span>
                            <span className={`text-sm font-black ${getScoreColor(mythicPlus.score)}`}>
                                {getScorePercentile(mythicPlus.score)}
                            </span>
                        </div>

                        {/* Progress to Next Milestone */}
                        {nextMilestone && (
                            <div className="mt-6 pt-6 border-t-2 border-[var(--border)]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                                        Next: {nextMilestone.label}
                                    </span>
                                    <span className="text-xs font-black text-[var(--accent)]">
                                        {nextMilestone.target - mythicPlus.score} points
                                    </span>
                                </div>
                                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2.5">
                                    <div
                                        className="bg-gradient-to-r from-[var(--accent)] to-purple-500 h-2.5 rounded-full transition-all duration-300 shadow-lg shadow-[var(--accent)]/30"
                                        style={{
                                            width: `${Math.min(100, (mythicPlus.score / nextMilestone.target) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vault Status */}
                <div className="relative h-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative h-full bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-[var(--accent)] transition-all flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                Great Vault
                            </h3>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                            {mythicPlus.vault_unlocked ? (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className="text-2xl font-black text-green-500">Unlocked</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                                        <X className="w-8 h-8 text-[var(--text-secondary)]" />
                                    </div>
                                    <p className="text-2xl font-black text-[var(--text-secondary)]">Not Active</p>
                                </>
                            )}
                        </div>
                        <p className="text-sm font-medium text-[var(--text-secondary)]">
                            Complete M+ runs to unlock weekly rewards
                        </p>
                    </div>
                </div>
            </div>

            {/* Best Runs Table */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-[var(--accent)] rounded-3xl blur-xl opacity-15" />
                <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl">
                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase mb-6 tracking-tight">Best Runs</h3>

                    {mythicPlus.best_runs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-[var(--border)]">
                                        <th className="text-left py-4 px-4 text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                            Dungeon
                                        </th>
                                        <th className="text-center py-4 px-4 text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                            Level
                                        </th>
                                        <th className="text-center py-4 px-4 text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-center py-4 px-4 text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
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
                                                className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all group"
                                            >
                                                <td className="py-5 px-4 text-[var(--text-primary)] font-bold group-hover:text-[var(--accent)] transition-colors">
                                                    {run.dungeon}
                                                </td>
                                                <td className="py-5 px-4 text-center">
                                                    <span className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--accent)]/15 to-purple-500/10 border border-[var(--accent)]/30 text-[var(--accent)] font-black text-sm">
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
                        <div className="text-center py-12">
                            <Trophy className="w-16 h-16 text-[var(--text-secondary)] opacity-30 mx-auto mb-3" />
                            <p className="text-[var(--text-secondary)] font-medium">No recorded runs this season</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Improvement Tips */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-2 border-blue-500/30 p-8 rounded-3xl shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-black text-blue-400 uppercase tracking-wide">
                            How to Improve Your M+ Score
                        </h4>
                    </div>
                    <div className="space-y-3 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <p><strong className="text-[var(--text-primary)] font-bold">Time all dungeons:</strong> +2 and +3 chests award significantly more rating points</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <p><strong className="text-[var(--text-primary)] font-bold">Push higher keys:</strong> Each keystone level completed adds ~15-20 points per dungeon</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <p><strong className="text-[var(--text-primary)] font-bold">Complete both Tyrannical and Fortified:</strong> Full rating requires timing keys on both affixes</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <p><strong className="text-[var(--text-primary)] font-bold">Weekly Vault:</strong> Complete 8 M+ dungeons for maximum Great Vault rewards</p>
                        </div>
                        {mythicPlus.score < 2000 && (
                            <p className="pt-4 border-t-2 border-blue-500/20 mt-4 text-blue-300 bg-blue-500/10 px-4 py-3 rounded-xl font-bold">
                                💡 <strong>Next Goal:</strong> Time all dungeons at +10 or higher to reach 2000+ (Advanced tier)
                            </p>
                        )}
                        {mythicPlus.score >= 2000 && mythicPlus.score < 2500 && (
                            <p className="pt-4 border-t-2 border-blue-500/20 mt-4 text-blue-300 bg-blue-500/10 px-4 py-3 rounded-xl font-bold">
                                💡 <strong>Next Goal:</strong> Time all dungeons at +15 to reach 2500+ (Expert tier)
                            </p>
                        )}
                        {mythicPlus.score >= 2500 && (
                            <p className="pt-4 border-t-2 border-purple-500/20 mt-4 text-purple-300 bg-purple-500/10 px-4 py-3 rounded-xl font-bold">
                                🏆 <strong>Excellent!</strong> You're in the top tier. Push for +20s to join the Elite (3000+)
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
