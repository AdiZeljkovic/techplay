'use client';

import { WowTabId } from '@/types';

interface TabNavigationProps {
    activeTab: WowTabId;
    setActiveTab: (tab: WowTabId) => void;
    badges?: {
        gear?: string;
        mythic?: string;
        raids?: string;
    };
}

export default function TabNavigation({ activeTab, setActiveTab, badges }: TabNavigationProps) {
    const tabs: { id: WowTabId; label: string; badge?: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'gear', label: 'Gear', badge: badges?.gear },
        { id: 'mythic', label: 'M+ Dungeons', badge: badges?.mythic },
        { id: 'raids', label: 'Raids', badge: badges?.raids },
    ];

    return (
        <div className="border-b border-[var(--border)] overflow-x-auto">
            <div className="flex gap-1 min-w-max">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            relative px-6 py-4 font-semibold text-sm uppercase tracking-wider
                            transition-all duration-200
                            ${
                                activeTab === tab.id
                                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-b-2 border-transparent'
                            }
                        `}
                    >
                        <span className="flex items-center gap-2">
                            {tab.label}
                            {tab.badge && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                                    {tab.badge}
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
