"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { User, Gamepad2, Trophy, ListChecks, Flame } from "lucide-react";
import toast from "react-hot-toast";
import ProgressionTab from "@/components/profile/ProgressionTab";
import AchievementsTab from "@/components/profile/AchievementsTab";
import { getStorageUrl } from "@/lib/imageUrl";
import RewardsStore from "@/components/profile/RewardsStore";
import { SendMessageModal } from "@/components/messaging/SendMessageModal";
import ProfileHero from "@/components/home-dashboard/ProfileHero";
import SignInWall from "@/components/auth/SignInWall";
import LockedProfile from "@/components/profile/LockedProfile";
import ProfileOverviewDashboard from "@/components/profile/ProfileOverviewDashboard";
import DashboardHome from "@/components/home-dashboard/DashboardHome";
import LibraryTab from "@/components/profile/LibraryTab";
import ListsTab from "@/components/profile/ListsTab";
import GamerDnaPanel from "@/components/profile/GamerDnaPanel";
import WelcomeOnboarding from "@/components/profile/WelcomeOnboarding";
import { PROFILE_TABS, LEGACY_TABS, type ProfileTab } from "@/lib/profileTabs";
import { heroFromProfile } from "@/lib/hero";
import type { FriendStatus, UserProfile } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const VALID_TABS = PROFILE_TABS.map((t) => t.id);

function ProfilePageInner() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user: currentUser, isLoading: authLoading } = useAuth();

    const rawUsername = params.username as string;
    const username = rawUsername === "me" && currentUser ? currentUser.username : rawUsername;
    const shouldFetch = username && username !== "me";

    // Sections move as the profile is reorganised, and links out in the wild
    // keep pointing at where they used to be. LEGACY_TABS forwards them —
    // ?tab=achievements lands on Progression now — so a shared link never
    // opens on a section that no longer exists.
    const rawTabParam = searchParams.get("tab") ?? "";
    const tabParam = (LEGACY_TABS[rawTabParam] ?? rawTabParam) as ProfileTab;
    const wanted: ProfileTab = VALID_TABS.includes(tabParam) ? tabParam : "overview";
    // Owner-only sections are not on a visitor's tab strip, so a link to one
    // has to land somewhere rather than on a page with a strip and nothing
    // under it. Read from the same table the strip filters on: this used to
    // name "rewards" directly, and the day a second section became owner-only
    // the strip hid it while the body still rendered it.
    //
    // Folded, because one side of that comparison is the canonical stored name
    // and the other is whatever casing the address bar was given.
    const viewerIsOwner =
        !!currentUser?.username && currentUser.username.toLowerCase() === username.toLowerCase();
    const ownerOnly = PROFILE_TABS.some((t) => t.id === wanted && t.ownOnly);
    const activeTab: ProfileTab = ownerOnly && !viewerIsOwner ? "overview" : wanted;

    // Optimistic override — the payload's friend_status is the source of truth
    // until the viewer acts on this page.
    const [sentRequest, setSentRequest] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [welcomeOpen, setWelcomeOpen] = useState(false);

    const { data: profile, isLoading } = useSWR<UserProfile>(shouldFetch ? `/users/${username}` : null, fetcher);

    const welcomeForced = searchParams.get("welcome") === "1";

    // Activation wizard: own EMPTY profile (once) or forced via ?welcome=1
    useEffect(() => {
        if (!profile?.user || !currentUser) return;
        if (currentUser.username !== profile.user.username) return;
        let dismissed = false;
        try { dismissed = localStorage.getItem("tp_welcome_dismissed") === "1"; } catch { /* ignore */ }
        if (welcomeForced || ((profile.stats?.games_count ?? 0) === 0 && !dismissed)) {
            setWelcomeOpen(true);
        }
    }, [profile, currentUser, welcomeForced]);

    const setActiveTab = (tab: ProfileTab) => {
        const qs = new URLSearchParams(searchParams.toString());
        if (tab === "overview") qs.delete("tab");
        else qs.set("tab", tab);
        router.replace(`${pathname}${qs.toString() ? `?${qs.toString()}` : ""}`, { scroll: false });
    };

    const handleSendRequest = async () => {
        if (!currentUser) return toast.error("Please login first.");
        setLoadingAction(true);
        try {
            await axios.post("/friends/request", { username });
            setSentRequest(true);
            toast.success("Friend request sent.");
        } catch {
            toast.error("Failed to send request.");
        } finally {
            setLoadingAction(false);
        }
    };

    const hero = useMemo(() => (profile?.user ? heroFromProfile(profile) : null), [profile]);

    // /profile/me with nobody signed in resolved to nothing and sat on the
    // skeleton forever — the one condition in the guard below that never
    // stopped being true. It is a sign-in gate, so it looks like one.
    if (rawUsername === "me" && !authLoading && !currentUser) {
        return (
            <SignInWall
                eyebrow="Members only"
                headline={["Your", "Profile."]}
                blurb="Your collection, your rank, your achievements — all of it lives behind one sign-in."
                perks={[
                    { icon: Gamepad2, text: "Track every game you own, play and finish" },
                    { icon: Trophy, text: "Climb the ranks and unlock achievements" },
                    { icon: ListChecks, text: "Build and share game lists" },
                    { icon: Flame, text: "Keep your daily streak alive" },
                ]}
                icon={User}
                title="Your Profile"
                description="Sign in and this page becomes yours — collection, journal, lists, rewards and all."
            />
        );
    }

    if (isLoading || authLoading || (rawUsername === "me" && !currentUser)) {
        return (
            <div className="min-h-screen">
                <div className="-mt-[86px] md:-mt-[82px] h-[460px] bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-0)] animate-pulse" />
                <div className="container-page -mt-24 space-y-4">
                    <div className="flex items-end gap-6">
                        <div className="w-32 h-32 rounded-full bg-white/5" />
                        <div className="flex-1 space-y-3 pb-2">
                            <div className="h-8 w-48 bg-white/5 rounded" />
                            <div className="h-4 w-32 bg-white/5 rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-5 lg:grid-cols-10 gap-2.5">
                        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-[var(--radius-card)]" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!profile || !profile.user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <User className="w-16 h-16 text-white/35" />
                <h1 className="text-2xl font-bold text-white">User Not Found</h1>
                <Link href="/" className="inline-flex items-center gap-2 h-[42px] px-5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-[var(--radius-card)] transition-colors uppercase tracking-[0.08em] text-[12px]">
                    Go Home
                </Link>
            </div>
        );
    }

    const { user: userData, stats, achievements } = profile;
    const isOwnProfile = currentUser?.username === userData.username;
    const friendStatus: FriendStatus = sentRequest ? "pending" : profile.friend_status ?? "none";

    // Equipped theme overrides the accent color across the whole profile.
    const themeColor = profile.customization?.equipped?.theme?.value;
    const rootStyle = themeColor
        ? ({ ["--accent" as any]: themeColor, ["--accent-hover" as any]: themeColor } as React.CSSProperties)
        : undefined;

    // Friends-only, and this viewer isn't one. The server already withheld the
    // aggregates — this is the doorway it sent instead.
    if (profile.can_view === false) {
        return (
            <div className="min-h-screen bg-[var(--surface-0)]" style={rootStyle}>
                <LockedProfile
                    username={userData.username}
                    displayName={userData.display_name || userData.username}
                    avatarUrl={userData.avatar_url ?? null}
                    coverImage={userData.cover_image ?? null}
                    level={stats?.level ?? 1}
                    rankName={userData.rank?.name ?? null}
                    rankColor={userData.rank?.color ?? null}
                    // The struck insignia, same as the open profile wears.
                    rankIcon={userData.rank?.icon ? getStorageUrl(userData.rank.icon) : null}
                    frame={(userData as { frame?: string | null }).frame ?? null}
                    rankMinXp={userData.rank?.min_xp ?? 0}
                    xp={stats?.xp ?? userData.xp ?? 0}
                    joinedAt={stats?.joined_at ?? null}
                    gamesCount={stats?.games_count ?? 0}
                    hoursPlayed={stats?.hours_played ?? 0}
                    achievementsCount={stats?.achievements_count ?? 0}
                    friendStatus={friendStatus}
                    viewerSignedIn={!!currentUser}
                    busy={loadingAction}
                    onAddFriend={handleSendRequest}
                />
            </div>
        );
    }

    // Your own Overview, which is the closest thing the site has to a
    // logged-in home.
    //
    // This used to say it was "literally the same page, reachable at both /
    // and /profile/{you}". It is not: `/` renders HomeClient for everybody,
    // signed in or not, and neither the page nor the middleware ever checks.
    // Anything meant "for the logged-in homepage" has to land here instead.
    if (isOwnProfile && activeTab === "overview") {
        return (
            <div style={rootStyle}>
                <DashboardHome user={currentUser} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[var(--surface-0)] bg-hud-grid" style={rootStyle}>
            <div className="container-page py-8 space-y-6">
                {/* One identity band for every profile — yours and everyone else's */}
                {hero && (
                    <div className="tp-fade-up tp-d1">
                        <ProfileHero
                            hero={hero}
                            activeTab={activeTab}
                            isOwnProfile={isOwnProfile}
                            friendStatus={friendStatus}
                            friendActionBusy={loadingAction}
                            onAddFriend={handleSendRequest}
                            onMessage={() => setIsMessageModalOpen(true)}
                            viewerSignedIn={!!currentUser}
                            viewerUsername={currentUser?.username}
                        />
                    </div>
                )}

                <div className="tp-fade-up tp-d2">
                    {activeTab === "overview" && (
                        <ProfileOverviewDashboard
                            userData={userData}
                            stats={stats}
                            achievements={achievements || []}
                            isOwnProfile={isOwnProfile}
                            collectionSnapshot={profile.collection_snapshot}
                            playingNow={profile.playing_now}
                            showcase={profile.showcase}
                            standing={profile.standing}
                            recognitions={profile.recognitions}
                            lists={profile.lists}
                            trophyCase={profile.trophy_case}
                            discord={profile.discord}
                            connectedAccounts={profile.connected_accounts}
                            playerCard={profile.player_card}
                            onOpenTab={(t) => setActiveTab(t as ProfileTab)}
                        />
                    )}

                    {activeTab === "library" && (
                        <LibraryTab username={userData.username} isOwnProfile={isOwnProfile} displayName={userData.display_name} />
                    )}

                    {activeTab === "progression" && isOwnProfile && (
                        <ProgressionTab username={userData.username} isOwnProfile={isOwnProfile} />
                    )}

                    {/* Steam used to hang below this in a section of its own,
                        with its own hundred-row panel and no controls. It is a
                        source inside the tab now, sharing the same All /
                        Unlocked / Locked bar the badges use. */}
                    {activeTab === "achievements" && (
                        <AchievementsTab username={userData.username} isOwnProfile={isOwnProfile} />
                    )}

                    {activeTab === "rewards" && isOwnProfile && (
                        <RewardsStore username={userData.username} isOwnProfile={isOwnProfile} />
                    )}

                    {activeTab === "lists" && (
                        <ListsTab username={userData.username} isOwnProfile={isOwnProfile} />
                    )}

                    {activeTab === "stats" && (
                        <div className="space-y-4">
                            {/* Taste match used to lead this tab. It is the one
                                thing here aimed at the reader rather than at
                                the subject, and it now opens the Overview —
                                where a visitor lands — instead of waiting at
                                the bottom of the last tab. Drawing it in both
                                places would be the same panel twice. */}
                            <GamerDnaPanel username={userData.username} />
                        </div>
                    )}
                </div>
            </div>

            <SendMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                recipientUsername={userData.username}
            />

            {welcomeOpen && isOwnProfile && (
                <WelcomeOnboarding
                    username={userData.username}
                    forced={welcomeForced}
                    onClose={() => setWelcomeOpen(false)}
                />
            )}
        </main>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <ProfilePageInner />
        </Suspense>
    );
}
