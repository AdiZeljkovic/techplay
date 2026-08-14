"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { HomeMark, FeedMark, GamesMark, ForumMark, ProfileMark } from "./TabMarks";

/**
 * The bottom tab bar — the phone's navigation.
 *
 * Until now the only way anywhere on a phone was the hamburger: tap it, wait
 * for a full-screen drawer, find the right accordion, expand it, tap the link.
 * Two to four taps to every destination, all of them started in the top-right
 * corner — the furthest point on the screen from a thumb. This is one tap,
 * always visible, in the half of the screen a thumb actually reaches.
 *
 * Five destinations, which is the ceiling: past that the labels stop fitting
 * at 390px and the targets drop under the 44px floor. Everything else — shop,
 * giveaways, leaderboard, guides, the WoW analyzer — lives behind More in the
 * top bar, which is what a hamburger is actually for.
 *
 * Phones only (`md`, 768px). A tab bar pinned to the bottom of a 1024px
 * tablet is a phone control on a desk.
 */

interface Tab {
    href: string;
    label: string;
    Mark: (p: { className?: string; active?: boolean }) => React.ReactElement;
    /** Extra paths that should light this tab up. */
    also?: string[];
}

const TABS: Tab[] = [
    { href: "/", label: "Home", Mark: HomeMark },
    { href: "/latest", label: "Feed", Mark: FeedMark, also: ["/news", "/reviews", "/hardware", "/guides"] },
    { href: "/games", label: "Games", Mark: GamesMark, also: ["/calendar"] },
    { href: "/forum", label: "Forum", Mark: ForumMark },
    { href: "/profile", label: "Profile", Mark: ProfileMark, also: ["/settings", "/friends", "/messages", "/login", "/register"] },
];

/**
 * Screens the bar has no business covering.
 *
 * Anything with its own bottom-anchored control — a reply box, a checkout
 * button — would fight it for the same 60px, and the reader would lose.
 */
const HIDDEN_ON = [
    "/coming-soon",
    "/forum/create",
    "/shop/checkout",
    "/support/checkout",
    "/cart",
    "/messages",
];

export default function MobileTabBar() {
    const pathname = usePathname() || "/";
    const { user } = useAuth();

    if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

    /** Home matches only itself; everything else owns its subtree. */
    const isActive = (tab: Tab) => {
        const roots = [tab.href, ...(tab.also ?? [])];
        return roots.some((r) => (r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(r + "/")));
    };

    return (
        <nav
            aria-label="Main"
            className="md:hidden fixed inset-x-0 bottom-0 z-[55] border-t border-[var(--line-strong)] backdrop-blur-xl"
            style={{
                // Written out rather than as `bg-[var(--surface-0)]/92`: the
                // opacity modifier does not survive a var() colour, and what
                // it leaves behind is no background at all — the first cut of
                // this bar had the article scrolling straight through it.
                background: "color-mix(in srgb, var(--surface-0) 94%, transparent)",
                // The home indicator on a modern phone sits over the bottom
                // 34px. Without this the labels are under it and the whole bar
                // reads as if it slid off the screen.
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
        >
            <ul className="flex items-stretch">
                {TABS.map((tab) => {
                    const active = isActive(tab);
                    // Signed out, the profile tab is where you sign in — the
                    // honest destination, rather than a profile page that
                    // bounces you to the same place a moment later.
                    const href = tab.href === "/profile"
                        ? (user?.username ? `/profile/${user.username}` : "/login")
                        : tab.href;

                    return (
                        <li key={tab.label} className="flex-1">
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className="group relative flex h-[58px] flex-col items-center justify-center gap-[3px] active:bg-[var(--fill-1)] transition-colors"
                            >
                                {/* The active rule sits on the bar's own top
                                    hairline rather than under the label, so the
                                    tab reads as attached to the edge the way a
                                    tab should. */}
                                <span
                                    aria-hidden
                                    className={`absolute inset-x-3 top-0 h-[2px] transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
                                    style={{ background: "var(--accent)" }}
                                />
                                <tab.Mark
                                    active={active}
                                    className={`h-[23px] w-[23px] transition-colors ${active ? "text-[var(--accent)]" : "text-white/42 group-active:text-white/70"}`}
                                />
                                <span
                                    className={`font-display text-[9.5px] font-black uppercase tracking-[0.07em] leading-none transition-colors ${active ? "text-[var(--accent)]" : "text-white/42 group-active:text-white/70"}`}
                                >
                                    {tab.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
