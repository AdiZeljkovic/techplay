"use client";

import Link from "next/link";
import CommentsSection from "@/components/comments/CommentsSection";
import SectionCard from "./dashboard/SectionCard";
import PlayingNow from "./dashboard/PlayingNow";
import CollectionSnapshot from "./dashboard/CollectionSnapshot";
import CustomLists from "./dashboard/CustomLists";
import TrophyCase from "./dashboard/TrophyCase";
import RigCard from "./dashboard/RigCard";
import ShowcaseStrip from "./dashboard/ShowcaseStrip";
import GiveRecognitionButton from "@/components/profile/GiveRecognitionButton";
import CommunityStanding from "./dashboard/CommunityStanding";
import ProfileChecklist from "./dashboard/ProfileChecklist";
import DailyHub from "./dashboard/DailyHub";
import PlayerCard from "./PlayerCard";
import TasteMatch from "./TasteMatch";
import type { ProfileUser, ProfileStats, Achievement, PlayingNowGame, StandingData, Recognition, GameListPreview, CollectionSnapshotTile, TrophyCaseItem, PlayerCard as PlayerCardData } from "@/lib/types/profile";

interface Props {
    userData: ProfileUser;
    stats: ProfileStats;
    /** Recent unlocks — the trophy case falls back to these until one is arranged. */
    achievements: Achievement[];
    isOwnProfile: boolean;
    collectionSnapshot?: CollectionSnapshotTile[];
    playingNow?: PlayingNowGame[];
    showcase?: PlayingNowGame[];
    standing?: StandingData;
    recognitions?: Recognition[];
    lists?: GameListPreview[];
    trophyCase?: TrophyCaseItem[];
    discord?: { member: boolean; since: string | null } | null;
    connectedAccounts?: string[];
    /** Hours, span, deepest game, certified achievements. Absent on old payloads. */
    playerCard?: PlayerCardData | null;
    onOpenTab?: (tab: string) => void;
}

/**
 * Overview — the vitrine, not the index.
 *
 * The rule that shapes this page: nothing that has its own tab gets a panel
 * here. It used to carry eleven, and most were a shortened copy of a section —
 * collection counts, achievements, lists, DNA, cosmetics, daily missions. A
 * visitor arrived at a table of contents instead of a reason.
 *
 * What survives is what has no other home: the player card, the taste match,
 * the showcase, the case the owner arranged, the standing, the rig and the
 * wall. Collection and lists stay as bare strips — a glance and a way
 * through, without the frame that made them look like destinations.
 *
 * Recent Activity is gone (24.08.2026). Every line in it — commented on,
 * rated, added a game — points at a page that already exists, so a stranger's
 * profile ended on a list of things they did somewhere else. The wall is the
 * last block now, because it is the one a visitor can write in.
 *
 * Note on `isOwnProfile`: the page returns DashboardHome before it reaches
 * this component when you are looking at your own Overview, so the prop is
 * always false here and every branch guarded on it is unreachable. Left in
 * place rather than torn out, but nothing behind one of those guards ships.
 *
 * Empty-state rules, unchanged:
 *  - Visitors never see an empty card; sections without data don't render.
 */
export default function ProfileOverviewDashboard({
    userData, stats, achievements = [], isOwnProfile,
    collectionSnapshot = [], playingNow = [], showcase = [],
    standing, recognitions = [], lists = [], trophyCase = [], discord,
    connectedAccounts = [], playerCard = null,
    onOpenTab = () => {} }: Props) {
    const nonZeroBuckets = collectionSnapshot.filter((t) => t.count > 0);

    // The payload's five most recent unlocks, in the shape a shelf draws.
    const recentUnlocks: TrophyCaseItem[] = (achievements || [])
        .filter((a) => a.is_unlocked)
        .slice(0, 5)
        .map((a) => ({
            source: "techplay" as const,
            reference: a.id,
            name: a.name,
            description: null,
            icon: a.icon_path ?? null,
            points: a.points ?? null,
            game: null,
            unlocked_at: a.unlocked_at ?? null,
        }));

    /** A strip's heading: what it is, and where the rest of it lives. */
    const StripHead = ({ label, count, href, cta }: { label: string; count?: number; href: string; cta: string }) => (
        <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="flex items-center gap-2.5 font-display text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                <span className="w-1 h-3 rounded-full bg-[var(--accent)]" />
                {label}
                {typeof count === "number" && <span className="font-black tabular-nums text-white/25">{count}</span>}
            </h2>
            <Link href={href} className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 hover:text-[var(--accent)] transition-colors">
                {cta}
            </Link>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* === MAIN COLUMN === */}
            <div className="space-y-6 min-w-0">
                {/* Owner onboarding checklist — shows only while incomplete */}
                {isOwnProfile && (
                    <ProfileChecklist
                        stats={stats}
                        listsCount={lists.length}
                        steamConnected={connectedAccounts.includes("steam")}
                        onOpenTab={onOpenTab}
                    />
                )}

                {/* Who this is, before what they own. Draws nothing on an
                    empty shelf, and nothing on your own page — you know how
                    many hours you have put in. */}
                {!isOwnProfile && playerCard && (
                    <PlayerCard card={playerCard} platforms={connectedAccounts} />
                )}

                {/* The question a visitor actually arrived with, answered where
                    they arrive. It spent its life at the bottom of the last
                    tab — the one place on the profile nobody reaches by
                    accident. Draws nothing for a signed-out reader or on your
                    own page. */}
                {!isOwnProfile && (
                    <TasteMatch username={userData.username} displayName={userData.display_name || userData.username} />
                )}

                {/* Showcase — the visual centrepiece (user pins take priority) */}
                <ShowcaseStrip
                    playingNow={playingNow}
                    snapshot={collectionSnapshot}
                    playingCount={stats.playing_count ?? playingNow.length}
                    showcase={showcase}
                />

                {/* The five the owner chose. Replaces Achievement Spotlight,
                    which showed the five most recent — a sorting, not a choice. */}
                <TrophyCase username={userData.username} isOwnProfile={isOwnProfile} initial={trophyCase} fallback={recentUnlocks} />

                {/* Mobile: Daily Hub after the showcase (the sidebar copy is
                    lg-only; SWR dedupes the requests, so the double mount is cheap) */}
                {isOwnProfile && (
                    <div className="lg:hidden">
                        <DailyHub username={userData.username} onOpenTab={onOpenTab} />
                    </div>
                )}

                {/* Playing Now detail rail — only when playing more than the showcase shows */}
                {playingNow.length > 4 && (
                    <SectionCard title="Also Playing" action={{ label: "View Collection", href: "?tab=library" }}>
                        <PlayingNow games={playingNow.slice(4)} />
                    </SectionCard>
                )}

                {/* Collection — a strip, not a panel. The tab is the destination. */}
                {nonZeroBuckets.length > 0 && (
                    <div>
                        <StripHead label="Collection" count={stats.games_count} href="?tab=library" cta={isOwnProfile ? "Manage" : "View all"} />
                        <CollectionSnapshot tiles={nonZeroBuckets} />
                    </div>
                )}

                {/* Lists — same treatment */}
                {lists.length > 0 && (
                    <div>
                        <StripHead label="Game Lists" count={lists.length} href="?tab=lists" cta="View all" />
                        <CustomLists lists={lists.slice(0, 4)} />
                    </div>
                )}

                {/* The one thing a visitor can actually do, and now the last
                    thing on the page.

                    Recent Activity used to sit below it: "commented on…",
                    "rated…", "added a game" — a log of events that each
                    already have a page of their own, ending a stranger's
                    profile on a list of things they did somewhere else. What
                    a visitor came to read is above; the wall is where they
                    answer. */}
                <SectionCard title="Profile Wall">
                    <CommentsSection commentableId={userData.id} commentableType="profile" />
                </SectionCard>
            </div>

            {/* === SIDEBAR === */}
            <div className="space-y-6 min-w-0">
                {/* Community Standing — the XP rank, where it places, and what the
                    community handed over directly. */}
                {standing && (
                    <SectionCard title="Community Standing" material="instrument">
                        <CommunityStanding standing={standing} recognitions={recognitions} />
                        {!isOwnProfile && <GiveRecognitionButton username={userData.username} />}
                    </SectionCard>
                )}

                {/* Daily Hub — owner's engagement centre (mobile copy is above) */}
                {isOwnProfile && (
                    <div className="hidden lg:block">
                        <DailyHub username={userData.username} onOpenTab={onOpenTab} />
                    </div>
                )}

                {/* Where this player is, on the platforms they proved. */}
                <RigCard connectedAccounts={connectedAccounts} discord={discord} isOwnProfile={isOwnProfile} />
            </div>
        </div>
    );
}
