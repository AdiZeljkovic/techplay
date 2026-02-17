'use client';

import { WowEquipment } from '@/types';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

interface EquipmentViewProps {
    equipment: WowEquipment | null;
}

export default function EquipmentView({ equipment }: EquipmentViewProps) {

    if (!equipment) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">No equipment data available</p>
            </div>
        );
    }

    const getQualityColor = (quality: string): string => {
        const colors: Record<string, string> = {
            POOR: '#9d9d9d',
            COMMON: '#ffffff',
            UNCOMMON: '#1eff00',
            RARE: '#0070dd',
            EPIC: '#a335ee',
            LEGENDARY: '#ff8000',
            ARTIFACT: '#e6cc80',
            HEIRLOOM: '#00ccff',
        };
        return colors[quality] || colors.COMMON;
    };

    const tierProgress = (equipment.tier_pieces / 5) * 100;

    const getIlvlRating = (ilvl: number): { label: string; color: string } => {
        if (ilvl >= 640) return { label: 'Mythic Raider', color: 'text-purple-500' };
        if (ilvl >= 630) return { label: 'Heroic Raider', color: 'text-blue-500' };
        if (ilvl >= 620) return { label: 'Normal Raider', color: 'text-green-500' };
        if (ilvl >= 600) return { label: 'Mythic+ Ready', color: 'text-yellow-500' };
        return { label: 'Gearing Up', color: 'text-[var(--text-secondary)]' };
    };

    const getNextIlvlMilestone = (ilvl: number): number | null => {
        if (ilvl < 600) return 600;
        if (ilvl < 620) return 620;
        if (ilvl < 630) return 630;
        if (ilvl < 640) return 640;
        return null;
    };

    const ilvlRating = getIlvlRating(equipment.item_level);
    const nextIlvl = getNextIlvlMilestone(equipment.item_level);

    const formatStatName = (statKey: string): string => {
        const names: Record<string, string> = {
            strength: 'Strength',
            agility: 'Agility',
            intellect: 'Intellect',
            stamina: 'Stamina',
            critical_strike: 'Critical Strike',
            haste: 'Haste',
            mastery: 'Mastery',
            versatility: 'Versatility',
            armor: 'Armor',
        };
        return names[statKey] || statKey;
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Average iLvL */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-orange-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-[var(--accent)] transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-orange-500 flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                Item Level
                            </h3>
                        </div>
                        <p className="text-5xl font-black text-[var(--text-primary)] mb-3">{equipment.item_level}</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${ilvlRating.color}`}>
                                {ilvlRating.label}
                            </span>
                            {nextIlvl && (
                                <>
                                    <span className="text-[var(--border)]">•</span>
                                    <span className="text-xs text-[var(--text-secondary)] font-semibold">
                                        Next: {nextIlvl} (+{nextIlvl - equipment.item_level})
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tier Set Progress */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-purple-500 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                Tier Set
                            </h3>
                        </div>
                        <p className="text-5xl font-black text-[var(--text-primary)] mb-4">
                            {equipment.tier_pieces}/5
                        </p>
                        <div className="w-full bg-[var(--bg-secondary)] rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/30"
                                style={{ width: `${tierProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Issues */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-red-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-yellow-500 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-red-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">Issues</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--text-secondary)] font-semibold">Missing Enchants:</span>
                                <span className="text-2xl font-black text-[var(--text-primary)]">{equipment.missing_enchants.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--text-secondary)] font-semibold">Missing Gems:</span>
                                <span className="text-2xl font-black text-[var(--text-primary)]">{equipment.missing_gems.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment List */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-30" />
                <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl">
                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase mb-6 tracking-wide">Equipment</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {equipment.slots.map((slot, index) => {
                        const hasStats = slot.stats && Object.keys(slot.stats).length > 0;

                        return (
                            <div
                                key={index}
                                className="group relative bg-[var(--bg-secondary)] border-2 border-[var(--border)] rounded-2xl hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/20 transition-all overflow-hidden"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                                    {slot.slot.replace('_', ' ')}
                                                </span>
                                                {slot.is_tier && (
                                                    <span className="px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black shadow-lg shadow-purple-500/30">
                                                        TIER
                                                    </span>
                                                )}
                                            </div>
                                            <p
                                                className="font-bold mb-3 text-lg"
                                                style={{ color: getQualityColor(slot.quality) }}
                                            >
                                                {slot.name}
                                            </p>

                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="text-[var(--text-secondary)] font-semibold">
                                                    iLvL: <span className="text-[var(--text-primary)] font-bold">{slot.ilvl}</span>
                                                </span>

                                                {slot.gem_slots > 0 && (
                                                    <span className="text-[var(--text-secondary)] font-semibold">
                                                        Gems: <span className={slot.gems_filled === slot.gem_slots ? 'text-green-500 font-bold' : 'text-[var(--accent)] font-bold'}>
                                                            {slot.gems_filled}/{slot.gem_slots}
                                                        </span>
                                                    </span>
                                                )}

                                                <span className={`font-bold ${slot.enchanted ? 'text-green-500' : 'text-[var(--accent)]'}`}>
                                                    {slot.enchanted ? '✓ Enchanted' : '✗ No Enchant'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-3xl font-black text-[var(--text-primary)] group-hover:scale-110 transition-transform">
                                                {slot.ilvl}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Section - Always Visible */}
                                {hasStats && (
                                    <div className="border-t-2 border-[var(--border)] bg-[var(--bg-elevated)] p-4 pt-4">
                                        <h4 className="text-xs font-black text-[var(--text-primary)] uppercase mb-3 flex items-center gap-2 tracking-wider">
                                            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                                            Item Stats
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(slot.stats!).map(([statKey, statValue]) => (
                                                <div
                                                    key={statKey}
                                                    className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)]/30 transition-colors"
                                                >
                                                    <span className="text-xs text-[var(--text-secondary)] font-semibold">
                                                        {formatStatName(statKey)}
                                                    </span>
                                                    <span className="text-sm font-black text-[var(--text-primary)]">
                                                        {statValue}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                </div>
            </div>

            {/* Optimization Recommendations */}
            {(equipment.missing_enchants.length > 0 || equipment.missing_gems.length > 0 || equipment.tier_pieces < 4) && (
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-yellow-500 rounded-3xl blur-xl opacity-20" />
                    <div className="relative bg-[var(--accent)]/5 border-2 border-[var(--accent)]/30 p-8 rounded-3xl shadow-2xl">
                        <h4 className="text-xl font-black text-[var(--accent)] mb-6 flex items-center gap-3 tracking-wide">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-yellow-500 flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            Optimization Recommendations
                        </h4>

                    {equipment.missing_enchants.length > 0 && (
                        <div className="mb-6">
                            <p className="text-base font-black text-[var(--text-primary)] mb-3">
                                Missing Enchants ({equipment.missing_enchants.length} slots):
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {equipment.missing_enchants.map((slot, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 text-xs font-bold rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
                                    >
                                        {slot}
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-2 font-semibold">
                                💡 Enchants typically provide 2-3% performance increase. Visit the Auction House or ask a guild enchanter.
                            </p>
                        </div>
                    )}

                    {equipment.missing_gems.length > 0 && (
                        <div className="mb-6">
                            <p className="text-base font-black text-[var(--text-primary)] mb-3">
                                Empty Gem Slots ({equipment.missing_gems.length} sockets):
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {equipment.missing_gems.map((slot, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 text-xs font-bold rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
                                    >
                                        {slot}
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-2 font-semibold">
                                💡 Gems add valuable secondary stats. Check your class guide for optimal gem choices.
                            </p>
                        </div>
                    )}

                    {equipment.tier_pieces < 4 && (
                        <div>
                            <p className="text-base font-black text-[var(--text-primary)] mb-3">
                                Tier Set Incomplete ({equipment.tier_pieces}/5 pieces):
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] font-semibold">
                                💡 Get {4 - equipment.tier_pieces} more tier pieces for the powerful 4-piece set bonus. Farm current raid on any difficulty or use Great Vault rewards.
                            </p>
                        </div>
                    )}
                    </div>
                </div>
            )}
        </div>
    );
}
