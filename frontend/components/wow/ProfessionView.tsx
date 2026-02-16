'use client';

import { WowProfessions } from '@/types';
import { Hammer, Fish, UtensilsCrossed, Search, AlertCircle, TrendingUp } from 'lucide-react';

interface ProfessionViewProps {
    professions: WowProfessions | null;
}

export default function ProfessionView({ professions }: ProfessionViewProps) {
    if (!professions) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">No profession data available</p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Profession data may not be available for all characters
                </p>
            </div>
        );
    }

    const hasPrimary = professions.primary.length > 0;
    const hasSecondary = professions.secondary.length > 0;

    if (!hasPrimary && !hasSecondary) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center">
                <Hammer className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Professions Learned</h3>
                <p className="text-[var(--text-secondary)] mb-4">Learn professions to craft gear, consumables, and earn gold!</p>
                <div className="max-w-md mx-auto text-left bg-[var(--bg-secondary)] p-4 rounded-xl">
                    <p className="text-sm text-[var(--text-secondary)] mb-2 font-semibold">Popular Professions:</p>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                        <li>• <strong>Alchemy</strong> - Craft potions and flasks</li>
                        <li>• <strong>Enchanting</strong> - Enchant gear for bonus stats</li>
                        <li>• <strong>Jewelcrafting</strong> - Craft gems and rings</li>
                        <li>• <strong>Engineering</strong> - Unique gadgets and utility</li>
                    </ul>
                </div>
            </div>
        );
    }

    const getProfessionIcon = (profName: string) => {
        const name = profName.toLowerCase();
        if (name.includes('cooking')) return UtensilsCrossed;
        if (name.includes('fishing')) return Fish;
        if (name.includes('archaeology')) return Search;
        return Hammer;
    };

    const getSkillColor = (current: number, max: number): string => {
        const percent = (current / max) * 100;
        if (percent === 100) return 'text-[var(--accent)]';
        if (percent >= 75) return 'text-green-500';
        if (percent >= 50) return 'text-yellow-500';
        return 'text-orange-500';
    };

    return (
        <div className="space-y-6">
            {/* Primary Professions */}
            {hasPrimary && (
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <Hammer className="w-5 h-5 text-[var(--accent)]" />
                        Primary Professions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {professions.primary.map((prof, idx) => {
                            const Icon = getProfessionIcon(prof.name);
                            const skillPercent = (prof.skill_level / prof.max_skill) * 100;
                            const isMaxLevel = prof.skill_level === prof.max_skill;

                            return (
                                <div
                                    key={idx}
                                    className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl hover:border-[var(--accent)] transition-colors"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-[var(--accent)]" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[var(--text-primary)]">{prof.name}</h4>
                                            <p className={`text-sm font-semibold ${getSkillColor(prof.skill_level, prof.max_skill)}`}>
                                                {prof.skill_level} / {prof.max_skill}
                                            </p>
                                        </div>
                                        {isMaxLevel && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold">
                                                MAX
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                                            <div
                                                className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${skillPercent}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                                            {isMaxLevel
                                                ? '✓ Max skill level reached!'
                                                : `${prof.max_skill - prof.skill_level} points to max`}
                                        </p>
                                    </div>

                                    {!isMaxLevel && (
                                        <div className="p-3 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl">
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                💡 Craft items or use profession knowledge to level up
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {professions.primary.length === 1 && (
                        <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                            <p className="text-sm text-[var(--text-secondary)]">
                                💡 You can learn one more primary profession! Visit a profession trainer in any major city.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Secondary Professions */}
            {hasSecondary && (
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <UtensilsCrossed className="w-5 h-5 text-[var(--accent)]" />
                        Secondary Professions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {professions.secondary.map((prof, idx) => {
                            const Icon = getProfessionIcon(prof.name);
                            const skillPercent = (prof.skill_level / prof.max_skill) * 100;
                            const isMaxLevel = prof.skill_level === prof.max_skill;

                            return (
                                <div
                                    key={idx}
                                    className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-3xl hover:border-[var(--accent)] transition-colors"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-[var(--text-primary)]">{prof.name}</h4>
                                            <p className={`text-xs font-semibold ${getSkillColor(prof.skill_level, prof.max_skill)}`}>
                                                {prof.skill_level} / {prof.max_skill}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5">
                                        <div
                                            className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${skillPercent}%` }}
                                        />
                                    </div>

                                    {isMaxLevel && (
                                        <p className="text-xs text-green-500 mt-2">✓ Maxed</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Profession Tips */}
            <div className="bg-gradient-to-br from-purple-500/5 to-[var(--accent)]/5 border border-purple-500/20 p-6 rounded-3xl">
                <h4 className="text-sm font-semibold text-purple-400 uppercase mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Profession Tips for Midnight
                </h4>

                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <p>• Max out professions before Midnight launch to craft high-level gear immediately</p>
                    <p>
                        • Alchemy & Enchanting are highly profitable - flasks and enchants are always in demand
                    </p>
                    <p>• Gathering professions (Mining, Herbalism, Skinning) provide steady gold income</p>
                    <p>• Engineering offers unique utility items and gadgets for exploration</p>
                </div>
            </div>

            {/* Overall Progress */}
            {hasPrimary && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl">
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase mb-3">
                        Overall Profession Progress
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {professions.primary.map((prof, idx) => {
                            const avgSkill = Math.round((prof.skill_level / prof.max_skill) * 100);
                            return (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--text-primary)]">{prof.name}:</span>
                                    <span className={`text-lg font-bold ${getSkillColor(prof.skill_level, prof.max_skill)}`}>
                                        {avgSkill}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
