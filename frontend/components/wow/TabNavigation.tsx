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
        <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-[var(--accent)] rounded-3xl blur-xl opacity-20" />

            <div className="relative bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-3xl p-3 shadow-2xl">
                {/* Grid layout: 2 cols on mobile, 4 on tablet, 7 on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group relative px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-wider
                                    transition-all duration-300 flex flex-col items-center justify-center gap-2
                                    ${
                                        isActive
                                            ? 'bg-gradient-to-br from-[var(--accent)] to-orange-600 text-white shadow-lg shadow-[var(--accent)]/50 scale-105'
                                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-gradient-to-br hover:from-[var(--bg-secondary)] hover:to-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:scale-105 border-2 border-[var(--border)] hover:border-[var(--accent)]/40'
                                    }
                                `}
                            >
                                {/* Icon */}
                                <div className={`relative ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                                    {isActive && (
                                        <div className="absolute -inset-2 bg-white/20 rounded-full blur-md" />
                                    )}
                                    <Icon className={`relative w-6 h-6 ${isActive ? 'text-white' : 'text-[var(--accent)]'}`} />
                                </div>

                                {/* Label */}
                                <span className={`text-center leading-tight ${isActive ? 'text-white' : ''}`}>
                                    {tab.label}
                                </span>

                                {/* Badge */}
                                {tab.badge && (
                                    <span className={`absolute -top-1 -right-1 px-2 py-0.5 text-xs rounded-full font-black shadow-lg ${
                                        isActive
                                            ? 'bg-white text-[var(--accent)] shadow-white/30'
                                            : 'bg-[var(--accent)] text-white shadow-[var(--accent)]/40'
                                    }`}>
                                        {tab.badge}
                                    </span>
                                )}

                                {/* Bottom glow for active tab */}
                                {isActive && (
                                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full blur-sm" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
