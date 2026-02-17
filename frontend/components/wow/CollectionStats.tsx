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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Battle Pets */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-pink-500 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                Battle Pets
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-5xl font-black text-[var(--text-primary)]">
                                    {collections.pets.total}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)] font-semibold mt-1">Total Pets Collected</p>
                            </div>

                            <div className="pt-4 border-t-2 border-[var(--border)] space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[var(--text-secondary)] font-semibold">Unique Species:</span>
                                    <span className="text-lg font-black text-[var(--text-primary)]">
                                        {collections.pets.unique}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[var(--text-secondary)] font-semibold">Max Level (25):</span>
                                    <span className="text-lg font-black text-[var(--accent)]">
                                        {collections.pets.max_level}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {collections.pets.max_level < 10 && collections.pets.total > 0 && (
                            <div className="mt-4 p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                                <p className="text-xs text-[var(--text-secondary)] font-semibold">
                                    💡 Level your battle pets to 25 for better performance in pet battles
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Toys */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-purple-500 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Gift className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                Toy Collection
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-5xl font-black text-[var(--text-primary)]">
                                    {collections.toys.collected}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)] font-semibold mt-1">Toys Collected</p>
                            </div>

                            <div className="pt-4 border-t-2 border-[var(--border)]">
                                <p className="text-xs text-[var(--text-secondary)] font-black uppercase tracking-wider mb-3">Progress:</p>
                                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-3 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/30"
                                        style={{
                                            width: `${Math.min((collections.toys.collected / 500) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-2">
                                    {collections.toys.collected < 500
                                        ? `${500 - collections.toys.collected} toys to reach 500 milestone`
                                        : 'Impressive collection! 🎉'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transmog */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-cyan-500 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                Transmog Collection
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-5xl font-black text-[var(--text-primary)]">
                                    {collections.transmog.total_appearances}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)] font-semibold mt-1">Appearances Unlocked</p>
                            </div>

                            <div className="pt-4 border-t-2 border-[var(--border)]">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[var(--text-secondary)] font-semibold">Armor Slots:</span>
                                    <span className="text-lg font-black text-[var(--text-primary)]">
                                        {collections.transmog.slots_unlocked} slots
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                            <p className="text-xs text-[var(--text-secondary)] font-semibold">
                                💡 Run old raids and dungeons to unlock more transmog appearances
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mounts */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-emerald-500 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <CircleDot className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                Mount Collection
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-5xl font-black text-[var(--text-primary)]">
                                    {collections.mounts_count}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)] font-semibold mt-1">Mounts Collected</p>
                            </div>

                            <div className="pt-4 border-t-2 border-[var(--border)]">
                                <p className="text-xs text-[var(--text-secondary)] font-black uppercase tracking-wider mb-3">Milestones:</p>
                                <div className="space-y-2">
                                    {collections.mounts_count >= 400 ? (
                                        <p className="text-sm text-green-500 font-bold">✓ Lord of the Reins (400)</p>
                                    ) : (
                                        <p className="text-sm text-[var(--text-secondary)] font-semibold">
                                            ○ Lord of the Reins: {400 - collections.mounts_count} to go
                                        </p>
                                    )}
                                    {collections.mounts_count >= 500 ? (
                                        <p className="text-sm text-green-500 font-bold">✓ Mount Collector (500)</p>
                                    ) : (
                                        <p className="text-sm text-[var(--text-secondary)] font-semibold">
                                            ○ Mount Collector: {500 - collections.mounts_count} to go
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collection Progress Summary */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-[var(--accent)] rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-gradient-to-br from-purple-500/10 to-[var(--accent)]/5 border-2 border-purple-500/30 p-8 rounded-3xl shadow-2xl">
                    <h4 className="text-sm font-black text-purple-400 uppercase mb-6 tracking-wider flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Overall Collection Progress
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-[var(--bg-card)] border border-pink-500/30 rounded-2xl hover:scale-105 transition-transform">
                            <p className="text-3xl font-black text-pink-500">{collections.pets.unique}</p>
                            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-2">Unique Pets</p>
                        </div>
                        <div className="text-center p-4 bg-[var(--bg-card)] border border-purple-500/30 rounded-2xl hover:scale-105 transition-transform">
                            <p className="text-3xl font-black text-purple-500">{collections.toys.collected}</p>
                            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-2">Toys</p>
                        </div>
                        <div className="text-center p-4 bg-[var(--bg-card)] border border-cyan-500/30 rounded-2xl hover:scale-105 transition-transform">
                            <p className="text-3xl font-black text-cyan-500">
                                {collections.transmog.total_appearances}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-2">Transmogs</p>
                        </div>
                        <div className="text-center p-4 bg-[var(--bg-card)] border border-emerald-500/30 rounded-2xl hover:scale-105 transition-transform">
                            <p className="text-3xl font-black text-emerald-500">{collections.mounts_count}</p>
                            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-2">Mounts</p>
                        </div>
                    </div>

                    <p className="text-sm text-purple-300 bg-purple-500/10 px-4 py-3 rounded-xl font-bold mt-6 text-center">
                        🎯 Collecting is a core part of the Midnight expansion - keep going!
                    </p>
                </div>
            </div>
        </div>
    );
}
