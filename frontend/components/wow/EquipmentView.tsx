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

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Average iLvL */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            Item Level
                        </h3>
                    </div>
                    <p className="text-4xl font-bold text-[var(--text-primary)]">{equipment.item_level}</p>
                </div>

                {/* Tier Set Progress */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">
                            Tier Set
                        </h3>
                    </div>
                    <p className="text-4xl font-bold text-[var(--text-primary)]">
                        {equipment.tier_pieces}/5
                    </p>
                    <div className="mt-3 w-full bg-[var(--bg-secondary)] rounded-full h-2">
                        <div
                            className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${tierProgress}%` }}
                        />
                    </div>
                </div>

                {/* Issues */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase">Issues</h3>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Missing Enchants: <span className="text-[var(--text-primary)] font-semibold">{equipment.missing_enchants.length}</span>
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Missing Gems: <span className="text-[var(--text-primary)] font-semibold">{equipment.missing_gems.length}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Equipment List */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase mb-6">Equipment</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {equipment.slots.map((slot, index) => (
                        <div
                            key={index}
                            className="bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-xl hover:border-[var(--accent)] transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">
                                            {slot.slot.replace('_', ' ')}
                                        </span>
                                        {slot.is_tier && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold">
                                                TIER
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className="font-semibold mb-2"
                                        style={{ color: getQualityColor(slot.quality) }}
                                    >
                                        {slot.name}
                                    </p>

                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-[var(--text-secondary)]">
                                            iLvL: <span className="text-[var(--text-primary)] font-semibold">{slot.ilvl}</span>
                                        </span>

                                        {slot.gem_slots > 0 && (
                                            <span className="text-[var(--text-secondary)]">
                                                Gems: <span className={slot.gems_filled === slot.gem_slots ? 'text-green-500' : 'text-[var(--accent)]'}>
                                                    {slot.gems_filled}/{slot.gem_slots}
                                                </span>
                                            </span>
                                        )}

                                        <span className={slot.enchanted ? 'text-green-500' : 'text-[var(--accent)]'}>
                                            {slot.enchanted ? '✓ Enchanted' : '✗ No Enchant'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                                        {slot.ilvl}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Warnings */}
            {(equipment.missing_enchants.length > 0 || equipment.missing_gems.length > 0) && (
                <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-6 rounded-3xl">
                    <h4 className="text-lg font-bold text-[var(--accent)] mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Optimization Needed
                    </h4>

                    {equipment.missing_enchants.length > 0 && (
                        <div className="mb-3">
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                                Missing Enchants:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {equipment.missing_enchants.map((slot, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)]"
                                    >
                                        {slot}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {equipment.missing_gems.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                                Missing Gems:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {equipment.missing_gems.map((slot, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)]"
                                    >
                                        {slot}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
