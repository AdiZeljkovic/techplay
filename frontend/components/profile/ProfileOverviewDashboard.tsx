"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
    Gamepad2, Library, Trophy, Activity as ActivityIcon, ListChecks,
    Dna, Coins, Hexagon, BarChart3, Target, Sparkles, Plus, Flame,
} from "lucide-react";
import SectionCard from "./dashboard/SectionCard";
import EmptyState from "./dashboard/EmptyState";
import PlayingNow from "./dashboard/PlayingNow";
import CollectionSnapshot from "./dashboard/CollectionSnapshot";
import DistributionBars from "./dashboard/DistributionBars";
import GamerDnaPanel from "./dashboard/GamerDnaPanel";
import CommunityRanking from "./dashboard/CommunityRanking";
import ReputationBountyCard from "./dashboard/ReputationBountyCard";
import ContributionMilestones from "./dashboard/ContributionMilestones";
import CustomLists from "./dashboard/CustomLists";
import LoyaltyCustomization from "./dashboard/LoyaltyCustomization";
import HexBadge from "./dashboard/HexBadge";
import ActivityFeed from "./ActivityFeed";
import type { ProfileUser, ProfileStats, Achievement, PlayingNowGame, PlatformsGenres, GamerDna, ReputationData, Recognition, Milestone, GameListPreview, CustomizationData, CollectionSnapshotTile, DistributionStat } from "@/lib/types/profile";

/** Leaders (top half) orange, the tail green — matches the reference bars. */
const rankColor = (_item: DistributionStat, i: number, total: number) =>
    i < Math.ceil(total / 2) ? "var(--accent)" : "#22c55e";

interface Props {
    userData: ProfileUser;
    stats: ProfileStats;
    achievements: Achievement[];
    isOwnProfile: boolean;
    collectionSnapshot?: CollectionSnapshotTile[];
    playingNow?: PlayingNowGame[];
    platformsGenres?: PlatformsGenres;
    gamerDna?: GamerDna;
    reputation?: ReputationData;
    recognitions?: Recognition[];
    milestones?: Milestone[];
    lists?: GameListPreview[];
    customization?: CustomizationData;
    nextRank?: { name: string; min_xp: number } | null;
    onOpenTab?: (tab: string) => void;
}

export default function ProfileOverviewDashboard({ userData, stats, achievements, isOwnProfile, collectionSnapshot = [], playingNow = [], platformsGenres, gamerDna, reputation, recognitions = [], milestones = [], lists = [], customization, nextRank }: Props) {
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
                <SectionCard title="Playing Now" action={playingNow.length > 0 ? { label: `View All (${stats.playing_count ?? playingNow.length})`, href: "?tab=collection" } : undefined}>
                    {playingNow.length > 0 ? (
                        <PlayingNow games={playingNow} />
                    ) : (
                        <EmptyState
                            icon={<Gamepad2 className="w-6 h-6" />}
                            title={isOwnProfile ? "You're not playing anything yet" : "Nothing being played right now"}
                            hint={isOwnProfile ? "Mark games as \"Playing\" to track your progress here." : undefined}
                            cta={addCta}
                        />
                    )}
                </SectionCard>

                {/* Collection Snapshot */}
                <SectionCard title="Your Collection Snapshot" icon={<Library className="w-4 h-4 text-violet-400/70" />} action={{ label: "Manage Collection", href: "?tab=collection" }}>
                    <CollectionSnapshot tiles={collectionSnapshot.length > 0 ? collectionSnapshot : [
                        { status: "backlog", label: "Backlog", color: "#60a5fa", count: stats.backlog_count ?? 0, cover: null },
                        { status: "completed", label: "Completed", color: "#22c55e", count: stats.completed_count ?? 0, cover: null },
                        { status: "wishlist", label: "Wishlist", color: "#f472b6", count: stats.wishlist_count ?? 0, cover: null },
                        { status: "favorites", label: "Favorites", color: "#facc15", count: stats.favorites_count ?? 0, cover: null },
                    ]} />
                </SectionCard>

                {/* Recent Activity */}
                <SectionCard title="Recent Activity" icon={<ActivityIcon className="w-4 h-4 text-[var(--accent)]" />} action={{ label: "View All Activity", href: "?tab=activity" }}>
                    <ActivityFeed username={userData.username} compact />
                </SectionCard>

                {/* Achievement Spotlight */}
                <SectionCard title="Achievement Spotlight" icon={<Trophy className="w-4 h-4 text-yellow-400" />} action={{ label: "View All Achievements", href: "?tab=achievements" }}>
                    {recentUnlocked.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {recentUnlocked.slice(0, 5).map((ach) => (
                                <div key={ach.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col items-center text-center hover:border-white/[0.12] transition-colors">
                                    <div className="w-16 h-16 mb-3 flex items-center justify-center">
                                        {ach.icon_path ? (
                                            <img src={ach.icon_path} alt={ach.name} className="w-16 h-16 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]" />
                                        ) : (
                                            <HexBadge size={56} color="#f59e0b"><Trophy className="w-6 h-6" /></HexBadge>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-[13px] text-white line-clamp-1 mb-1">{ach.name}</h4>
                                    {ach.description && <p className="text-[10px] text-white/45 line-clamp-1 leading-tight mb-1.5">{ach.description}</p>}
                                    {ach.unlocked_at && <span className="text-[10px] text-white/30">{format(new Date(ach.unlocked_at), "MMM d, yyyy")}</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Trophy className="w-6 h-6" />} title="No achievements unlocked yet" compact />
                    )}
                </SectionCard>

                {/* Custom Lists */}
                <SectionCard title="Custom Lists" icon={<ListChecks className="w-4 h-4 text-sky-400/70" />} action={lists.length > 0 ? { label: "View All Lists", href: "?tab=lists" } : undefined}>
                    {lists.length > 0 ? (
                        <CustomLists lists={lists} />
                    ) : (
                        <EmptyState
                            icon={<ListChecks className="w-6 h-6" />}
                            title={isOwnProfile ? "No lists created yet" : "No public lists"}
                            hint={isOwnProfile ? "Curate lists like \"Best RPGs\" or \"Must-Play Co-op\"." : undefined}
                            cta={isOwnProfile ? <a href="?tab=lists" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider transition-colors">Create a List</a> : undefined}
                        />
                    )}
                </SectionCard>

                {/* Gamer DNA */}
                <SectionCard title="Gamer DNA" icon={<Dna className="w-4 h-4 text-pink-400/70" />}>
                    <GamerDnaPanel dna={gamerDna ?? { genres: [], platforms: [], playstyle: [], franchises: [] }} />
                </SectionCard>
            </div>

            {/* === RIGHT COLUMN === */}
            <div className="space-y-6 min-w-0">
                {/* Reputation & Bounty */}
                <SectionCard title="Reputation & Bounty" icon={<Coins className="w-4 h-4 text-amber-400/70" />} action={{ label: "View Details", href: "?tab=stats" }}>
                    {recognitions.length > 0 ? (
                        <ReputationBountyCard recognitions={recognitions} bounty={stats.bounty_balance ?? 0} reputation={reputation} />
                    ) : (
                        <EmptyState icon={<Coins className="w-6 h-6" />} title="Reputation insights coming soon" compact />
                    )}
                </SectionCard>

                {/* Community Ranking */}
                <SectionCard title="Community Ranking" icon={<Hexagon className="w-4 h-4 text-[var(--accent)]" />} action={{ label: "View Leaderboard", href: "?tab=stats" }}>
                    {reputation ? (
                        <CommunityRanking reputation={reputation} />
                    ) : (
                        <EmptyState icon={<Hexagon className="w-6 h-6" />} title="Ranking not available yet" compact />
                    )}
                </SectionCard>

                {/* Platforms & Genres */}
                <SectionCard title="Platforms & Genres" icon={<BarChart3 className="w-4 h-4 text-blue-400/70" />} action={{ label: "View Stats", href: "?tab=stats" }}>
                    {platformsGenres && platformsGenres.total > 0 ? (
                        <div className="space-y-5">
                            {platformsGenres.platforms.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">Platforms</h4>
                                    <DistributionBars items={platformsGenres.platforms} inline colorFn={rankColor} />
                                </div>
                            )}
                            {platformsGenres.genres.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">Top Genres</h4>
                                    <DistributionBars items={platformsGenres.genres} inline colorFn={rankColor} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState icon={<BarChart3 className="w-6 h-6" />} title="No collection data yet" compact />
                    )}
                </SectionCard>

                {/* Contribution Milestones */}
                <SectionCard title="Contribution Milestones" icon={<Flame className="w-4 h-4 text-[var(--accent)]" />}>
                    {milestones.length > 0 ? (
                        <ContributionMilestones milestones={milestones} />
                    ) : (
                        <EmptyState icon={<Target className="w-6 h-6" />} title="Milestones coming soon" compact />
                    )}
                </SectionCard>

                {/* Loyalty & Customization */}
                <SectionCard title="Loyalty & Customization" icon={<Sparkles className="w-4 h-4 text-fuchsia-400/70" />} action={{ label: "View Perks", href: "?tab=rewards" }}>
                    {customization ? (
                        <LoyaltyCustomization
                            data={customization}
                            isOwnProfile={isOwnProfile}
                            username={userData.username}
                            xp={stats.xp ?? 0}
                            nextXp={nextRank?.min_xp ?? null}
                            nextTierName={nextRank?.name ?? null}
                            tierColor={reputation?.tier_color}
                        />
                    ) : (
                        <EmptyState icon={<Sparkles className="w-6 h-6" />} title="Customization unlocks coming soon" compact />
                    )}
                </SectionCard>
            </div>
        </div>
    );
}
