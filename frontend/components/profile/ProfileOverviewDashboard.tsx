"use client";

import { format } from "date-fns";
import {
    Library, Trophy, Activity as ActivityIcon, ListChecks,
    Dna, Sparkles, CalendarClock,
} from "lucide-react";
import SectionCard from "./dashboard/SectionCard";
import PlayingNow from "./dashboard/PlayingNow";
import CollectionSnapshot from "./dashboard/CollectionSnapshot";
import GamerDnaPanel from "./dashboard/GamerDnaPanel";
import CustomLists from "./dashboard/CustomLists";
import LoyaltyCustomization from "./dashboard/LoyaltyCustomization";
import HexBadge from "./dashboard/HexBadge";
import ActivityFeed from "./ActivityFeed";
import FriendActivityFeed from "./FriendActivityFeed";
import UpcomingReleasesWidget from "./dashboard/UpcomingReleasesWidget";
import ShowcaseStrip from "./dashboard/ShowcaseStrip";
import CommunityStanding from "./dashboard/CommunityStanding";
import ProfileChecklist from "./dashboard/ProfileChecklist";
import DailyHub from "./dashboard/DailyHub";
import type { ProfileUser, ProfileStats, Achievement, PlayingNowGame, PlatformsGenres, GamerDna, ReputationData, Recognition, Milestone, GameListPreview, CustomizationData, CollectionSnapshotTile } from "@/lib/types/profile";

interface Props {
    userData: ProfileUser;
    stats: ProfileStats;
    achievements: Achievement[];
    isOwnProfile: boolean;
    collectionSnapshot?: CollectionSnapshotTile[];
    playingNow?: PlayingNowGame[];
    showcase?: PlayingNowGame[];
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

/**
 * Overview — showcase-first composition.
 *
 * Empty-state rules:
 *  - Visitors NEVER see an empty card: sections without data don't render.
 *  - The owner gets a single "Level up your profile" checklist instead of
 *    a page full of empty cards.
 */
export default function ProfileOverviewDashboard({
    userData, stats, achievements, isOwnProfile,
    collectionSnapshot = [], playingNow = [], showcase = [], platformsGenres, gamerDna,
    reputation, recognitions = [], lists = [], customization, nextRank,
    onOpenTab = () => {},
}: Props) {
    const recentUnlocked = (achievements || [])
        .filter((a) => a.is_unlocked)
        .sort((a, b) => new Date(b.unlocked_at || "").getTime() - new Date(a.unlocked_at || "").getTime())
        .slice(0, 5);

    const nonZeroBuckets = collectionSnapshot.filter((t) => t.count > 0);
    const hasCollection = (stats.games_count ?? 0) > 0;
    const hasDna = !!gamerDna && (gamerDna.genres.length > 0 || gamerDna.playstyle.length > 0 || gamerDna.franchises.length > 0);
    const hasGamertags = !!userData.gamertags && Object.values(userData.gamertags as Record<string, unknown>).some(Boolean);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* === MAIN COLUMN === */}
            <div className="space-y-6 min-w-0">
                {/* Owner onboarding checklist — shows only while incomplete */}
                {isOwnProfile && (
                    <ProfileChecklist
                        stats={stats}
                        listsCount={lists.length}
                        hasGamertags={hasGamertags}
                        onOpenTab={onOpenTab}
                    />
                )}

                {/* Showcase — the visual centerpiece (user pins take priority) */}
                <ShowcaseStrip
                    playingNow={playingNow}
                    snapshot={collectionSnapshot}
                    playingCount={stats.playing_count ?? playingNow.length}
                    showcase={showcase}
                />

                {/* Playing Now detail rail — only when playing more than the showcase shows */}
                {playingNow.length > 4 && (
                    <SectionCard title="Also Playing" action={{ label: "View Collection", href: "?tab=collection" }}>
                        <PlayingNow games={playingNow.slice(4)} />
                    </SectionCard>
                )}

                {/* Collection pulse — non-zero buckets only */}
                {nonZeroBuckets.length > 0 && (
                    <SectionCard title="Collection" icon={<Library className="w-4 h-4 text-[var(--accent)]" />} action={{ label: isOwnProfile ? "Manage" : "View All", href: "?tab=collection" }}>
                        <CollectionSnapshot tiles={nonZeroBuckets} />
                    </SectionCard>
                )}

                {/* Upcoming Releases — own only */}
                {isOwnProfile && (
                    <SectionCard title="Upcoming Releases" icon={<CalendarClock className="w-4 h-4 text-[var(--accent)]" />} action={{ label: "View Calendar", href: "/calendar" }}>
                        <UpcomingReleasesWidget />
                    </SectionCard>
                )}

                {/* Recent Activity */}
                <SectionCard title="Recent Activity" icon={<ActivityIcon className="w-4 h-4 text-[var(--accent)]" />} action={{ label: "View All", href: "?tab=activity" }}>
                    <ActivityFeed username={userData.username} compact />
                </SectionCard>

                {/* Achievement Spotlight — only with unlocks */}
                {recentUnlocked.length > 0 && (
                    <SectionCard title="Achievement Spotlight" icon={<Trophy className="w-4 h-4 text-yellow-400" />} action={{ label: "View All", href: "?tab=achievements" }}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {recentUnlocked.map((ach) => (
                                <div key={ach.id} className="rounded-xl bg-white/[0.03] border border-[var(--border)] p-4 flex flex-col items-center text-center hover:border-white/[0.14] transition-colors">
                                    <div className="w-14 h-14 mb-3 flex items-center justify-center">
                                        {ach.icon_path ? (
                                            <img src={ach.icon_path} alt={ach.name} className="w-14 h-14 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]" />
                                        ) : (
                                            <HexBadge size={52} color="#f59e0b"><Trophy className="w-5 h-5" /></HexBadge>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-[12.5px] text-white line-clamp-1 mb-1">{ach.name}</h4>
                                    {ach.unlocked_at && <span className="text-[10px] text-white/30">{format(new Date(ach.unlocked_at), "MMM d, yyyy")}</span>}
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* Custom Lists — only when there are lists */}
                {lists.length > 0 && (
                    <SectionCard title="Game Lists" icon={<ListChecks className="w-4 h-4 text-[var(--accent)]" />} action={{ label: "View All", href: "?tab=lists" }}>
                        <CustomLists lists={lists} />
                    </SectionCard>
                )}

                {/* Gamer DNA — only with data */}
                {hasDna && (
                    <SectionCard title="Gamer DNA" icon={<Dna className="w-4 h-4 text-[var(--accent)]" />}>
                        <GamerDnaPanel dna={gamerDna!} />
                    </SectionCard>
                )}

                {/* Friend Activity — own only */}
                {isOwnProfile && (
                    <SectionCard title="Friend Activity" icon={<Sparkles className="w-4 h-4 text-[var(--accent)]" />} action={{ label: "All Friends", href: "/friends" }}>
                        <FriendActivityFeed />
                    </SectionCard>
                )}
            </div>

            {/* === SIDEBAR — exactly 3 cards === */}
            <div className="space-y-6 min-w-0">
                {/* 1. Community Standing (merges reputation + ranking + recognitions) */}
                {reputation && (
                    <SectionCard title="Community Standing">
                        <CommunityStanding reputation={reputation} recognitions={recognitions} />
                    </SectionCard>
                )}

                {/* 2. Daily Hub — owner's engagement center */}
                {isOwnProfile && (
                    <DailyHub bounty={stats.bounty_balance ?? 0} onOpenTab={onOpenTab} />
                )}

                {/* 3. Supporter & Cosmetics */}
                {customization && (isOwnProfile || customization.tier || customization.equipped?.theme || customization.equipped?.frame || customization.equipped?.badge) && (
                    <SectionCard title="Supporter & Cosmetics" icon={<Sparkles className="w-4 h-4 text-[var(--accent)]" />}>
                        <LoyaltyCustomization
                            data={customization}
                            isOwnProfile={isOwnProfile}
                            username={userData.username}
                            xp={stats.xp ?? 0}
                            nextXp={nextRank?.min_xp ?? null}
                            nextTierName={nextRank?.name ?? null}
                            tierColor={reputation?.tier_color}
                        />
                    </SectionCard>
                )}
            </div>
        </div>
    );
}
