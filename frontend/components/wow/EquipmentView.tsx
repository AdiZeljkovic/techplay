'use client';

import { useState } from 'react';
import { WowEquipment } from '@/types';
import { Shield, Sparkles, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EquipmentViewProps {
    equipment: WowEquipment | null;
}

export default function EquipmentView({ equipment }: EquipmentViewProps) {
    const [expandedSlot, setExpandedSlot] = useState<number | null>(null);

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

    const toggleSlot = (index: number) => {
        setExpandedSlot(expandedSlot === index ? null : index);
    };

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
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-sm font-semibold ${ilvlRating.color}`}>
                            {ilvlRating.label}
                        </span>
                        {nextIlvl && (
                            <>
                                <span className="text-[var(--border)]">•</span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    Next: {nextIlvl} (+{nextIlvl - equipment.item_level})
                                </span>
                            </>
                        )}
                    </div>
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
                    {equipment.slots.map((slot, index) => {
                        const isExpanded = expandedSlot === index;
                        const hasStats = slot.stats && Object.keys(slot.stats).length > 0;

                        return (
                            <motion.div
                                key={index}
                                layout
                                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] transition-colors overflow-hidden"
                            >
                                <button
                                    onClick={() => hasStats && toggleSlot(index)}
                                    className="w-full p-4 text-left transition-colors"
                                    disabled={!hasStats}
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
                                                {hasStats && (
                                                    <ChevronDown
                                                        className={`w-4 h-4 text-[var(--accent)] transition-transform duration-200 ${
                                                            isExpanded ? 'rotate-180' : ''
                                                        }`}
                                                    />
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
                                </button>

                                {/* Expandable Stats Section */}
                                <AnimatePresence>
                                    {isExpanded && hasStats && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-[var(--border)]"
                                        >
                                            <div className="p-4 pt-3 bg-[var(--bg-elevated)]">
                                                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase mb-3 flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                                                    Item Stats
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(slot.stats!).map(([statKey, statValue]) => (
                                                        <div
                                                            key={statKey}
                                                            className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] rounded-lg"
                                                        >
                                                            <span className="text-xs text-[var(--text-secondary)]">
                                                                {formatStatName(statKey)}
                                                            </span>
                                                            <span className="text-sm font-bold text-[var(--text-primary)]">
                                                                {statValue}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Optimization Recommendations */}
            {(equipment.missing_enchants.length > 0 || equipment.missing_gems.length > 0 || equipment.tier_pieces < 4) && (
                <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-6 rounded-3xl">
                    <h4 className="text-lg font-bold text-[var(--accent)] mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Optimization Recommendations
                    </h4>

                    {equipment.missing_enchants.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                                Missing Enchants ({equipment.missing_enchants.length} slots):
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {equipment.missing_enchants.map((slot, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)]"
                                    >
                                        {slot}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-2">
                                💡 Enchants typically provide 2-3% performance increase. Visit the Auction House or ask a guild enchanter.
                            </p>
                        </div>
                    )}

                    {equipment.missing_gems.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                                Empty Gem Slots ({equipment.missing_gems.length} sockets):
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {equipment.missing_gems.map((slot, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)]"
                                    >
                                        {slot}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-2">
                                💡 Gems add valuable secondary stats. Check your class guide for optimal gem choices.
                            </p>
                        </div>
                    )}

                    {equipment.tier_pieces < 4 && (
                        <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                                Tier Set Incomplete ({equipment.tier_pieces}/5 pieces):
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                💡 Get {4 - equipment.tier_pieces} more tier pieces for the powerful 4-piece set bonus. Farm current raid on any difficulty or use Great Vault rewards.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
