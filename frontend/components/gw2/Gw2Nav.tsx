"use client";

import Link from "next/link";
import {
    BookMarked,
    BookOpen,
    CalendarClock,
    Compass,
    Database,
    Gem,
    Hammer,
    History,
    House,
    Layers,
    MapPin,
    Shield,
    Sparkles,
    Swords,
    Target,
    Triangle,
    Trophy,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import { timeAgoDetailed } from "@/lib/timeAgo";
import type { Gw2Connection } from "@/lib/gw2";

/**
 * The tool's own menu, down the left of every /gw2 page.
 *
 * Two groups because the tool has two halves, and they behave differently: the
 * account half is `noindex` and needs a key, the reference half is public and
 * needs nothing. A reader who arrived from a search on a recipe page should be
 * able to see which links will ask them to connect before they click one.
 *
 * Only routes that exist — a menu entry that opens on "coming soon" is a
 * promise the menu cannot keep. Achievements and Fractals, which the mockup's
 * menu had from the start, arrived with their pages in phase 6.
 */
export interface Gw2NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

export const GW2_NAV: { label: string; items: Gw2NavItem[] }[] = [
    {
        label: "Your account",
        items: [
            { href: "/gw2", label: "Dashboard", icon: House },
            { href: "/gw2/next", label: "What should I do next?", icon: Compass },
            { href: "/gw2/ascended", label: "Ascended set", icon: Shield },
            { href: "/gw2/planner", label: "Crafting planner", icon: Target },
            { href: "/gw2/masteries", label: "Masteries", icon: Sparkles },
            { href: "/gw2/achievements", label: "Achievements", icon: Trophy },
            { href: "/gw2/fractals", label: "Fractals", icon: Triangle },
            { href: "/gw2/content", label: "Raids & bosses", icon: Swords },
            { href: "/gw2/legendary", label: "Legendary", icon: Gem },
            { href: "/gw2/tonight", label: "Tonight in GW2", icon: CalendarClock },
            { href: "/gw2/story", label: "Story", icon: BookOpen },
            { href: "/gw2/account", label: "Account", icon: UserRound },
        ],
    },
    {
        label: "Reference",
        items: [
            { href: "/gw2/guides", label: "Guides", icon: BookMarked },
            { href: "/gw2/database", label: "Database", icon: Database },
            { href: "/gw2/database/crafting", label: "Crafting recipes", icon: Hammer },
            { href: "/gw2/database/masteries", label: "Mastery tracks", icon: Layers },
            { href: "/gw2/database/insights", label: "Mastery insights", icon: MapPin },
            { href: "/gw2/whats-new", label: "What changed", icon: History },
        ],
    },
];

/**
 * The entry a path belongs to: the longest href it sits under.
 *
 * Longest, because `/gw2/database/insights/73-bloodtide-coast` is under both
 * Database and Mastery insights and only the second is the answer. `/gw2`
 * matches itself alone — as a prefix it would light on every page of the tool.
 */
export function activeEntry(pathname: string): Gw2NavItem | null {
    let best: Gw2NavItem | null = null;

    for (const group of GW2_NAV) {
        for (const item of group.items) {
            const hit =
                item.href === "/gw2"
                    ? pathname === "/gw2"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (hit && (!best || item.href.length > best.href.length)) {
                best = item;
            }
        }
    }

    return best;
}

/**
 * Where the reader stands with the tool, at the top of the menu.
 *
 * The mockup puts "API Connected — your account is linked" in a top bar. There
 * is no top bar here — the site's header stays — so it sits where the eye starts
 * reading the menu. `unknown` is a failed request to our own server, and draws
 * nothing rather than a "not connected" that might be untrue.
 */
export type Gw2ConnectionState =
    | { kind: "loading" }
    | { kind: "signed-out" }
    | { kind: "none" }
    | { kind: "unknown" }
    | { kind: "connected"; connection: Gw2Connection };

export default function Gw2Nav({
    connection,
    active,
    onNavigate,
}: {
    connection: Gw2ConnectionState;
    active: string | null;
    /** The sheet closes on a tap; the desktop menu has nothing to close. */
    onNavigate?: () => void;
}) {
    return (
        <div className="flex flex-col gap-6">
            <ConnectionStatus state={connection} onNavigate={onNavigate} />

            {GW2_NAV.map((group) => (
                <nav key={group.label} aria-label={group.label}>
                    <p className="mb-1.5 px-3 text-[11px] font-medium text-[var(--ink-faint)]">
                        {group.label}
                    </p>
                    <ul className="space-y-0.5">
                        {group.items.map((item) => {
                            const on = item.href === active;
                            const Icon = item.icon;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-current={on ? "page" : undefined}
                                        className="relative flex h-11 items-center gap-3 rounded-[var(--radius-card)] px-3 text-[14px] transition-colors hover:bg-[var(--fill-1)] lg:h-9"
                                        style={
                                            on
                                                ? { background: "var(--fill-2)", color: "var(--ink-hi)" }
                                                : { color: "var(--ink-mid)" }
                                        }
                                    >
                                        {on && (
                                            <span
                                                aria-hidden
                                                className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-[var(--accent)]"
                                            />
                                        )}
                                        <Icon
                                            size={16}
                                            strokeWidth={1.75}
                                            aria-hidden
                                            style={{ color: on ? "var(--ink-hi)" : "var(--ink-faint)" }}
                                        />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            ))}
        </div>
    );
}

function ConnectionStatus({ state, onNavigate }: { state: Gw2ConnectionState; onNavigate?: () => void }) {
    if (state.kind === "unknown") return null;

    if (state.kind === "loading") {
        return <div aria-hidden className="h-[62px] animate-pulse rounded-[var(--radius-card)] bg-[var(--fill-1)]" />;
    }

    const view =
        state.kind === "signed-out"
            ? {
                  href: "/login?redirect=/gw2",
                  dot: "var(--ink-faint)",
                  label: "Not signed in",
                  detail: "Sign in to connect your account",
              }
            : state.kind === "none"
              ? {
                    href: "/gw2",
                    dot: "var(--ink-faint)",
                    label: "No account connected",
                    detail: "Connect your API key",
                }
              : describe(state.connection);

    return (
        <Link
            href={view.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5 transition-colors hover:bg-[var(--fill-1)]"
            style={{ borderColor: "var(--line)", background: "var(--surface-1)" }}
        >
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: view.dot }} />
            <span className="min-w-0">
                <span className="block truncate text-[13px] text-[var(--ink-hi)]">{view.label}</span>
                <span className="block truncate text-[11px] text-[var(--ink-low)]">{view.detail}</span>
            </span>
        </Link>
    );
}

/**
 * A connected account in one line and a dot.
 *
 * Three states the sync itself reports, and only those. "Last read failed" is
 * worth the red: a key that stopped working is the one thing on this menu the
 * reader has to do something about.
 */
function describe(connection: Gw2Connection) {
    const failed = connection.sync_status === "error";
    const reading = connection.sync_status === "pending" || connection.sync_status === "syncing";
    const read = timeAgoDetailed(connection.last_synced_at);

    return {
        href: "/gw2/account",
        dot: failed ? "var(--accent)" : reading ? "var(--warning)" : "var(--success)",
        label: failed ? "Last read failed" : reading ? "Reading your account…" : "API connected",
        detail: [connection.account_name, read ? `read ${read}` : null].filter(Boolean).join(" · ") || "Your account",
    };
}
