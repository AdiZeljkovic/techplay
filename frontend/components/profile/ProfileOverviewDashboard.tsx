"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
    Gamepad2, Library, Trophy, Activity as ActivityIcon, ListChecks,
    Dna, Coins, Medal, BarChart3, Target, Sparkles, Plus,
} from "lucide-react";
import SectionCard from "./dashboard/SectionCard";
import EmptyState from "./dashboard/EmptyState";
import ProfileActivity from "./ProfileActivity";
import ProfileArticles from "./ProfileArticles";
import type { ProfileUser, ProfileStats, RecentArticle, Achievement } from "@/lib/types/profile";

interface Props {
    userData: ProfileUser;
    stats: ProfileStats;
    achievements: Achievement[];
    recentArticles?: RecentArticle[];
    isStaff: boolean;
    isOwnProfile: boolean;
}

export default function ProfileOverviewDashboard({ userData, stats, achievements, recentArticles, isStaff, isOwnProfile }: Props) {
    const recentUnlocked = (achievements || [])
        .filter((a) => a.is_unlocked)
        .sort((a, b) => new Date(b.unlocked_at || "").getTime() - new Date(a.unlocked_at || "").getTime())
        .slice(0, 6);

    const addCta = isOwnProfile ? (
        <Link href="/games" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider transition-colors">
            <Plus className="w-3.5 h-3.5" /> Browse Games
        </Link>
    ) : undefined;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* === LEFT COLUMN === */}
            <div className="space-y-6 min-w-0">
                {/* Playing Now */}
                <SectionCard title="Playing Now" icon={<Gamepad2 className="w-4 h-4 text-emerald-400/70" />}>
                    <EmptyState
                        icon={<Gamepad2 className="w-6 h-6" />}
                        title={isOwnProfile ? "You're not playing anything yet" : "Nothing being played right now"}
                        hint={isOwnProfile ? "Mark games as \"Playing\" to track your progress here." : undefined}
                        cta={addCta}
                    />
                </SectionCard>

                {/* Collection Snapshot */}
                <SectionCard title="Your Collection Snapshot" icon={<Library className="w-4 h-4 text-violet-400/70" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Backlog", value: stats.backlog_count ?? 0, color: "#60a5fa" },
                            { label: "Completed", value: stats.completed_count ?? 0, color: "#22c55e" },
                            { label: "Wishlist", value: stats.wishlist_count ?? 0, color: "#f472b6" },
                            { label: "Favorites", value: stats.favorites_count ?? 0, color: "#facc15" },
                        ].map((t) => (
                            <div key={t.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                                <span className="block text-2xl font-black text-white tabular-nums leading-none">{t.value}</span>
                                <span className="block mt-1.5 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: t.color }}>{t.label}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Recent Activity */}
                <SectionCard title={isStaff ? "Published Articles" : "Recent Activity"} icon={<ActivityIcon className="w-4 h-4 text-[var(--accent)]" />}>
                    {isStaff ? (
                        <ProfileArticles articles={recentArticles || []} />
                    ) : (userData.posts && userData.posts.length > 0) ? (
                        <ProfileActivity posts={userData.posts || []} />
                    ) : (
                        <EmptyState icon={<ActivityIcon className="w-6 h-6" />} title="No recent activity" compact />
                    )}
                </SectionCard>

                {/* Achievement Spotlight */}
                <SectionCard title="Achievement Spotlight" icon={<Trophy className="w-4 h-4 text-yellow-400" />} action={{ label: "View All", href: "?tab=achievements" }}>
                    {recentUnlocked.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {recentUnlocked.map((ach) => (
                                <div key={ach.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-2.5">
                                        {ach.icon_path ? <img src={ach.icon_path} alt={ach.name} className="w-8 h-8 object-contain" /> : <Trophy className="w-6 h-6 text-[var(--accent)]" />}
                                    </div>
                                    <h4 className="font-bold text-[12px] text-white line-clamp-1 mb-0.5">{ach.name}</h4>
                                    <span className="text-[10px] font-mono font-bold text-[var(--accent)]">+{ach.points} XP</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Trophy className="w-6 h-6" />} title="No achievements unlocked yet" compact />
                    )}
                </SectionCard>

                {/* Custom Lists */}
                <SectionCard title="Custom Lists" icon={<ListChecks className="w-4 h-4 text-sky-400/70" />}>
                    <EmptyState
                        icon={<ListChecks className="w-6 h-6" />}
                        title={isOwnProfile ? "No lists created yet" : "No public lists"}
                        hint={isOwnProfile ? "Curate lists like \"Best RPGs\" or \"Must-Play Co-op\"." : undefined}
                    />
                </SectionCard>

                {/* Gamer DNA */}
                <SectionCard title="Gamer DNA" icon={<Dna className="w-4 h-4 text-pink-400/70" />}>
                    <EmptyState icon={<Dna className="w-6 h-6" />} title="Not enough data yet" hint="Add games to your collection to reveal your taste profile." />
                </SectionCard>
            </div>

            {/* === RIGHT COLUMN === */}
            <div className="space-y-6 min-w-0">
                {/* Reputation & Bounty */}
                <SectionCard title="Reputation & Bounty" icon={<Coins className="w-4 h-4 text-amber-400/70" />}>
                    <EmptyState icon={<Coins className="w-6 h-6" />} title="Reputation insights coming soon" compact />
                </SectionCard>

                {/* Community Ranking */}
                <SectionCard title="Community Ranking" icon={<Medal className="w-4 h-4 text-orange-400/70" />}>
                    <EmptyState icon={<Medal className="w-6 h-6" />} title="Ranking not available yet" compact />
                </SectionCard>

                {/* Platforms & Genres */}
                <SectionCard title="Platforms & Genres" icon={<BarChart3 className="w-4 h-4 text-blue-400/70" />}>
                    <EmptyState icon={<BarChart3 className="w-6 h-6" />} title="No collection data yet" compact />
                </SectionCard>

                {/* Contribution Milestones */}
                <SectionCard title="Contribution Milestones" icon={<Target className="w-4 h-4 text-emerald-400/70" />}>
                    <EmptyState icon={<Target className="w-6 h-6" />} title="Milestones coming soon" compact />
                </SectionCard>

                {/* Loyalty & Customization */}
                <SectionCard title="Loyalty & Customization" icon={<Sparkles className="w-4 h-4 text-fuchsia-400/70" />}>
                    <EmptyState icon={<Sparkles className="w-6 h-6" />} title="Customization unlocks coming soon" compact />
                </SectionCard>
            </div>
        </div>
    );
}
