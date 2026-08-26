"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import axios from "@/lib/axios";
import {
    Menu, X, Search, User, LogOut, ShoppingCart, ChevronDown, Mail, Users, Tag, ArrowRight, Bookmark, Settings, MessagesSquare, Trophy, Gift, Swords, ShieldHalf, Compass, MapPinned, Disc3, ListOrdered, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ScoreBadge from "@/components/ui/ScoreBadge";
import { levelForXp, xpForLevel } from "@/lib/level";
import SearchDropdown from "./SearchDropdown";
import { decodeHtml } from "@/lib/decode";
import NotificationPanel from "./NotificationPanel";
import { mobileBar } from "@/lib/mobileBar";
import { MoreMark } from "./TabMarks";
import MoreSheet from "./MoreSheet";
import { isOwnUpload } from "@/lib/imageUrl";

// Types for Navigation
interface NavSubCategory {
    name: string;
    href: string;
    // Lucide's own prop shape: the menus set strokeWidth so the marks read as
    // line art rather than as heavy glyphs.
    icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    /** Commissioned art, for the panels that still carry a painted tile. */
    art?: string;
    description?: string;
}

interface NavColumn {
    title: string;
    href: string;
    items: NavSubCategory[];
}

interface NavItemType {
    name: string;
    href: string;
    hasDropdown?: boolean;
    children?: NavSubCategory[];
    /** Multi-column mega panel (e.g. DISCOVER). Takes precedence over children. */
    columns?: NavColumn[];
    /** Path prefixes that mark this item active (defaults to [href]). */
    activePaths?: string[];
    viewAllLabel?: string;
}

const DB_GENRES = [
    { label: "Action",       slug: "action" },
    { label: "RPG",          slug: "rpg" },
    { label: "Shooter",      slug: "shooter" },
    { label: "Indie",        slug: "indie" },
    { label: "Adventure",    slug: "adventure" },
    { label: "Strategy",     slug: "strategy" },
    { label: "Puzzle",       slug: "puzzle" },
    { label: "Horror",       slug: "horror" },
    { label: "Racing",       slug: "racing" },
    { label: "Sports",       slug: "sports" },
    { label: "Platformer",   slug: "platformer" },
    { label: "Simulation",   slug: "simulation" },
];

const DB_PLATFORMS = [
    { label: "PC",          slug: "pc" },
    { label: "PlayStation", slug: "playstation" },
    { label: "Xbox",        slug: "xbox" },
    { label: "Nintendo",    slug: "nintendo" },
    { label: "Mobile",      slug: "mobile" },
];

const DB_YEARS = ["2025", "2024", "2023", "2022", "2021", "2020"];

/**
 * The countries that actually hold the studios, in the order the catalogue has
 * them: 4,178 companies in the United States, 2,146 in Japan, 1,557 in the UK,
 * 994 in Germany, 952 in France, 869 in Canada.
 */
const DB_STUDIO_COUNTRIES = [
    { label: "United States", iso: "US" },
    { label: "Japan",         iso: "JP" },
    { label: "United Kingdom", iso: "GB" },
    { label: "Germany",       iso: "DE" },
    { label: "France",        iso: "FR" },
    { label: "Canada",        iso: "CA" },
];

/* ──────────────────────────────────────────────────────────────
   Shared mega-panel language. One chrome recipe, one link
   grammar, one heading — every dropdown in the bar uses these.
   ────────────────────────────────────────────────────────────── */

/**
 * Panel shell: crown hairline, HUD field, depth.
 * `className` positions/sizes the panel; `innerClassName` lays out the
 * content — they must stay separate, since the decorative spans are
 * siblings of the content wrapper and would otherwise become grid items.
 */
function MegaPanel({ className, innerClassName, children }: {
    className?: string;
    innerClassName?: string;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "absolute top-full z-[100] overflow-hidden rounded-b-[var(--radius-panel)]",
                "bg-[var(--surface-2)] border border-t-0 border-[var(--line-strong)]",
                "shadow-[0_28px_70px_rgba(0,0,0,0.7)]",
                className
            )}
        >
            <span aria-hidden className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--accent)] via-[color-mix(in_srgb,var(--accent)_55%,transparent)] to-transparent" />
            <span aria-hidden className="absolute inset-0 bg-hud-grid opacity-40 pointer-events-none" />
            <div className={cn("relative", innerClassName)}>{children}</div>
        </motion.div>
    );
}

/**
 * Column heading. The tick marks a *section*; an icon marks a *category
 * column* — two ranks, so the eye can tell the panel's parts apart.
 */
function MegaHeading({ title, href }: {
    title: string;
    href: string;
}) {
    return (
        <Link href={href} className="group/head flex items-center gap-2 mb-3.5">
            <span aria-hidden className="w-1 h-4 rounded-full bg-[var(--accent)]" />
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)] group-hover/head:text-[var(--accent)] transition-colors duration-150 whitespace-nowrap">
                {title}
            </span>
            <ArrowRight className="w-3 h-3 shrink-0 text-[var(--accent)] opacity-0 -translate-x-1 group-hover/head:opacity-100 group-hover/head:translate-x-0 transition-all duration-300 ease-[var(--ease-hud)]" />
        </Link>
    );
}

/** Link grammar shared with the footer: an accent tick draws itself in. */
function MegaLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            prefetch={false}
            className="group/link flex items-center gap-1.5 py-[5px] text-[13px] font-medium text-[var(--ink-low)] hover:text-[var(--ink-hi)] transition-colors duration-150"
        >
            <span aria-hidden className="w-0 h-px shrink-0 bg-[var(--accent)] group-hover/link:w-2.5 transition-all duration-300 ease-[var(--ease-hud)]" />
            <span className="truncate">{children}</span>
        </Link>
    );
}

interface NavArticle {
    id: number;
    title: string;
    slug: string;
    featured_image_url: string | null;
    published_at_human: string | null;
    reading_time: string | null;
    review_score: number | string | null;
    category: { name: string; slug: string; type: string } | null;
}

/** /news ignores per_page and always paginates 13 — the cap has to happen here. */
const navNewsFetcher = () =>
    axios.get("/news").then((r) => ((r.data?.data ?? []) as NavArticle[]).slice(0, 5));

const articleHref = (a: NavArticle) =>
    a.category?.type === "reviews" ? `/reviews/${a.slug}` : `/news/${a.slug}`;

const navReviewsFetcher = () =>
    axios.get("/reviews").then((r) =>
        ((r.data?.data ?? []) as NavArticle[]).filter((a) => Number(a.review_score) > 0).slice(0, 3)
    );

/**
 * Scored reviews shelf. The column block only fills the top of the panel;
 * rather than leave a void beneath it, the space carries TechPlay's
 * loudest signal — verdicts with artwork.
 */
function NavReviewShelf({ active }: { active: boolean }) {
    const { data } = useSWR(active ? "nav-reviews" : null, navReviewsFetcher, {
        dedupingInterval: 300_000,
        revalidateOnFocus: false });

    if (data && data.length === 0) return null;

    return (
        <div className="mt-auto border-t border-[var(--line)] bg-[var(--fill-1)] p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2">
                    <span aria-hidden className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                        Latest verdicts
                    </span>
                </span>
                <Link href="/reviews" className="group/all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors duration-150">
                    All reviews
                    <ArrowRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform duration-300" />
                </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {!data &&
                    [0, 1, 2].map((i) => (
                        <div key={i} className="h-[148px] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />
                    ))}

                {data?.map((a) => (
                    <Link
                        key={a.id}
                        href={`/reviews/${a.slug}`}
                        prefetch={false}
                        className="group/rev flex flex-col rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-2)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                    >
                        <span className="relative block aspect-[16/9] overflow-hidden bg-[var(--fill-1)]">
                            {a.featured_image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={a.featured_image_url}
                                    alt={decodeHtml(a.title)}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover/rev:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                />
                            )}
                        </span>
                        {/* accent seam draws in on hover — same grammar as the game cards */}
                        <span aria-hidden className="h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover/rev:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]" />
                        <span className="flex-1 flex flex-col gap-2 p-2.5">
                            <span className="block text-[12px] font-semibold text-[var(--ink-mid)] leading-snug line-clamp-2 group-hover/rev:text-[var(--accent)] transition-colors duration-150">
                                {decodeHtml(a.title)}
                            </span>
                            <span className="mt-auto flex justify-end">
                                <ScoreBadge score={Number(a.review_score)} className="scale-90 origin-right" />
                            </span>
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

/**
 * Live editorial rail inside DISCOVER — the menu stops being a list of
 * routes and starts being the reason to click one. Fetches only after the
 * menu has been opened once, so it costs nothing on page load.
 */
function NavFeatured({ active }: { active: boolean }) {
    const { data } = useSWR(active ? "nav-latest" : null, navNewsFetcher, {
        dedupingInterval: 300_000,
        revalidateOnFocus: false });

    const [lead, ...rest] = data ?? [];

    return (
        <div className="flex flex-col h-full border-l border-[var(--line)] bg-[var(--surface-1)] p-5">
            <div className="flex items-center justify-between mb-3.5">
                <span className="flex items-center gap-2">
                    <span aria-hidden className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                        Fresh off the press
                    </span>
                </span>
                <Link href="/news" className="group/all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors duration-150">
                    All
                    <ArrowRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform duration-300" />
                </Link>
            </div>

            {!data && (
                <div className="space-y-3">
                    <div className="aspect-[16/9] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-[52px] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />
                    ))}
                </div>
            )}

            {lead && (
                <Link
                    href={articleHref(lead)}
                    prefetch={false}
                    className="group/lead block rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-2)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                >
                    <span className="relative block aspect-[16/9] overflow-hidden bg-[var(--fill-1)]">
                        {lead.featured_image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={lead.featured_image_url}
                                alt={decodeHtml(lead.title)}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover/lead:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                            />
                        )}
                        <span aria-hidden className="absolute inset-0 scrim-card" />
                        {lead.category?.name && (
                            <span className="absolute top-2 left-2 inline-flex items-center h-5 px-2 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold uppercase tracking-wider">
                                {lead.category.name}
                            </span>
                        )}
                    </span>
                    <span className="block p-3">
                        <span className="block font-display text-[13px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-2 group-hover/lead:text-[var(--accent)] transition-colors duration-300">
                            {decodeHtml(lead.title)}
                        </span>
                        <span className="block mt-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">
                            {[lead.published_at_human, lead.reading_time].filter(Boolean).join(" · ")}
                        </span>
                    </span>
                </Link>
            )}

            {rest.length > 0 && (
                <div className="mt-3 flex flex-col divide-y divide-[var(--line)]">
                    {rest.map((a) => (
                        <Link
                            key={a.id}
                            href={articleHref(a)}
                            prefetch={false}
                            className="group/row flex items-center gap-3 py-2.5 first:pt-0"
                        >
                            <span className="relative w-[56px] h-[38px] shrink-0 rounded-[var(--radius-inner)] overflow-hidden bg-[var(--fill-1)] border border-[var(--line)]">
                                {a.featured_image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={a.featured_image_url}
                                        alt={decodeHtml(a.title)}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover/row:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                    />
                                )}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-semibold text-[var(--ink-mid)] leading-snug line-clamp-2 group-hover/row:text-[var(--accent)] transition-colors duration-150">
                                    {decodeHtml(a.title)}
                                </span>
                                <span className="block mt-0.5 text-[10px] text-[var(--ink-faint)]">
                                    {a.published_at_human}
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

interface CalendarGame {
    id: number | string;
    slug: string;
    name: string;
    cover_url: string | null;
    released: string | null;
    added?: number;
    platforms?: ({ name?: string; platform?: { name?: string } } | null)[];
}

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const platformNames = (g: CalendarGame) =>
    (g.platforms ?? []).map((p) => p?.platform?.name ?? p?.name ?? "").filter(Boolean);

/**
 * The calendar is chronological, but the next fortnight is mostly
 * shovelware — rank a chronological window by how many players track the
 * title, keep the notable ones, then restore date order.
 */
const navCalendarFetcher = () =>
    axios.get("/games/calendar").then((r) => {
        const all = (r.data?.results ?? []) as CalendarGame[];
        return [...all.slice(0, 24)]
            .sort((a, b) => (b.added ?? 0) - (a.added ?? 0))
            .slice(0, 5)
            .sort((a, b) => (a.released ?? "").localeCompare(b.released ?? ""));
    });

/** Date tile — month over day, day in Command Numerals. */
function DateChip({ released }: { released: string | null }) {
    const d = released ? new Date(released) : null;
    const valid = d && !Number.isNaN(d.getTime());
    return (
        <span className="w-[46px] shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)] border border-[var(--line-strong)] overflow-hidden text-center group-hover/rel:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300">
            <span className="block bg-[var(--accent)] text-white text-[8px] font-bold uppercase tracking-[0.1em] leading-none py-[3px]">
                {valid ? MONTHS_SHORT[d!.getMonth()] : "TBA"}
            </span>
            <span className="block font-display text-[15px] font-bold tabular-nums text-[var(--ink-hi)] leading-none py-1.5">
                {valid ? String(d!.getDate()).padStart(2, "0") : "--"}
            </span>
        </span>
    );
}

/** Upcoming releases rail — the calendar, promoted out of the footer. */
function NavReleaseRadar({ active }: { active: boolean }) {
    const { data } = useSWR(active ? "nav-calendar" : null, navCalendarFetcher, {
        dedupingInterval: 300_000,
        revalidateOnFocus: false });

    return (
        <div className="flex flex-col border-l border-[var(--line)] bg-[var(--surface-1)] p-5">
            <div className="flex items-center justify-between mb-3.5">
                <span className="flex items-center gap-2">
                    <span aria-hidden className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                        Release Radar
                    </span>
                </span>
                <Link href="/calendar" className="group/all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors duration-150">
                    Calendar
                    <ArrowRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform duration-300" />
                </Link>
            </div>

            <div className="flex flex-col gap-1.5">
                {!data &&
                    [0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[52px] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />
                    ))}

                {data?.map((g) => {
                    const plats = platformNames(g);
                    return (
                        <Link
                            key={g.id}
                            href={`/games/${g.slug}`}
                            prefetch={false}
                            className="group/rel flex items-center gap-2.5 p-1.5 rounded-[var(--radius-card)] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300"
                        >
                            <DateChip released={g.released} />

                            <span className="relative w-[52px] h-[36px] shrink-0 rounded-[var(--radius-inner)] overflow-hidden bg-[var(--fill-1)] border border-[var(--line)]">
                                {g.cover_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={g.cover_url}
                                        alt={g.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover/rel:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                    />
                                )}
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-semibold text-[var(--ink-mid)] leading-snug line-clamp-2 group-hover/rel:text-[var(--accent)] transition-colors duration-150">
                                    {g.name}
                                </span>
                                {plats.length > 0 && (
                                    <span className="block mt-0.5 text-[10px] uppercase tracking-wider text-[var(--ink-faint)] truncate">
                                        {plats.slice(0, 3).join(" · ")}
                                    </span>
                                )}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// Mega-dropdown for the GAMES nav item (database + calendar)
function GamesNavItem() {
    const pathname = usePathname();
    const isActive = pathname.startsWith("/games") || pathname.startsWith("/calendar");
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => setIsHovered(false), [pathname]);

    return (
        <div className="relative h-full flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <Link href="/games" className={cn(
                "flex items-center gap-1 text-[13px] font-semibold tracking-[0.01em] transition-colors whitespace-nowrap px-2 py-2.5",
                isActive || isHovered ? "text-accent" : "text-[var(--ink-mid)] hover:text-[var(--ink-hi)]"
            )}>
                Games
                <ChevronDown className={cn("w-3 h-3 mt-0.5 opacity-70 transition-transform duration-200", isHovered ? "rotate-180" : "rotate-0")} />
            </Link>

            <AnimatePresence>
                {isHovered && (
                    /* anchored left, not centred: a 900px panel centred on the nav
                       item would run off the left edge of the viewport */
                    <MegaPanel
                        className="left-0 w-[900px] max-w-[calc(100vw-2rem)]"
                        innerClassName="grid grid-cols-[1fr_340px] items-stretch"
                    >
                        <div className="flex flex-col min-w-0">
                            <div className="p-6 grid grid-cols-[1.6fr_1fr] gap-5">
                                {/* Genres */}
                                <div className="min-w-0 pr-5 border-r border-[var(--line)]">
                                    <MegaHeading title="Genres" href="/games" />
                                    <div className="grid grid-cols-2 gap-x-5">
                                        {DB_GENRES.map((g) => (
                                            <MegaLink key={g.slug} href={`/games/genre/${g.slug}`}>{g.label}</MegaLink>
                                        ))}
                                    </div>
                                </div>

                                {/* Platforms + Years */}
                                <div className="min-w-0 flex flex-col gap-5">
                                    <div>
                                        <MegaHeading title="Platforms" href="/games" />
                                        <div className="flex flex-col">
                                            {DB_PLATFORMS.map((p) => (
                                                <MegaLink key={p.slug} href={`/games/platform/${p.slug}`}>{p.label}</MegaLink>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <MegaHeading title="Years" href="/games" />
                                        <div className="grid grid-cols-2 gap-x-3">
                                            {DB_YEARS.map((y) => (
                                                <MegaLink key={y} href={`/games/year/${y}`}>{y}</MegaLink>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer strip */}
                            <div className="mt-auto px-6 py-3 border-t border-[var(--line)] bg-[var(--fill-1)] flex items-center justify-between gap-4">
                                <Link href="/games" className="group/all flex items-center gap-1.5 font-display text-[11px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] uppercase tracking-[0.12em] transition-colors duration-150">
                                    Browse all games
                                    <ArrowRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform duration-300" />
                                </Link>
                                <Link href="/games/tag/open-world" className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150">
                                    <Tag className="w-3 h-3" /> Popular Tags
                                </Link>
                            </div>
                        </div>

                        <NavReleaseRadar active={isHovered} />
                    </MegaPanel>
                )}
            </AnimatePresence>
        </div>
    );
}
// App-style grouped navigation. DISCOVER's column items are populated with
// live categories from GET /navigation/tree (news/reviews/tech keys).
const INITIAL_NAV_ITEMS: NavItemType[] = [
    {
        name: "Discover", href: "/news", hasDropdown: true,
        activePaths: ["/news", "/reviews", "/hardware", "/guides"],
        columns: [
            { title: "News", href: "/news", items: [
                { name: "Gaming",      href: "/news/gaming" },
                { name: "PC",          href: "/news/pc" },
                { name: "Consoles",    href: "/news/consoles" },
                { name: "Industry",    href: "/news/industry" },
                { name: "E-sport",     href: "/news/e-sport" },
                { name: "Interviews",  href: "/news/interviews" },
            ]},
            { title: "Reviews", href: "/reviews", items: [
                { name: "Latest",          href: "/reviews/latest" },
                { name: "Editor's Choice", href: "/reviews/editors-choice" },
                { name: "AAA Titles",      href: "/reviews/aaa-titles" },
                { name: "Indie Gems",      href: "/reviews/indie-gems" },
                { name: "Retro",           href: "/reviews/retro" },
            ]},
            { title: "Hardware", href: "/hardware", items: [
                { name: "Reviews",    href: "/hardware/reviews" },
                { name: "Benchmarks", href: "/hardware/benchmarks" },
                { name: "Guides",     href: "/hardware/guides" },
                { name: "Tech News",  href: "/hardware/news" },
            ]},
            { title: "Guides", href: "/guides", items: [
                { name: "All Guides", href: "/guides" },
            ]},
        ] },
    // Everything the site publishes, in one stream. Lives at /latest because
    // /feed is the RSS feed and a page there would take that URL over.
    { name: "Feed", href: "/latest", activePaths: ["/latest"] },
    // Desktop renders the bespoke GamesNavItem; children below feed the mobile accordion.
    { name: "Games", href: "/games", hasDropdown: true, activePaths: ["/games", "/calendar"], children: [
        { name: "All Games",        href: "/games" },
        { name: "Release Calendar", href: "/calendar" },
        ...DB_GENRES.slice(0, 8).map(g => ({ name: g.label, href: `/games/genre/${g.slug}` })),
        ...DB_PLATFORMS.map(p => ({ name: p.label, href: `/games/platform/${p.slug}` })),
    ]},
    // Its own place in the bar rather than a column inside Games. 56,911
    // studios and 31,970 of them indexable is a section, not a sub-list.
    // No viewAllLabel: the plain dropdown branch does not render one, and
    // "All Studios" is already the first row.
    { name: "Studios", href: "/studios", hasDropdown: true, activePaths: ["/studios"], children: [
        { name: "All Studios", href: "/studios" },
        ...DB_STUDIO_COUNTRIES.map(c => ({ name: c.label, href: `/studios/country/${c.iso.toLowerCase()}` })),
    ]},
    {
        name: "Community", href: "/forum", hasDropdown: true, viewAllLabel: "Open Forum",
        activePaths: ["/forum", "/leaderboard", "/social", "/giveaways", "/frontiers"],
        children: [
            { name: "Forum",       href: "/forum",       icon: MessagesSquare, description: "Discussions and help" },
            { name: "Leaderboard", href: "/leaderboard", icon: Trophy,         description: "Top gamers by XP & reputation" },
            { name: "Social Hub",  href: "/social",      icon: Users,          description: "Chat, friends and squads" },
            { name: "Giveaways",   href: "/giveaways",   icon: Gift,           description: "Win games & gear" },
            { name: "Frontiers",   href: "/frontiers",   icon: Swords,         description: "Clans, territory, resources — coming" },
        ] },
    {
        name: "Tools", href: "/wow-analyzer", hasDropdown: true, viewAllLabel: "All Tools",
        activePaths: ["/wow-analyzer", "/backlog-advisor", "/lists", "/gta6", "/last-disc"],
        children: [
            { name: "WoW Analyzer",    href: "/wow-analyzer",    icon: ShieldHalf, description: "Character readiness check" },
            { name: "Backlog Advisor", href: "/backlog-advisor", icon: Compass,    description: "What should you play next?" },
            // The community directory. It has existed since June and was linked
            // from nowhere — of 54 members, two had ever made a list, and four
            // of the seven lists were empty. A page nobody can reach is a page
            // nobody writes for.
            { name: "Game Lists",      href: "/lists",           icon: ListOrdered, description: "Rankings and tier lists by the community" },
            { name: "GTA 6 Hub",       href: "/gta6",            icon: MapPinned,  description: "Map, characters, vehicles, weapons" },
            { name: "The Last Disc",   href: "/last-disc",       icon: Disc3,      description: "Open letter: keep physical games" },
        ] },
    { name: "Shop", href: "/shop" },
];

/** The wordmark carries the name; nothing needs to be set beside it. */
function BrandLogo() {
    return (
        <Link href="/" className="flex items-center group" aria-label="TechPlay — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/techplay-logo.png"
                alt="TechPlay"
                width={168}
                height={28}
                className="h-[28px] w-auto group-hover:brightness-110 transition-[filter]"
            />
        </Link>
    );
}

// Nav dropdown component — mega menu (vertical) or plain link
function NavItem({ item, badge, onHoverChange }: {
    item: NavItemType;
    badge?: number;
    onHoverChange?: (name: string | null) => void;
}) {
    const pathname = usePathname();
    const isActive = (item.activePaths ?? [item.href]).some((p) => pathname.startsWith(p));
    const [isOpen, setIsOpen] = useState(false);
    const isMegaMenu = !!(item.hasDropdown && (item.children?.[0]?.icon || item.children?.[0]?.art));
    const hasColumns = !!(item.hasDropdown && item.columns?.length);

    useEffect(() => { setIsOpen(false); onHoverChange?.(null); }, [pathname]);

    const handleEnter = () => { setIsOpen(true); onHoverChange?.(item.name); };
    const handleLeave = () => { setIsOpen(false); onHoverChange?.(null); };

    return (
        <div
            className="relative h-full flex items-center"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <Link
                href={item.href}
                prefetch={false}
                className={cn(
                    "relative flex items-center gap-1 text-[13px] font-semibold tracking-[0.01em] transition-colors whitespace-nowrap px-2 py-2.5",
                    isActive || isOpen ? "text-accent" : "text-[var(--ink-mid)] hover:text-[var(--ink-hi)]"
                )}
            >
                {item.name}
                {badge ? (
                    <span className="ml-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                        {badge > 9 ? '9+' : badge}
                    </span>
                ) : null}
                {item.hasDropdown && (
                    <ChevronDown className={cn("w-3 h-3 mt-0.5 opacity-70 transition-transform duration-200", isOpen ? "rotate-180" : "rotate-0")} aria-hidden="true" />
                )}
                {isActive && (
                    <span style={{
                        position: 'absolute', bottom: 0, left: '8px', right: '8px',
                        height: '3px', borderRadius: '2px 2px 0 0',
                        background: 'linear-gradient(90deg, #DC143C, rgba(220, 20, 60,0.6))',
                        boxShadow: '0 0 8px rgba(220, 20, 60,0.6)' }} />
                )}
            </Link>

            <AnimatePresence>
                {hasColumns && isOpen && (
                    /* ── MULTI-COLUMN MEGA PANEL (DISCOVER) ── */
                    <MegaPanel
                        key="columns"
                        className="left-0 w-[1020px] max-w-[calc(100vw-2rem)]"
                        innerClassName="grid grid-cols-[1fr_340px] items-stretch"
                    >
                        <div className="flex flex-col min-w-0">
                            <div className="p-6 grid grid-cols-4">
                                {item.columns!.map((col) => (
                                    <div
                                        key={col.title}
                                        className="min-w-0 px-4 first:pl-0 last:pr-0 border-r border-[var(--line)] last:border-r-0"
                                    >
                                        <MegaHeading title={col.title} href={col.href} />
                                        <div className="flex flex-col">
                                            {col.items.slice(0, 7).map((child, idx) => (
                                                <MegaLink key={idx} href={child.href}>
                                                    {child.name}
                                                </MegaLink>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <NavReviewShelf active={isOpen} />
                        </div>
                        <NavFeatured active={isOpen} />
                    </MegaPanel>
                )}
                {!hasColumns && item.hasDropdown && item.children && item.children.length > 0 && isOpen && (
                    isMegaMenu ? (
                        /* ── ICON MEGA DROPDOWN (COMMUNITY / TOOLS) ── */
                        <MegaPanel key="mega" className="left-0 w-[330px]">
                            <div className="flex flex-col p-2.5 gap-0.5">
                                {item.children.map((child, idx) => {
                                    const Icon = child.icon;
                                    return (
                                        <Link
                                            key={idx}
                                            href={child.href}
                                            className="group/row flex items-center gap-3 p-2.5 rounded-[var(--radius-card)] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300"
                                        >
                                            {child.art ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={child.art} alt="" aria-hidden
                                                    className="w-7 h-7 shrink-0 object-contain select-none transition-transform duration-300 group-hover/row:scale-[1.08]" />
                                            ) : Icon && (
                                                /* The mark IS the icon: line art in the
                                                   accent at a light stroke, no tinted box
                                                   under it. A grey square behind every
                                                   entry makes five different destinations
                                                   look like five of the same thing. */
                                                <span className="w-9 h-9 shrink-0 flex items-center justify-center text-[var(--accent)]">
                                                    <Icon className="w-[26px] h-[26px] transition-transform duration-300 group-hover/row:scale-110" strokeWidth={1.4} />
                                                </span>
                                            )}
                                            <span className="flex flex-col min-w-0 flex-1">
                                                <span className="font-display text-[13px] font-bold text-[var(--ink-hi)] leading-tight">
                                                    {child.name}
                                                </span>
                                                {child.description && (
                                                    <span className="text-[11px] text-[var(--ink-low)] leading-tight mt-0.5">
                                                        {child.description}
                                                    </span>
                                                )}
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[var(--ink-faint)] opacity-0 -translate-x-1 group-hover/row:opacity-100 group-hover/row:translate-x-0 group-hover/row:text-[var(--accent)] transition-all duration-300 ease-[var(--ease-hud)]" />
                                        </Link>
                                    );
                                })}
                            </div>

                            {item.viewAllLabel && (
                                <div className="px-5 py-3 border-t border-[var(--line)] bg-[var(--fill-1)]">
                                    <Link
                                        href={item.href}
                                        prefetch={false}
                                        className="group/all flex items-center gap-1.5 font-display text-[11px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] uppercase tracking-[0.12em] transition-colors duration-150"
                                    >
                                        {item.viewAllLabel}
                                        <ArrowRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform duration-300" />
                                    </Link>
                                </div>
                            )}
                        </MegaPanel>
                    ) : (
                        /* ── REGULAR DROPDOWN ── */
                        <MegaPanel key="dropdown" className="left-0 w-[230px]">
                            <div className="p-2.5 flex flex-col">
                                {item.children.map((child, idx) => (
                                    <MegaLink key={idx} href={child.href}>
                                        {child.name}
                                    </MegaLink>
                                ))}
                            </div>
                        </MegaPanel>
                    )
                )}
            </AnimatePresence>
        </div>
    );
}

interface HeaderUser {
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    xp?: number | null;
}

const MENU_LINKS = [
    { name: "My Profile", href: "/profile/me", icon: User },
    // Not "/lists" — that is the community directory, and until 22 Aug 2026
    // it was a 404 as well. Your own lists are a tab on your own profile.
    { name: "My Lists",   href: "/profile/me?tab=lists", icon: Bookmark },
    { name: "Social Hub", href: "/social",    icon: Users },
    { name: "Settings",   href: "/settings",   icon: Settings },
];

/**
 * Identity cluster: avatar, level and XP progress read as one unit, with
 * account actions behind it. Sign-out lives in the menu rather than as a
 * bare icon in the bar — it was one mis-click away from the profile link.
 */
function UserMenu({ user, logout }: { user: HeaderUser; logout: () => void }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => setOpen(false), [pathname]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const xp = user.xp || 0;
    const level = levelForXp(xp);
    // A level does not cost a flat thousand — the curve steepens with rank, so
    // `xp % 1000` disagreed with the profile's own bar at almost every value.
    const bandFloor = xpForLevel(level);
    const bandCeiling = xpForLevel(level + 1);
    const intoLevel = xp - bandFloor;
    const bandSize = Math.max(1, bandCeiling - bandFloor);
    const percent = Math.min(100, Math.round((intoLevel / bandSize) * 100));
    const name = decodeHtml(user.display_name || user.username || "") || "My Profile";
    const profileHref = `/profile/${user.username || "me"}`;

    const avatar = (size: number) =>
        user.avatar_url ? (
            <Image
                src={user.avatar_url}
                alt={user.username || "Avatar"}
                width={size}
                height={size}
                style={{ width: size, height: size }}
                className="rounded-full object-cover"
                unoptimized={!isOwnUpload(user.avatar_url)}
            />
        ) : (
            <span
                style={{ width: size, height: size }}
                className="rounded-full bg-[var(--fill-3)] flex items-center justify-center text-white"
            >
                <User className="w-4 h-4" />
            </span>
        );

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="group flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full border border-transparent hover:border-[var(--line-strong)] hover:bg-[var(--fill-1)] transition-colors duration-300"
            >
                <span className="relative shrink-0">
                    <span className="block rounded-full ring-2 ring-[var(--line-strong)] group-hover:ring-[color-mix(in_srgb,var(--accent)_55%,transparent)] transition-colors duration-300">
                        {avatar(34)}
                    </span>
                    <span
                        aria-hidden
                        className="absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full bg-[var(--success,#22c55e)] border-2 border-[var(--surface-0)]"
                    />
                </span>

                <span className="flex flex-col items-start gap-1 w-[92px]">
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] tabular-nums text-[var(--ink-hi)] leading-none">
                        Level {level}
                    </span>
                    <span className="w-full h-[3px] rounded-full bg-[var(--track)] overflow-hidden">
                        <span
                            className="block h-full rounded-full bg-[var(--accent)]"
                            style={{ width: `${percent}%` }}
                        />
                    </span>
                </span>

                <ChevronDown
                    className={cn(
                        "w-3.5 h-3.5 shrink-0 text-[var(--ink-faint)] transition-transform duration-300",
                        open ? "rotate-180 text-[var(--accent)]" : ""
                    )}
                    aria-hidden="true"
                />
            </button>

            <AnimatePresence>
                {open && (
                    <MegaPanel className="right-0 w-[260px] rounded-t-[var(--radius-panel)] border-t mt-2">
                        {/* identity header */}
                        <Link
                            href={profileHref}
                            className="group/id flex items-center gap-3 p-4 border-b border-[var(--line)] hover:bg-[var(--fill-1)] transition-colors duration-300"
                        >
                            <span className="shrink-0 rounded-full ring-2 ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]">
                                {avatar(40)}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-display text-[13px] font-bold text-[var(--ink-hi)] truncate group-hover/id:text-[var(--accent)] transition-colors duration-150">
                                    {name}
                                </span>
                                <span className="block text-[11px] tabular-nums text-[var(--ink-low)]">
                                    {intoLevel.toLocaleString()} / 1,000 XP to Level {level + 1}
                                </span>
                            </span>
                        </Link>

                        <div className="p-2 flex flex-col">
                            {MENU_LINKS.map(({ name: label, href, icon: Icon }) => (
                                <Link
                                    key={label}
                                    href={href.startsWith("/profile/me") ? href.replace("/profile/me", profileHref) : href}
                                    className="group/row flex items-center gap-3 px-2.5 py-2 rounded-[var(--radius-inner)] text-[13px] font-medium text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)] transition-colors duration-150"
                                >
                                    <Icon className="w-4 h-4 shrink-0 text-[var(--ink-faint)] group-hover/row:text-[var(--accent)] transition-colors duration-150" />
                                    {label}
                                </Link>
                            ))}
                        </div>

                        <div className="p-2 border-t border-[var(--line)]">
                            <button
                                onClick={() => { setOpen(false); logout(); }}
                                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-[var(--radius-inner)] text-[13px] font-medium text-[var(--ink-low)] hover:text-[#f87171] hover:bg-[color-mix(in_srgb,#ef4444_10%,transparent)] transition-colors duration-150"
                            >
                                <LogOut className="w-4 h-4 shrink-0" />
                                Sign Out
                            </button>
                        </div>
                    </MegaPanel>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Header() {
    const { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen } = useMobileMenu();
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItemType[]>(INITIAL_NAV_ITEMS);
    const [notifications, setNotifications] = useState({ unread_messages: 0, pending_requests: 0, forum_replies: 0, unread_notifications: 0 });
    const refreshNotifCounts = () => {
        if (!user) return;
        axios.get('/user/notifications/counts').then((r) => setNotifications(r.data)).catch(() => {});
    };
    const router = useRouter();
    const bar = mobileBar(pathname);

    /**
     * Back, with somewhere to land.
     *
     * `router.back()` on a page opened cold — a shared link, a search result —
     * walks out of the site entirely. The fallback keeps the reader inside it.
     */
    const goBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(bar.fallback);
    };

    /**
     * The bar gets out of the way when you read down and comes back the moment
     * you reach up — the behaviour every reading app has, and 56px of screen
     * returned on a phone. It moves by transform, so nothing below it reflows.
     */
    const [barHidden, setBarHidden] = useState(false);

    // Anything sticky under the header reads this to stay glued to it. Without
    // it a sticky filter row hangs 56px down the screen the moment the header
    // slides away, with the page scrolling through the gap.
    useEffect(() => {
        const shift = barHidden && !isMobileMenuOpen && !mobileSearchOpen ? "-56px" : "0px";
        document.documentElement.style.setProperty("--header-shift", shift);
    }, [barHidden, isMobileMenuOpen, mobileSearchOpen]);

    useEffect(() => {
        let last = window.scrollY;
        const onScroll = () => {
            if (window.innerWidth >= 768) { setBarHidden(false); return; }
            const y = window.scrollY;
            // Ignore the jitter of a finger resting on the glass.
            if (Math.abs(y - last) < 8) return;
            setBarHidden(y > last && y > 140);
            last = y;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Fetch Categories from Backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('/navigation/tree');
                const tree = res.data; // { news: [], reviews: [], tech: [] }

                // Live categories feed DISCOVER's columns: news/reviews → same-named
                // columns, tech → "Hardware". Static fallbacks stay when a key is absent.
                const columnKeyMap: Record<string, string> = { News: 'news', Reviews: 'reviews', Hardware: 'tech' };

                setNavItems((prevItems) => prevItems.map(item => {
                    if (item.columns) {
                        return {
                            ...item,
                            columns: item.columns.map((col) => {
                                const treeKey = columnKeyMap[col.title];
                                const apiChildren = treeKey ? tree[treeKey] : null;
                                return Array.isArray(apiChildren) && apiChildren.length > 0
                                    ? { ...col, items: apiChildren }
                                    : col;
                            }) };
                    }
                    return item;
                }));
            } catch (error) {
                console.error("Failed to fetch navigation tree:", error);
            }
        };

        fetchCategories();
    }, []);

    // Fetch Notifications (Poll every 30s, pause when tab hidden for battery/performance)
    useEffect(() => {
        if (!user) return;

        let interval: NodeJS.Timeout | null = null;

        const fetchNotifications = async () => {
            try {
                const res = await axios.get('/user/notifications/counts');
                setNotifications(res.data);
            } catch (error) {
                // Silent fail - non-critical
            }
        };

        const startPolling = () => {
            fetchNotifications(); // Immediate fetch
            interval = setInterval(fetchNotifications, 60000);
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        // PERF: Use Page Visibility API to pause polling when tab is hidden
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                startPolling(); // Resume and fetch immediately when tab becomes visible
            }
        };

        // Start polling if tab is visible
        if (!document.hidden) {
            startPolling();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

    // Close mobile menu and search on route change
    useEffect(() => { setIsMobileMenuOpen(false); setMobileSearchOpen(false); }, [pathname]);

    return (
        <div
            className="w-full font-sans fixed top-0 left-0 right-0 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-[var(--ease-hud)]"
            // An open menu or search panel pins the bar down: sliding the
            // thing you just opened off the top of the screen is a bug even
            // when the animation is smooth.
            style={{ transform: barHidden && !isMobileMenuOpen && !mobileSearchOpen ? "translateY(-100%)" : "none" }}
        >
            {/* MAIN HEADER — single app-style bar */}
            <header className="w-full bg-[var(--surface-0)]/95 backdrop-blur-md border-b border-[var(--line)] relative">
                {/* The Crown (S2) — the header's single accent line */}
                <span
                    aria-hidden
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent"
                />
                <div className="container-page h-[56px] md:h-[72px] flex items-center justify-between gap-2">
                    {/* Left: the logo on a tab root, back + where-you-are
                        anywhere else. Only phones get the swap — from md up
                        there is a full nav and the logo is the anchor. */}
                    {bar.mode === "back" ? (
                        <>
                            <div className="md:hidden flex items-center min-w-0 flex-1">
                                <button
                                    onClick={goBack}
                                    aria-label="Back"
                                    className="-ml-2 shrink-0 h-11 w-11 inline-flex items-center justify-center text-white active:bg-[var(--fill-2)] rounded-[var(--radius-card)] transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <span className="min-w-0 truncate font-display text-[14px] font-black uppercase tracking-[0.08em] text-white">
                                    {bar.title}
                                </span>
                            </div>
                            <div className="hidden md:block"><BrandLogo /></div>
                        </>
                    ) : (
                        <BrandLogo />
                    )}

                    {/* Desktop Nav (Center) */}
                    <nav className="hidden xl:flex items-center gap-4 h-full">
                        {navItems.map((item) =>
                            item.name === "Games" ? (
                                <GamesNavItem key="Games" />
                            ) : (
                                <NavItem
                                    key={item.name}
                                    item={item}
                                    badge={item.name === 'Community' && notifications.forum_replies > 0 ? notifications.forum_replies : undefined}
                                />
                            )
                        )}
                    </nav>

                    {/* Actions (Right) */}
                    <div className="flex items-center gap-0.5 xl:gap-3">
                        {/* Inline search (desktop) */}
                        <div className="hidden xl:block w-[260px] 2xl:w-[300px]">
                            <SearchDropdown hotkey placeholder="Search games, news, guides..." />
                        </div>

                        {/* Cart — only when it has items */}
                        {itemCount > 0 && (
                            <Link href="/cart" className="relative p-2 text-[var(--ink-low)] hover:text-white transition-colors" aria-label="Shopping cart">
                                <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {itemCount}
                                </span>
                            </Link>
                        )}

                        {user ? (
                            <div className="hidden xl:flex items-center gap-3">
                                <Link href="/social" className="relative p-2 text-[var(--ink-low)] hover:text-[var(--accent)] hover:bg-[var(--fill-2)] rounded-full transition-colors" title="Messages">
                                    <Mail className="w-5 h-5" />
                                    {notifications.unread_messages > 0 && (
                                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                            {notifications.unread_messages}
                                        </span>
                                    )}
                                </Link>
                                <NotificationPanel
                                    unreadCount={notifications.unread_notifications}
                                    onCountRefresh={refreshNotifCounts}
                                />

                                <span aria-hidden className="w-px h-6 bg-[var(--line-strong)]" />

                                <UserMenu user={user} logout={logout} />
                            </div>
                        ) : (
                            <div className="hidden xl:flex items-center gap-3">
                                <Link
                                    href="/login"
                                    prefetch={false}
                                    className="text-[var(--ink-mid)] hover:text-white font-semibold transition-colors text-[13px] px-2"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    prefetch={false}
                                    className="inline-flex items-center justify-center bg-accent hover:bg-accent-hover text-white px-5 h-10 rounded-[var(--radius-card)] font-bold transition-colors text-[13px] leading-none"
                                >
                                    Join TechPlay
                                </Link>
                            </div>
                        )}

                        {/* Mobile: search, bell, more. Three 44px targets and
                            a logo is what fits at 390px — the bell earns its
                            place because a notification nobody can see is a
                            notification that did not happen. */}
                        <button
                            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                            className="xl:hidden h-11 w-11 inline-flex items-center justify-center text-white/70 active:text-white active:bg-[var(--fill-2)] rounded-[var(--radius-card)] transition-colors"
                            aria-label="Search"
                        >
                            <Search className="w-[22px] h-[22px]" />
                        </button>

                        {user && (
                            <span className="xl:hidden">
                                <NotificationPanel
                                    variant="sheet"
                                    unreadCount={notifications.unread_notifications}
                                    onCountRefresh={refreshNotifCounts}
                                />
                            </span>
                        )}
                        <button
                            className="xl:hidden h-11 w-11 inline-flex items-center justify-center text-white/70 active:text-white active:bg-[var(--fill-3)] rounded-[var(--radius-card)] transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-[22px] h-[22px]" />
                            ) : (
                                <>
                                    {/* Dots below md, where the tab bar is the
                                        navigation and this is the overflow;
                                        a hamburger from md up, where it still
                                        is the navigation. */}
                                    <MoreMark className="md:hidden w-[22px] h-[22px]" />
                                    <Menu className="hidden md:block w-6 h-6" />
                                </>
                            )}
                        </button>

                    </div>
                </div>
            </header>

            {/* MOBILE SEARCH PANEL — outside overflow-hidden so results can flow freely */}
            <AnimatePresence>
                {mobileSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="xl:hidden bg-[var(--surface-0)]/95 backdrop-blur-md border-b border-[var(--line)] w-full"
                        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
                    >
                        <div className="container-page py-3">
                            <SearchDropdown
                                isMobile
                                placeholder="Search TechPlay..."
                                onClose={() => setMobileSearchOpen(false)}
                                autoFocus={true}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MOBILE MENU — the More sheet.
                What used to be here was the site's navigation from before the
                tab bar existed, and it never handed the job over: 31 links
                with every accordion open, 22 of them already one tap away at
                the bottom of the screen. MoreSheet carries what is left. */}
            <MoreSheet
                open={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                user={user}
                onSignOut={logout}
            />

        </div>
    );
}
