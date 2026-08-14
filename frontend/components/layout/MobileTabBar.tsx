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
                    className={`group relative flex h-[62px] flex-col items-center justify-end gap-[5px] pb-[9px] transition-colors ${
                        active ? "text-white" : "text-white/[0.74] active:text-white"
                    }`}
                >
                    {/* The switch, thrown. A thin rule and a dimmed row read
                        as four broken tabs and one underlined one; a plate
                        reads as a choice. */}
                    <span
                        aria-hidden
                        className={`tab-plate absolute inset-y-[5px] inset-x-[6px] transition-opacity duration-200 ${
                            active ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                            background: "rgba(4,6,9,0.86)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                        }}
                    />
                    <t.Mark active={active} className="relative z-10 h-[23px] w-[23px]" />
                    <span className="relative z-10 font-display text-[9px] font-black uppercase tracking-[0.11em] leading-none">
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
                //
                // A gradient rather than a flat fill. Flat crimson under a
                // near-black page is a slab; lit at the top and deepened at
                // the bottom it reads as a surface, and white sits on it at a
                // steady weight instead of vibrating.
                background: "linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 66%, #000) 100%)",
                // The home indicator sits over the bottom 34px of a modern
                // phone. Without this the labels are under it.
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                // A shadow that separates the bar from the page, not a red
                // bloom around it — the bloom was the first cut and it made
                // the bar look like it was leaking.
                boxShadow: "0 -8px 22px rgba(0,0,0,0.55)",
                // The knockout inside the games mark is punched in the active
                // plate's colour, not the bar's.
                ["--tab-ground" as string]: "#0b0d12",
            }}
        >
            <span aria-hidden className="absolute inset-x-0 top-0 h-[1.5px] bg-white/40" />

            <ul className="relative flex items-stretch">
                {LEFT.map(tab)}

                {/* ── you ── */}
                <li className="flex-1">
                    <Link
                        href={profileHref}
                        aria-current={onProfile ? "page" : undefined}
                        aria-label={user ? "Your profile" : "Sign in"}
                        className={`group relative flex h-[62px] flex-col items-center justify-end pb-[9px] transition-colors ${
                            onProfile ? "text-white" : "text-white/[0.74] active:text-white"
                        }`}
                    >
                        {/* A cradle, not a floating button. The white ring is
                            opaque and interrupts the bar's top rule, so the
                            portrait reads as seated in the bar rather than
                            stuck on it — a crimson ring was the first try and
                            it dissolved into the bar behind it. */}
                        <span
                            className="absolute -top-[20px] w-[58px] h-[58px] rounded-full flex items-center justify-center transition-transform duration-200 group-active:scale-95"
                            style={{
                                background: onProfile ? "#ffffff" : "rgba(255,255,255,0.9)",
                                boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
                            }}
                        >
                            <span
                                className="w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center"
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
