'use client';

import { WowTabId } from '@/types';
import { LayoutGrid, Shield, Trophy, Swords, Sword, Box, Hammer } from 'lucide-react';

interface TabNavigationProps {
    activeTab: WowTabId;
    setActiveTab: (tab: WowTabId) => void;
    badges?: {
        gear?: string;
        mythic?: string;
        raids?: string;
        pvp?: string;
        collections?: string;
        professions?: string;
    };
}

export default function TabNavigation({ activeTab, setActiveTab, badges }: TabNavigationProps) {
    const tabs: { id: WowTabId; label: string; icon: any; badge?: string }[] = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'gear', label: 'Gear', icon: Shield, badge: badges?.gear },
        { id: 'mythic', label: 'M+ Dungeons', icon: Trophy, badge: badges?.mythic },
        { id: 'raids', label: 'Raids', icon: Swords, badge: badges?.raids },
        { id: 'pvp', label: 'PvP', icon: Sword, badge: badges?.pvp },
        { id: 'collections', label: 'Collections', icon: Box, badge: badges?.collections },
        { id: 'professions', label: 'Professions', icon: Hammer, badge: badges?.professions },
    ];

    return (
        <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-3xl p-2 overflow-x-auto shadow-xl">
            <div className="flex gap-2 min-w-max">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                group relative px-5 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider
                                transition-all duration-300 flex items-center gap-3
                                ${
                                    isActive
                                        ? 'bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white shadow-lg shadow-[var(--accent)]/40 scale-105'
                                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] hover:scale-102 border border-[var(--border)] hover:border-[var(--accent)]/30'
                                }
                            `}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--accent)] group-hover:scale-110'} transition-transform`} />

                            <span className="flex items-center gap-2">
                                {tab.label}
                                {tab.badge && (
                                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                    }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </span>

                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
