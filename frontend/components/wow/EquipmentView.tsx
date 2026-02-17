'use client';

import { WowEquipment, EquipmentSlot } from '@/types';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface EquipmentViewProps {
    equipment: WowEquipment | null;
}

export default function EquipmentView({ equipment }: EquipmentViewProps) {
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

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

    // Map slots to equipment items
    const getSlotItem = (slotName: string): EquipmentSlot | null => {
        return equipment.slots.find((s) => s.slot.toUpperCase() === slotName.toUpperCase()) || null;
    };

    // Paperdoll slot component
    const PaperdollSlot = ({ slotName, label }: { slotName: string; label?: string }) => {
        const item = getSlotItem(slotName);
        const displayLabel = label || slotName.replace('_', ' ');

        return (
            <div
                className="relative group"
                onMouseEnter={() => setHoveredSlot(slotName)}
                onMouseLeave={() => setHoveredSlot(null)}
            >
                <div
                    className={`
                        w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xs font-bold
                        transition-all duration-200 cursor-pointer
                        ${
                            item
                                ? 'border-[var(--accent)] bg-[var(--bg-card)] hover:scale-110 hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/20'
                                : 'border-[var(--border)] bg-[var(--bg-secondary)] opacity-40'
                        }
                    `}
                    style={{
                        borderColor: item ? getQualityColor(item.quality) : undefined,
                    }}
                >
                    {item ? (
                        <span className="text-[var(--text-primary)]">{item.ilvl}</span>
                    ) : (
                        <span className="text-[var(--text-secondary)] text-[10px]">---</span>
                    )}
                </div>

                {/* Hover Tooltip */}
                {item && hoveredSlot === slotName && (
                    <div className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-4 bg-[var(--bg-card)] border-2 rounded-xl shadow-2xl pointer-events-none"
                        style={{ borderColor: getQualityColor(item.quality) }}
                    >
                        <div className="space-y-2">
                            <div>
                                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">
                                    {displayLabel}
                                </p>
                                <p
                                    className="font-bold text-sm"
                                    style={{ color: getQualityColor(item.quality) }}
                                >
                                    {item.name}
                                </p>
                            </div>

                            <div className="pt-2 border-t border-[var(--border)] space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[var(--text-secondary)]">Item Level:</span>
                                    <span className="text-[var(--text-primary)] font-semibold">{item.ilvl}</span>
                                </div>

                                {item.is_tier && (
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold">
                                            TIER SET
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-xs">
                                    <span
                                        className={`${
                                            item.enchanted ? 'text-green-500' : 'text-red-500'
                                        } font-semibold`}
                                    >
                                        {item.enchanted ? '✓ Enchanted' : '✗ No Enchant'}
                                    </span>
                                </div>

                                {item.gem_slots > 0 && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[var(--text-secondary)]">Gems:</span>
                                        <span
                                            className={`font-semibold ${
                                                item.gems_filled === item.gem_slots
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                            }`}
                                        >
                                            {item.gems_filled}/{item.gem_slots}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Slot Label (below) */}
                <p className="text-[9px] text-center text-[var(--text-secondary)] mt-1 uppercase font-semibold">
                    {displayLabel.split('_').join(' ').substring(0, 6)}
                </p>
            </div>
        );
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
                            Missing Enchants:{' '}
                            <span className="text-[var(--text-primary)] font-semibold">
                                {equipment.missing_enchants.length}
                            </span>
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Missing Gems:{' '}
                            <span className="text-[var(--text-primary)] font-semibold">
                                {equipment.missing_gems.length}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 2D Paperdoll Layout */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase mb-6 text-center">
                    Character Equipment
                </h3>

                <div className="flex items-center justify-center">
                    {/* Paperdoll Grid */}
                    <div className="relative">
                        {/* HEAD */}
                        <div className="flex justify-center mb-3">
                            <PaperdollSlot slotName="HEAD" label="Head" />
                        </div>

                        {/* NECK */}
                        <div className="flex justify-center mb-3">
                            <PaperdollSlot slotName="NECK" label="Neck" />
                        </div>

                        {/* SHOULDERS */}
                        <div className="flex justify-center gap-20 mb-3">
                            <PaperdollSlot slotName="SHOULDER" label="Shoulder" />
                            <div className="w-14"></div>
                            <PaperdollSlot slotName="SHOULDER" label="Shoulder" />
                        </div>

                        {/* BACK */}
                        <div className="flex justify-center mb-3">
                            <PaperdollSlot slotName="BACK" label="Back" />
                        </div>

                        {/* CHEST */}
                        <div className="flex justify-center mb-3">
                            <PaperdollSlot slotName="CHEST" label="Chest" />
                        </div>

                        {/* WRISTS */}
                        <div className="flex justify-center gap-20 mb-3">
                            <PaperdollSlot slotName="WRIST" label="Wrist" />
                            <div className="w-14"></div>
                            <PaperdollSlot slotName="WRIST" label="Wrist" />
                        </div>

                        {/* HANDS & WAIST */}
                        <div className="flex justify-center items-center gap-4 mb-3">
                            <PaperdollSlot slotName="HANDS" label="Hands" />
                            <PaperdollSlot slotName="WAIST" label="Waist" />
                        </div>

                        {/* LEGS */}
                        <div className="flex justify-center mb-3">
                            <PaperdollSlot slotName="LEGS" label="Legs" />
                        </div>

                        {/* FEET */}
                        <div className="flex justify-center mb-3">
                            <PaperdollSlot slotName="FEET" label="Feet" />
                        </div>

                        {/* RINGS */}
                        <div className="flex justify-center gap-4 mb-3">
                            <PaperdollSlot slotName="FINGER_1" label="Ring 1" />
                            <PaperdollSlot slotName="FINGER_2" label="Ring 2" />
                        </div>

                        {/* TRINKETS */}
                        <div className="flex justify-center gap-4 mb-3">
                            <PaperdollSlot slotName="TRINKET_1" label="Trinket 1" />
                            <PaperdollSlot slotName="TRINKET_2" label="Trinket 2" />
                        </div>

                        {/* WEAPONS */}
                        <div className="flex justify-center gap-4">
                            <PaperdollSlot slotName="MAIN_HAND" label="Main Hand" />
                            <PaperdollSlot slotName="OFF_HAND" label="Off Hand" />
                        </div>
                    </div>
                </div>

                <p className="text-xs text-center text-[var(--text-secondary)] mt-6">
                    💡 Hover over items to see details
                </p>
            </div>

            {/* Optimization Recommendations */}
            {(equipment.missing_enchants.length > 0 ||
                equipment.missing_gems.length > 0 ||
                equipment.tier_pieces < 4) && (
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
                                💡 Enchants typically provide 2-3% performance increase. Visit the Auction House or
                                ask a guild enchanter.
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
                                💡 Get {4 - equipment.tier_pieces} more tier pieces for the powerful 4-piece set
                                bonus. Farm current raid on any difficulty or use Great Vault rewards.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
