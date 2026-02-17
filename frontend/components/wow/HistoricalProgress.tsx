'use client';

import { WowHistoricalSnapshot } from '@/types';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HistoricalProgressProps {
    history: WowHistoricalSnapshot[];
    characterName: string;
}

export default function HistoricalProgress({ history, characterName }: HistoricalProgressProps) {
    if (!history || history.length === 0) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-[var(--accent)]" />
                    <h4 className="font-bold text-[var(--text-primary)] uppercase">Character Progression</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                    No historical data yet. Analyze your character again in a few days to see progression tracking!
                </p>
            </div>
        );
    }

    // Get latest and oldest snapshots
    const latest = history[0];
    const oldest = history[history.length - 1];

    const calculateChange = (latestVal: number | null, oldestVal: number | null) => {
        if (latestVal === null || oldestVal === null) return null;
        return latestVal - oldestVal;
    };

    const ilvlChange = calculateChange(latest.item_level, oldest.item_level);
    const rioChange = calculateChange(latest.mythic_plus_score, oldest.mythic_plus_score);
    const arenaChange = calculateChange(latest.arena_rating, oldest.arena_rating);
    const readinessChange = calculateChange(latest.readiness_score, oldest.readiness_score);

    const getTrendIcon = (change: number | null) => {
        if (change === null) return Minus;
        if (change > 0) return TrendingUp;
        if (change < 0) return TrendingDown;
        return Minus;
    };

    const getTrendColor = (change: number | null) => {
        if (change === null) return 'text-[var(--text-secondary)]';
        if (change > 0) return 'text-green-500';
        if (change < 0) return 'text-red-500';
        return 'text-[var(--text-secondary)]';
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5 text-[var(--accent)]" />
                <div>
                    <h4 className="font-bold text-[var(--text-primary)] uppercase">Character Progression</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                        Tracking {history.length} analyses since{' '}
                        {new Date(oldest.analyzed_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Item Level */}
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Item Level</p>
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{latest.item_level || 0}</p>
                        {ilvlChange !== null && ilvlChange !== 0 && (
                            <div className={`flex items-center gap-1 ${getTrendColor(ilvlChange)}`}>
                                {getTrendIcon(ilvlChange) === TrendingUp && <TrendingUp className="w-4 h-4" />}
                                {getTrendIcon(ilvlChange) === TrendingDown && <TrendingDown className="w-4 h-4" />}
                                <span className="text-xs font-semibold">
                                    {ilvlChange > 0 ? '+' : ''}
                                    {ilvlChange}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* M+ Score */}
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">M+ Score</p>
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">
                            {latest.mythic_plus_score || 0}
                        </p>
                        {rioChange !== null && rioChange !== 0 && (
                            <div className={`flex items-center gap-1 ${getTrendColor(rioChange)}`}>
                                {getTrendIcon(rioChange) === TrendingUp && <TrendingUp className="w-4 h-4" />}
                                {getTrendIcon(rioChange) === TrendingDown && <TrendingDown className="w-4 h-4" />}
                                <span className="text-xs font-semibold">
                                    {rioChange > 0 ? '+' : ''}
                                    {rioChange}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Arena Rating */}
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Arena Rating</p>
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">
                            {latest.arena_rating || 0}
                        </p>
                        {arenaChange !== null && arenaChange !== 0 && (
                            <div className={`flex items-center gap-1 ${getTrendColor(arenaChange)}`}>
                                {getTrendIcon(arenaChange) === TrendingUp && <TrendingUp className="w-4 h-4" />}
                                {getTrendIcon(arenaChange) === TrendingDown && <TrendingDown className="w-4 h-4" />}
                                <span className="text-xs font-semibold">
                                    {arenaChange > 0 ? '+' : ''}
                                    {arenaChange}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Readiness Score */}
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Midnight Readiness</p>
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-[var(--accent)]">{latest.readiness_score || 0}%</p>
                        {readinessChange !== null && readinessChange !== 0 && (
                            <div className={`flex items-center gap-1 ${getTrendColor(readinessChange)}`}>
                                {getTrendIcon(readinessChange) === TrendingUp && <TrendingUp className="w-4 h-4" />}
                                {getTrendIcon(readinessChange) === TrendingDown && <TrendingDown className="w-4 h-4" />}
                                <span className="text-xs font-semibold">
                                    {readinessChange > 0 ? '+' : ''}
                                    {readinessChange}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progression Charts */}
            {history.length >= 2 && (
                <div className="pt-4 border-t border-[var(--border)]">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3">
                        Progression Over Time
                    </p>
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={[...history].reverse().map((snapshot) => ({
                                    date: new Date(snapshot.analyzed_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    }),
                                    iLvL: snapshot.item_level || 0,
                                    'M+ Score': snapshot.mythic_plus_score || 0,
                                    'Arena Rating': snapshot.arena_rating || 0,
                                    'Readiness %': snapshot.readiness_score || 0,
                                }))}
                                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-secondary)"
                                    style={{ fontSize: '11px' }}
                                />
                                <YAxis stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                    }}
                                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                                    itemStyle={{ color: 'var(--text-secondary)' }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                                    iconType="line"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="iLvL"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="M+ Score"
                                    stroke="#FC4100"
                                    strokeWidth={2}
                                    dot={{ fill: '#FC4100', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Arena Rating"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ fill: '#ef4444', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Readiness %"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10b981', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Recent Analyses Timeline */}
            <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3">Recent Analyses</p>
                <div className="space-y-2">
                    {history.slice(0, 5).map((snapshot, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg"
                        >
                            <span className="text-xs text-[var(--text-secondary)]">
                                {new Date(snapshot.analyzed_at).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-[var(--text-primary)]">
                                    {snapshot.item_level || 0} iLvL
                                </span>
                                <span className="text-xs text-[var(--text-primary)]">
                                    {snapshot.mythic_plus_score || 0} Rio
                                </span>
                                <span className="text-xs text-[var(--accent)]">
                                    {snapshot.readiness_score || 0}% Ready
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {history.length > 5 && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
                        + {history.length - 5} more analyses
                    </p>
                )}
            </div>

            <div className="mt-4 p-3 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl">
                <p className="text-xs text-[var(--text-secondary)]">
                    💡 Analyze your character regularly to track your Midnight preparation progress over time!
                </p>
            </div>
        </div>
    );
}
