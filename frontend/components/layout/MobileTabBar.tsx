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
 * The look is built to a mockup of the site's own, and it is a better idea
 * than either of the two bars that came before it. Those were a flat crimson
 * slab and then a crimson slab with a dark plate on it; both spent the brand
 * on the whole bar and then had nowhere left to say "you are here".
 *
 * This one keeps the ground dark, so it belongs to the same near-blacks as
 * every surface above it, and spends the red on three things instead:
 *
 *   the frame      a crimson hairline around the console, with the glow
 *                  pooling at the two ends where it meets the screen edge
 *   the switch     a crimson tile under the icon of the tab you are on,
 *                  under a white cap rule sitting on the console's top edge
 *   the portrait   a crimson ring around you, in the middle
 *
 * Everything is mixed from `--accent`, so a profile theme recolours the frame,
 * the tile and the ring together.
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
                    className={`group relative flex h-[64px] flex-col items-center justify-end gap-[6px] pb-[10px] transition-colors ${
                        active ? "text-white" : "text-white/85 active:text-white"
                    }`}
                >
                    {/* The cap: a short white rule on the console's top edge,
                        over the tab you are on. */}
                    <span
                        aria-hidden
                        className={`absolute top-0 h-[3px] w-[38px] rounded-b-full bg-white transition-opacity duration-200 ${
                            active ? "opacity-100" : "opacity-0"
                        }`}
                    />

                    {/* The tile. Only the icon sits on it, not the label —
                        a tile the height of both reads as a button somebody
                        pressed rather than as the state of a tab. */}
                    <span className="relative flex h-[34px] w-[34px] items-center justify-center">
                        <span
                            aria-hidden
                            className={`absolute inset-0 rounded-[10px] transition-opacity duration-200 ${
                                active ? "opacity-100" : "opacity-0"
                            }`}
                            style={{
                                background: "linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 72%, #000) 100%)",
                                boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 45%, transparent)",
                            }}
                        />
                        <t.Mark active={false} className="relative z-10 h-[22px] w-[22px]" />
                    </span>

                    <span className="font-display text-[9px] font-black uppercase tracking-[0.11em] leading-none">
                        {t.label}
                    </span>
                </Link>
            </li>
        );
    };

    return (
        <nav
            aria-label="Main"
            className="md:hidden fixed inset-x-0 bottom-0 z-[55] rounded-t-[20px] border-t border-x"
            style={{
                // Written out rather than as a Tailwind opacity modifier:
                // those do not survive a var() colour, and what they leave
                // behind is no background at all — the first cut of this bar
                // had the article scrolling straight through it.
                background: "linear-gradient(180deg, color-mix(in srgb, var(--surface-1) 96%, var(--accent)) 0%, var(--surface-0) 100%)",
                borderColor: "color-mix(in srgb, var(--accent) 55%, transparent)",
                // The home indicator sits over the bottom 34px of a modern
                // phone. Without this the labels are under it.
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                // Dark separation downward, a crimson breath upward: the
                // console reads as lit rather than as a panel dropped on the
                // page.
                boxShadow: "0 -10px 26px rgba(0,0,0,0.6), 0 -1px 18px color-mix(in srgb, var(--accent) 26%, transparent)",
            }}
        >
            {/* The glow pools at the two ends, where the console meets the
                edge of the screen, and clears the middle so the portrait is
                read against dark rather than against red. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-t-[20px]"
                style={{
                    background: "linear-gradient(90deg, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 26%, transparent 74%, color-mix(in srgb, var(--accent) 30%, transparent) 100%)",
                }}
            />

            <ul className="relative flex items-stretch">
                {LEFT.map(tab)}

                {/* ── you ── */}
                <li className="flex-1">
                    <Link
                        href={profileHref}
                        aria-current={onProfile ? "page" : undefined}
                        aria-label={user ? "Your profile" : "Sign in"}
                        className={`group relative flex h-[64px] flex-col items-center justify-end pb-[10px] transition-colors ${
                            onProfile ? "text-white" : "text-white/85 active:text-white"
                        }`}
                    >
                        {/* The ring is crimson and reads against the dark
                            console behind it. On the crimson bar this replaced
                            it had to be white, because a red ring on red
                            dissolved — which is the clearest argument for the
                            dark ground this bar now has. */}
                        <span
                            className="absolute -top-[22px] w-[58px] h-[58px] rounded-full flex items-center justify-center transition-transform duration-200 group-active:scale-95"
                            style={{
                                background: "var(--surface-0)",
                                boxShadow: onProfile
                                    ? "0 0 0 2.5px var(--accent), 0 0 20px color-mix(in srgb, var(--accent) 60%, transparent), 0 8px 18px rgba(0,0,0,0.55)"
                                    : "0 0 0 2px color-mix(in srgb, var(--accent) 80%, transparent), 0 8px 18px rgba(0,0,0,0.55)",
                            }}
                        >
                            <span
                                className="w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-center"
                                style={{ background: "var(--surface-2)" }}
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
                                    <ProfileMark className="h-[25px] w-[25px] text-white/75" />
                                )}
                            </span>
                        </span>

                        {/* On the same baseline as the other four labels; the
                            portrait is out of the flow above it. */}
                        <span className="font-display text-[9px] font-black uppercase tracking-[0.11em] leading-none">
                            {user ? "You" : "Sign in"}
                        </span>
                    </Link>
                </li>

                {RIGHT.map(tab)}
            </ul>
        </nav>
    );
}
