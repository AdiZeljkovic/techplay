"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { HomeMark, FeedMark, GamesMark, ForumMark, ProfileMark } from "./TabMarks";

/**
 * The bottom tab bar — the phone's navigation.
 *
 * Until this existed the only way anywhere on a phone was the hamburger: tap
 * it, wait for a full-screen drawer, find the right accordion, expand it, tap
 * the link. Two to four taps to every destination, all of them started in the
 * top-right corner — the furthest point on the screen from a thumb.
 *
 * Five destinations, which is the ceiling: past that the labels stop fitting
 * at 390px and the targets drop under the 44px floor. Everything else — shop,
 * giveaways, leaderboard, guides, the WoW analyzer — lives behind More in the
 * top bar, which is what a hamburger is actually for.
 *
 * Two things carry the design:
 *
 * The bar is the house red rather than another near-black. It is the one piece
 * of chrome on screen at all times, so it is also the one place the brand can
 * live without competing with anything; every surface above it is a shade of
 * black, and a black bar on a black page is a hairline pretending to be
 * navigation. It is mixed from `--accent`, so a profile theme recolours it
 * along with everything else.
 *
 * You sit in the middle, raised out of the bar with your own portrait in it.
 * Centre is the thumb's easiest reach and the position a bar's most-used
 * destination belongs in; the portrait is what turns a row of glyphs into
 * something that knows who is holding the phone.
 *
 * Phones only (`md`, 768px). A tab bar pinned to the bottom of a 1024px tablet
 * is a phone control on a desk.
 */

interface Tab {
    href: string;
    label: string;
    Mark: (p: { className?: string; active?: boolean }) => React.ReactElement;
    /** Extra paths that should light this tab up. */
    also?: string[];
}

/** Two either side of the portrait. */
const LEFT: Tab[] = [
    { href: "/", label: "Home", Mark: HomeMark },
    { href: "/latest", label: "Feed", Mark: FeedMark, also: ["/news", "/reviews", "/hardware", "/guides"] },
];

const RIGHT: Tab[] = [
    { href: "/games", label: "Games", Mark: GamesMark, also: ["/calendar"] },
    { href: "/forum", label: "Forum", Mark: ForumMark },
];

const PROFILE_PATHS = ["/profile", "/settings", "/friends", "/messages", "/login", "/register"];

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
    const matches = (roots: string[]) =>
        roots.some((r) => (r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(r + "/")));

    const onProfile = matches(PROFILE_PATHS);
    // Signed out, the portrait slot is where you sign in — the honest
    // destination, rather than a profile page that bounces you there anyway.
    const profileHref = user?.username ? `/profile/${user.username}` : "/login";

    const tab = (t: Tab) => {
        const active = matches([t.href, ...(t.also ?? [])]);

        return (
            <li key={t.label} className="flex-1">
                <Link
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className="group relative flex h-[58px] flex-col items-center justify-center gap-[3px] active:bg-black/15 transition-colors"
                >
                    {/* The active rule sits on the bar's top edge rather than
                        under the label, so a tab reads as attached to the edge
                        the way a tab should. */}
                    <span
                        aria-hidden
                        className={`absolute inset-x-4 top-0 h-[2.5px] bg-white transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
                    />
                    <t.Mark
                        active={active}
                        className={`h-[23px] w-[23px] transition-colors ${active ? "text-white" : "text-white/60 group-active:text-white/85"}`}
                    />
                    <span
                        className={`font-display text-[9.5px] font-black uppercase tracking-[0.07em] leading-none transition-colors ${active ? "text-white" : "text-white/60 group-active:text-white/85"}`}
                    >
                        {t.label}
                    </span>
                </Link>
            </li>
        );
    };

    return (
        <nav
            aria-label="Main"
            className="md:hidden fixed inset-x-0 bottom-0 z-[55]"
            style={{
                // Written out rather than as a Tailwind opacity modifier: those
                // do not survive a var() colour, and what they leave behind is
                // no background at all — the first cut of this bar had the
                // article scrolling straight through it.
                background: "linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 74%, #000) 100%)",
                // The home indicator sits over the bottom 34px of a modern
                // phone. Without this the labels are under it.
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                boxShadow: "0 -10px 30px color-mix(in srgb, var(--accent) 22%, transparent)",
                // The knockout inside the games mark is punched in the bar's
                // own colour, so it follows a themed accent.
                ["--tab-ground" as string]: "color-mix(in srgb, var(--accent) 82%, #000)",
            }}
        >
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/25" />

            <ul className="relative flex items-stretch">
                {LEFT.map(tab)}

                {/* ── you ── */}
                <li className="flex-1">
                    <Link
                        href={profileHref}
                        aria-current={onProfile ? "page" : undefined}
                        aria-label={user ? "Your profile" : "Sign in"}
                        className="group relative flex h-[58px] flex-col items-center justify-end gap-[3px] pb-[9px]"
                    >
                        <span
                            className={`absolute -top-[19px] w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center transition-transform duration-200 group-active:scale-95 ${
                                onProfile ? "ring-[3px] ring-white" : "ring-2 ring-white/70"
                            }`}
                            style={{
                                background: "var(--surface-1)",
                                boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
                            }}
                        >
                            {user?.avatar_url ? (
                                <Image
                                    src={user.avatar_url}
                                    alt=""
                                    width={52}
                                    height={52}
                                    className="w-full h-full object-cover"
                                    unoptimized={user.avatar_url.includes("discord") || user.avatar_url.includes("gravatar")}
                                />
                            ) : (
                                <ProfileMark className="h-[26px] w-[26px] text-white/70" />
                            )}
                        </span>

                        <span
                            className={`font-display text-[9.5px] font-black uppercase tracking-[0.07em] leading-none transition-colors ${onProfile ? "text-white" : "text-white/60"}`}
                        >
                            {user ? "You" : "Sign in"}
                        </span>
                    </Link>
                </li>

                {RIGHT.map(tab)}
            </ul>
        </nav>
    );
}
