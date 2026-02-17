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
                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-orange-500 flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
                            <Hammer className="w-5 h-5 text-white" />
                        </div>
                        Primary Professions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {professions.primary.map((prof, idx) => {
                            const Icon = getProfessionIcon(prof.name);
                            const skillPercent = (prof.skill_level / prof.max_skill) * 100;
                            const isMaxLevel = prof.skill_level === prof.max_skill;

                            return (
                                <div
                                    key={idx}
                                    className="relative"
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-orange-500 rounded-3xl blur-xl opacity-15" />
                                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl hover:border-[var(--accent)] transition-all">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-orange-500/10 flex items-center justify-center border border-[var(--accent)]/30">
                                                <Icon className="w-6 h-6 text-[var(--accent)]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-[var(--text-primary)] text-lg">{prof.name}</h4>
                                                <p className={`text-sm font-black ${getSkillColor(prof.skill_level, prof.max_skill)}`}>
                                                    {prof.skill_level} / {prof.max_skill}
                                                </p>
                                            </div>
                                            {isMaxLevel && (
                                                <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-black border border-[var(--accent)]/30">
                                                    MAX
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-3">
                                                <div
                                                    className="bg-gradient-to-r from-[var(--accent)] to-orange-500 h-3 rounded-full transition-all duration-300 shadow-lg shadow-[var(--accent)]/20"
                                                    style={{ width: `${skillPercent}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] font-semibold mt-2">
                                                {isMaxLevel
                                                    ? '✓ Max skill level reached!'
                                                    : `${prof.max_skill - prof.skill_level} points to max`}
                                            </p>
                                        </div>

                                        {!isMaxLevel && (
                                            <div className="p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl">
                                                <p className="text-xs text-[var(--text-secondary)] font-semibold">
                                                    💡 Craft items or use profession knowledge to level up
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {professions.primary.length === 1 && (
                        <div className="mt-6 p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-3xl">
                            <p className="text-sm text-[var(--text-secondary)] font-semibold">
                                💡 You can learn one more primary profession! Visit a profession trainer in any major city.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Secondary Professions */}
            {hasSecondary && (
                <div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        Secondary Professions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {professions.secondary.map((prof, idx) => {
                            const Icon = getProfessionIcon(prof.name);
                            const skillPercent = (prof.skill_level / prof.max_skill) * 100;
                            const isMaxLevel = prof.skill_level === prof.max_skill;

                            return (
                                <div
                                    key={idx}
                                    className="relative"
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-15" />
                                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-6 rounded-3xl shadow-2xl hover:border-purple-500 transition-all">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center border border-purple-500/30">
                                                <Icon className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-[var(--text-primary)]">{prof.name}</h4>
                                                <p className={`text-xs font-black ${getSkillColor(prof.skill_level, prof.max_skill)}`}>
                                                    {prof.skill_level} / {prof.max_skill}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2.5">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/20"
                                                style={{ width: `${skillPercent}%` }}
                                            />
                                        </div>

                                        {isMaxLevel && (
                                            <p className="text-xs text-green-500 font-bold mt-3">✓ Maxed</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Profession Tips */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-2 border-blue-500/30 p-8 rounded-3xl shadow-2xl">
                    <h4 className="text-sm font-black text-blue-400 uppercase mb-6 tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Profession Tips for Midnight
                    </h4>

                    <div className="space-y-3 text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <p><strong className="text-[var(--text-primary)] font-bold">Max out professions</strong> before Midnight launch to craft high-level gear immediately</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <p><strong className="text-[var(--text-primary)] font-bold">Alchemy & Enchanting</strong> are highly profitable - flasks and enchants are always in demand</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <p><strong className="text-[var(--text-primary)] font-bold">Gathering professions</strong> (Mining, Herbalism, Skinning) provide steady gold income</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <p><strong className="text-[var(--text-primary)] font-bold">Engineering</strong> offers unique utility items and gadgets for exploration</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overall Progress */}
            {hasPrimary && (
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] via-orange-500 to-[var(--accent)] rounded-3xl blur-xl opacity-15" />
                    <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] p-8 rounded-3xl shadow-2xl">
                        <h4 className="text-sm font-black text-[var(--text-secondary)] uppercase mb-6 tracking-wider">
                            Overall Profession Progress
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {professions.primary.map((prof, idx) => {
                                const avgSkill = Math.round((prof.skill_level / prof.max_skill) * 100);
                                return (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)] transition-all">
                                        <span className="text-sm font-bold text-[var(--text-primary)]">{prof.name}</span>
                                        <span className={`text-2xl font-black ${getSkillColor(prof.skill_level, prof.max_skill)}`}>
                                            {avgSkill}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
