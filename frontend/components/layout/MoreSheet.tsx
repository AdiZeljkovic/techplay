"use client";

import Link from "next/link";
import {
    BookOpen, Building2, Compass, Cpu, Disc3, Gamepad2, Gift, House, Layers, LogOut,
    MapPinned, MessageSquare, Newspaper, Settings, ShieldHalf, ShoppingCart,
    Sparkles, Swords, Trophy, Users,
} from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import type { User } from "@/types";

/**
 * More — what the tab bar cannot reach, and nothing else.
 *
 * The drawer this replaces was the site's navigation from before there was a
 * tab bar, and it never gave the job up. Counted in the browser with every
 * accordion open: **31 links, 22 of which the tab bar already carries** —
 * Discover repeating the Feed tab, a Games accordion repeating the Games tab,
 * Forum appearing three times over (a quick tile, a Community row, and its own
 * tab), `/login` and `/games` twice each. On top of that an identity card with
 * avatar, level and XP, when the middle of the tab bar is the reader's own
 * portrait and goes to the same place.
 *
 * So this holds four things and no more:
 *
 * 1. **Sections.** Not the Feed tab wearing a second hat: `/latest` is the
 *    mixed stream, while `/reviews`, `/hardware` and `/guides` are their own
 *    pages — and the feed's own chips are client-side filters, so without these
 *    four links those three pages have no entry on a phone at all.
 * 2. **Community**, minus the forum, which has a tab.
 * 3. **Tools**, which have never had anywhere else to live.
 * 4. **Shop**, which is a product area and not small print.
 *
 * Left out on purpose: about, contact, impressum, marketing, privacy, terms,
 * the social accounts. Every one of those is in the site footer, which is
 * visible on the phone — measured, 19 links.
 *
 * The one place the reasoning bends: the tab bar is `md:hidden`, so between
 * 768px and the desktop nav at 1280px there is no tab bar at all, and this
 * sheet is the only navigation there. In that band, and only there, it also
 * shows the four primary destinations. A link that replaces a tab bar is not a
 * duplicate of a tab bar that is not on the screen.
 */

type Row = { name: string; href: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; description: string };

const COMMUNITY: Row[] = [
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy, description: "Top gamers by XP and reputation" },
    { name: "Social Hub", href: "/social", icon: Users, description: "Chat, friends and squads" },
    { name: "Giveaways", href: "/giveaways", icon: Gift, description: "Win games and gear" },
    { name: "Frontiers", href: "/frontiers", icon: Swords, description: "Clans, territory, resources" },
];

const TOOLS: Row[] = [
    { name: "WoW Analyzer", href: "/wow-analyzer", icon: ShieldHalf, description: "Character readiness check" },
    { name: "Backlog Advisor", href: "/backlog-advisor", icon: Compass, description: "What should you play next?" },
    { name: "GTA 6 Hub", href: "/gta6", icon: MapPinned, description: "Map, characters, vehicles, weapons" },
    { name: "The Last Disc", href: "/last-disc", icon: Disc3, description: "Open letter: keep physical games" },
];

const SHOP: Row = { name: "Shop", href: "/shop", icon: ShoppingCart, description: "Merch, keys and gear" };

/** The section pages. `/latest` is the tab; these are the four it mixes. */
const SECTIONS = [
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Reviews", href: "/reviews", icon: Gamepad2 },
    { name: "Tech", href: "/hardware", icon: Cpu },
    { name: "Guides", href: "/guides", icon: BookOpen },
];

/** Shown only where the tab bar is not: 768px up to the desktop nav. */
const PRIMARY = [
    { name: "Home", href: "/", icon: House },
    { name: "Feed", href: "/latest", icon: Layers },
    { name: "Games", href: "/games", icon: Gamepad2 },
    { name: "Studios", href: "/studios", icon: Building2 },
    { name: "Forum", href: "/forum", icon: MessageSquare },
];

const STROKE = 1.4;

function Label({ children }: { children: React.ReactNode }) {
    return (
        <p className="font-display text-[8.5px] font-black uppercase tracking-[0.18em] text-white/45 mb-2">
            {children}
        </p>
    );
}

function Chips({ items, onGo }: { items: { name: string; href: string; icon: Row["icon"] }[]; onGo: () => void }) {
    return (
        // A grid, not a wrap: four chips of unequal width break 3 + 1 and the
        // lone one on the second row reads as something left over.
        <div className="grid grid-cols-2 gap-1.5">
            {items.map((c) => (
                <Link
                    key={c.href}
                    href={c.href}
                    onClick={onGo}
                    className="inline-flex items-center gap-2 h-11 px-3.5 rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.04] font-display text-[10.5px] font-black uppercase tracking-[0.1em] text-white/65 active:text-white active:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
                >
                    <c.icon className="w-[15px] h-[15px] text-[var(--accent)]" strokeWidth={STROKE} />
                    {c.name}
                </Link>
            ))}
        </div>
    );
}

function Rows({ items, onGo }: { items: Row[]; onGo: () => void }) {
    return (
        <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-2)] overflow-hidden divide-y divide-white/[0.05]">
            {items.map((r) => (
                <Link
                    key={r.href}
                    href={r.href}
                    onClick={onGo}
                    // 52px: past the 44pt floor without the row turning into a card.
                    className="flex items-center gap-3.5 min-h-[52px] px-3.5 py-2.5 active:bg-white/[0.04] transition-colors"
                >
                    <r.icon className="w-[22px] h-[22px] shrink-0 text-[var(--accent)]" strokeWidth={STROKE} />
                    <span className="min-w-0">
                        <span className="block font-display text-[12.5px] font-black text-white leading-tight">{r.name}</span>
                        <span className="block mt-0.5 text-[11px] text-white/50 truncate">{r.description}</span>
                    </span>
                </Link>
            ))}
        </div>
    );
}

export default function MoreSheet({
    open, onClose, user, onSignOut,
}: {
    open: boolean;
    onClose: () => void;
    user: User | null;
    onSignOut: () => void;
}) {
    const go = () => onClose();

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title="More"
            maxHeight="82dvh"
            footer={<Footer user={user} onClose={onClose} onSignOut={onSignOut} />}
        >
            <div className="space-y-5 pb-1">
                {/* Only where there is no tab bar to duplicate. */}
                <div className="hidden md:block xl:hidden">
                    <Label>Go to</Label>
                    <Chips items={PRIMARY} onGo={go} />
                </div>

                <div>
                    <Label>Sections</Label>
                    <Chips items={SECTIONS} onGo={go} />
                </div>

                <div>
                    <Label>Community</Label>
                    <Rows items={COMMUNITY} onGo={go} />
                </div>

                <div>
                    <Label>Tools</Label>
                    <Rows items={TOOLS} onGo={go} />
                </div>

                <div>
                    <Label>Shop</Label>
                    <Rows items={[SHOP]} onGo={go} />
                </div>
            </div>
        </Sheet>
    );
}

/**
 * Pinned below the scroll. Signing out has to live somewhere, and hunting for
 * it inside the profile page is not somewhere.
 */
function Footer({
    user, onClose, onSignOut,
}: {
    user: User | null;
    onClose: () => void;
    onSignOut: () => void;
}) {
    if (!user) {
        return (
            <div className="flex gap-2">
                <Link href="/login" rel="nofollow" onClick={onClose}
                    className="btn-command flex-1 flex items-center justify-center h-10 bg-[var(--accent)] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white">
                    Sign in
                </Link>
                <Link href="/register" rel="nofollow" onClick={onClose}
                    className="btn-command btn-command-quiet flex-1 flex items-center justify-center h-10 bg-white/[0.04] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55 active:text-white transition-colors">
                    Register
                </Link>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <Link href="/settings" onClick={onClose}
                className="btn-command btn-command-quiet flex-1 flex items-center justify-center gap-2 h-10 bg-white/[0.04] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55 active:text-white transition-colors">
                <Settings className="w-3.5 h-3.5" strokeWidth={STROKE} /> Settings
            </Link>
            <button onClick={() => { onSignOut(); onClose(); }}
                className="btn-command btn-command-quiet flex-1 flex items-center justify-center gap-2 h-10 bg-white/[0.04] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55 active:text-white transition-colors">
                <LogOut className="w-3.5 h-3.5" strokeWidth={STROKE} /> Sign out
            </button>
        </div>
    );
}
