'use client';

import { WowCollections } from '@/types';
import { Heart, Gift, Sparkles, CircleDot, TrendingUp, Trophy, AlertCircle } from 'lucide-react';

interface CollectionStatsProps {
    collections: WowCollections | null;
}

export default function CollectionStats({ collections }: CollectionStatsProps) {
    if (!collections) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">No collection data available</p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Collection data may not be available for all characters
                </p>
            </div>
        );
    }

    const hasAnyCollections =
        collections.pets.total > 0 ||
        collections.toys.collected > 0 ||
        collections.transmog.total_appearances > 0 ||
        collections.mounts_count > 0;

    if (!hasAnyCollections) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <Gift className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Collections Yet</h3>
                <p className="text-[var(--text-secondary)] mb-4">
                    Start collecting pets, toys, mounts, and transmog appearances!
                </p>
                <div className="max-w-md mx-auto text-left bg-[var(--bg-secondary)] p-4 rounded-xl">
                    <p className="text-sm text-[var(--text-secondary)] mb-2 font-semibold">Get Started:</p>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                        <li>• Collect battle pets from vendors and wild spawns</li>
                        <li>• Purchase toys from various factions and events</li>
                        <li>• Unlock transmog appearances by looting gear</li>
                        <li>• Earn mounts from raids, achievements, and reputations</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Collections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Battle Pets */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Heart className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            Battle Pets
                        </h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-3xl font-bold text-[var(--text-primary)]">
                                {collections.pets.total}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">Total Pets Collected</p>
                        </div>

                        <div className="pt-3 border-t border-[var(--border)] space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[var(--text-secondary)]">Unique Species:</span>
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                    {collections.pets.unique}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[var(--text-secondary)]">Max Level (25):</span>
                                <span className="text-sm font-semibold text-[var(--accent)]">
                                    {collections.pets.max_level}
                                </span>
                            </div>
                        </div>
                    </div>

                    {collections.pets.max_level < 10 && collections.pets.total > 0 && (
                        <div className="mt-4 p-3 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl">
                            <p className="text-xs text-[var(--text-secondary)]">
                                💡 Level your battle pets to 25 for better performance in pet battles
                            </p>
                        </div>
                    )}
                </div>

                {/* Toys */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Gift className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            Toy Collection
                        </h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-3xl font-bold text-[var(--text-primary)]">
                                {collections.toys.collected}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">Toys Collected</p>
                        </div>

                        <div className="pt-3 border-t border-[var(--border)]">
                            <p className="text-xs text-[var(--text-secondary)] mb-2">Progress:</p>
                            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                                <div
                                    className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${Math.min((collections.toys.collected / 500) * 100, 100)}%`,
                                    }}
                                />
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {collections.toys.collected < 500
                                    ? `${500 - collections.toys.collected} toys to reach 500 milestone`
                                    : 'Impressive collection! 🎉'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transmog */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            Transmog Collection
                        </h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-3xl font-bold text-[var(--text-primary)]">
                                {collections.transmog.total_appearances}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">Appearances Unlocked</p>
                        </div>

                        <div className="pt-3 border-t border-[var(--border)]">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[var(--text-secondary)]">Armor Slots:</span>
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                    {collections.transmog.slots_unlocked} slots
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-gradient-to-br from-purple-500/5 to-[var(--accent)]/5 border border-purple-500/20 rounded-xl">
                        <p className="text-xs text-[var(--text-secondary)]">
                            💡 Run old raids and dungeons to unlock more transmog appearances
                        </p>
                    </div>
                </div>

                {/* Mounts */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <CircleDot className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            Mount Collection
                        </h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-3xl font-bold text-[var(--text-primary)]">
                                {collections.mounts_count}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">Mounts Collected</p>
                        </div>

                        <div className="pt-3 border-t border-[var(--border)]">
                            <p className="text-xs text-[var(--text-secondary)] mb-2">Milestones:</p>
                            <div className="space-y-1">
                                {collections.mounts_count >= 400 ? (
                                    <p className="text-xs text-green-500">✓ Lord of the Reins (400)</p>
                                ) : (
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        ○ Lord of the Reins: {400 - collections.mounts_count} to go
                                    </p>
                                )}
                                {collections.mounts_count >= 500 ? (
                                    <p className="text-xs text-green-500">✓ Mount Collector (500)</p>
                                ) : (
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        ○ Mount Collector: {500 - collections.mounts_count} to go
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collection Progress Summary */}
            <div className="bg-gradient-to-br from-purple-500/5 to-[var(--accent)]/5 border border-purple-500/20 p-6 rounded-3xl">
                <h4 className="text-sm font-semibold text-purple-400 uppercase mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Overall Collection Progress
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-[var(--accent)]">{collections.pets.unique}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Unique Pets</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-[var(--accent)]">{collections.toys.collected}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Toys</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-[var(--accent)]">
                            {collections.transmog.total_appearances}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">Transmogs</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-[var(--accent)]">{collections.mounts_count}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Mounts</p>
                    </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-4 text-center">
                    Collecting is a core part of the Midnight expansion - keep going! 🎯
                </p>
            </div>
        </div>
    );
}
