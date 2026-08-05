"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import axios from "@/lib/axios";
import {
    Menu, X, Search, User, LogOut, ShoppingCart,
    ChevronDown, Facebook, Twitter, Instagram, Youtube,
    Mail, Users, Sword, Tag, Calendar, Gamepad2,
    Newspaper, Trophy, ArrowRight, Star, Cpu, PlayCircle, Monitor, History,
    MessageSquare, Gem, Rocket, Shield, Bookmark, Settings, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import ScoreBadge from "@/components/ui/ScoreBadge";
import { levelForXp } from "@/lib/level";
import SearchDropdown from "./SearchDropdown";
import { decodeHtml } from "@/lib/decode";
import NotificationPanel from "./NotificationPanel";

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055A19.9 19.9 0 0 0 6.131 21.3a.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
);

// Social Icon Mapping with names for accessibility
const SOCIAL_ICON_MAP: Record<string, { icon: any; name: string }> = {
    twitter_url: { icon: Twitter, name: 'Twitter' },
    facebook_url: { icon: Facebook, name: 'Facebook' },
    instagram_url: { icon: Instagram, name: 'Instagram' },
    youtube_url: { icon: Youtube, name: 'YouTube' },
    discord_url: { icon: DiscordIcon, name: 'Discord' },
};

// Utility Links (Top Bar)
const UTILITY_LINKS = [
    { name: "ABOUT US", href: "/about" },
    { name: "IMPRESSUM", href: "/impressum" },
    { name: "MARKETING", href: "/marketing", highlight: true },
    { name: "CONTACT", href: "/contact" },
    { name: "OUR RATING SYSTEM", href: "/rating-system" },
];

// Types for Navigation
interface NavSubCategory {
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
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
function MegaHeading({ title, href, icon: Icon }: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
}) {
    return (
        <Link href={href} className="group/head flex items-center gap-2 mb-3.5">
            {Icon ? (
                <span className="w-5 h-5 shrink-0 rounded-[6px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] flex items-center justify-center text-[var(--accent)] group-hover/head:bg-[var(--accent)] group-hover/head:text-white group-hover/head:border-transparent transition-colors duration-300">
                    <Icon className="w-3 h-3" />
                </span>
            ) : (
                <span aria-hidden className="w-1 h-4 rounded-full bg-[var(--accent)]" />
            )}
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)] group-hover/head:text-[var(--accent)] transition-colors duration-150 whitespace-nowrap">
                {title}
            </span>
            <ArrowRight className="w-3 h-3 shrink-0 text-[var(--accent)] opacity-0 -translate-x-1 group-hover/head:opacity-100 group-hover/head:translate-x-0 transition-all duration-300 ease-[var(--ease-hud)]" />
        </Link>
    );
}

/** Each Discover column gets its own mark — kills four identical text blocks. */
const COLUMN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "News": Newspaper,
    "Reviews": Star,
    "Hardware": Cpu,
    "Watch & Learn": PlayCircle,
};

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
        revalidateOnFocus: false,
    });

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
        revalidateOnFocus: false,
    });

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
    background_image: string | null;
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
        revalidateOnFocus: false,
    });

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
                                {g.background_image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={g.background_image}
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
                                    <MegaHeading title="Genres" href="/games" icon={Sword} />
                                    <div className="grid grid-cols-2 gap-x-5">
                                        {DB_GENRES.map((g) => (
                                            <MegaLink key={g.slug} href={`/games/genre/${g.slug}`}>{g.label}</MegaLink>
                                        ))}
                                    </div>
                                </div>

                                {/* Platforms + Years */}
                                <div className="min-w-0 flex flex-col gap-5">
                                    <div>
                                        <MegaHeading title="Platforms" href="/games" icon={Monitor} />
                                        <div className="flex flex-col">
                                            {DB_PLATFORMS.map((p) => (
                                                <MegaLink key={p.slug} href={`/games/platform/${p.slug}`}>{p.label}</MegaLink>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <MegaHeading title="Years" href="/games" icon={History} />
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

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Feed:      Layers,
    Discover:  Newspaper,
    Games:     Gamepad2,
    Community: MessageSquare,
    Tools:     Rocket,
    Shop:      ShoppingCart,
};

// App-style grouped navigation. DISCOVER's column items are populated with
// live categories from GET /navigation/tree (news/reviews/tech keys).
const INITIAL_NAV_ITEMS: NavItemType[] = [
    // Everything the site publishes, in one stream. Lives at /latest because
    // /feed is the RSS feed and a page there would take that URL over.
    { name: "Feed", href: "/latest", activePaths: ["/latest"] },
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
        ],
    },
    // Desktop renders the bespoke GamesNavItem; children below feed the mobile accordion.
    { name: "Games", href: "/games", hasDropdown: true, activePaths: ["/games", "/calendar"], children: [
        { name: "All Games",        href: "/games" },
        { name: "Release Calendar", href: "/calendar" },
        ...DB_GENRES.slice(0, 8).map(g => ({ name: g.label, href: `/games/genre/${g.slug}` })),
        ...DB_PLATFORMS.map(p => ({ name: p.label, href: `/games/platform/${p.slug}` })),
    ]},
    {
        name: "Community", href: "/forum", hasDropdown: true, viewAllLabel: "Open Forum",
        activePaths: ["/forum", "/leaderboard", "/clans", "/social", "/giveaways"],
        children: [
            { name: "Forum",       href: "/forum",       icon: MessageSquare, description: "Discussions, help & clan halls" },
            { name: "Leaderboard", href: "/leaderboard", icon: Trophy,        description: "Top gamers by XP & reputation" },
            { name: "Clans",       href: "/clans",       icon: Shield,        description: "Join or create a clan" },
            { name: "Social Hub",  href: "/social",     icon: Users,         description: "Chat, friends and squads" },
            { name: "Giveaways",   href: "/giveaways",   icon: Gem,           description: "Win games & gear" },
        ],
    },
    {
        name: "Tools", href: "/wow-analyzer", hasDropdown: true, viewAllLabel: "All Tools",
        activePaths: ["/wow-analyzer", "/backlog-advisor", "/wrapped"],
        children: [
            { name: "WoW Analyzer",    href: "/wow-analyzer",    icon: Sword,  description: "AI character readiness check" },
            { name: "Backlog Advisor", href: "/backlog-advisor", icon: Rocket, description: "What should you play next?" },
            { name: "Gaming Wrapped",  href: "/wrapped",         icon: Gem,    description: "Your year in gaming, shareable" },
        ],
    },
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
    const isMegaMenu = !!(item.hasDropdown && item.children?.[0]?.icon);
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
                        background: 'linear-gradient(90deg, #FC4100, rgba(252,65,0,0.6))',
                        boxShadow: '0 0 8px rgba(252,65,0,0.6)',
                    }} />
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
                                        <MegaHeading title={col.title} href={col.href} icon={COLUMN_ICONS[col.title]} />
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
                                            {Icon && (
                                                <span className="w-10 h-10 shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-low)] group-hover/row:bg-[var(--accent)] group-hover/row:border-transparent group-hover/row:text-white transition-colors duration-300">
                                                    <Icon className="w-[18px] h-[18px]" />
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
    { name: "My Lists",   href: "/lists",      icon: Bookmark },
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
    const intoLevel = xp % 1000;
    const percent = Math.round((intoLevel / 1000) * 100);
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
                unoptimized={user.avatar_url.includes("discord") || user.avatar_url.includes("gravatar")}
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
                                    href={href === "/profile/me" ? profileHref : href}
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
    const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const { settings } = useSiteSettings();
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItemType[]>(INITIAL_NAV_ITEMS);
    const [notifications, setNotifications] = useState({ unread_messages: 0, pending_requests: 0, forum_replies: 0, unread_notifications: 0 });
    const refreshNotifCounts = () => {
        if (!user) return;
        axios.get('/user/notifications/counts').then((r) => setNotifications(r.data)).catch(() => {});
    };



    // Build dynamic social links from settings
    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter(key => settings[key])
        .map(key => ({
            icon: SOCIAL_ICON_MAP[key].icon,
            name: SOCIAL_ICON_MAP[key].name,
            href: settings[key] || '#'
        }));

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
                            }),
                        };
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
        <div className="w-full font-sans fixed top-0 left-0 right-0 z-50 flex flex-col shadow-2xl">
            {/* MAIN HEADER — single app-style bar */}
            <header className="w-full bg-[var(--surface-0)]/95 backdrop-blur-md border-b border-[var(--line)] relative">
                {/* The Crown (S2) — the header's single accent line */}
                <span
                    aria-hidden
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent"
                />
                <div className="container-page h-[72px] flex items-center justify-between">
                    {/* Logo (Left) */}
                    <BrandLogo />

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
                    <div className="flex items-center gap-3">
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
                                    className="text-[var(--ink-mid)] hover:text-white font-semibold transition-colors text-[13px] px-2"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center bg-accent hover:bg-accent-hover text-white px-5 h-10 rounded-lg font-bold transition-colors text-[13px] leading-none"
                                >
                                    Join TechPlay
                                </Link>
                            </div>
                        )}

                        {/* Mobile: search + hamburger */}
                        <button
                            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                            className="xl:hidden p-2 text-[var(--ink-mid)] hover:text-white transition-colors"
                            aria-label="Search"
                        >
                            <Search className="w-6 h-6" />
                        </button>
                        <button
                            className="xl:hidden p-2 text-[var(--ink-mid)] hover:text-white active:bg-[var(--fill-3)] rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
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
                        <div className="max-w-[1320px] mx-auto px-4 py-3">
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

            {/* MOBILE MENU — right-side drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="xl:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[45]"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            key="drawer"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="xl:hidden fixed inset-0 bg-[var(--surface-1)] z-[60] flex flex-col"
                            style={{ boxShadow: "-20px 0 60px rgba(0,0,0,0.7)" }}
                        >
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-5 h-[60px] border-b border-[var(--line)] shrink-0">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center" aria-label="TechPlay — home">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/techplay-logo.png" alt="TechPlay" width={144} height={24} className="h-[24px] w-auto" />
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-[var(--fill-2)] border border-[var(--line-strong)] flex items-center justify-center text-[var(--ink-low)] hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* User card */}
                            {user && (
                                <div className="px-4 py-3 border-b border-[var(--line)] shrink-0">
                                    <Link href={`/profile/${user.username || 'me'}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 mb-3">
                                        {user.avatar_url ? (
                                            <Image src={user.avatar_url} alt={user.username || ''} width={40} height={40}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-accent/40"
                                                unoptimized={user.avatar_url.includes('discord') || user.avatar_url.includes('gravatar')} />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-accent/15 border-2 border-accent/30 flex items-center justify-center">
                                                <User className="w-5 h-5 text-accent" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-white font-bold text-[14px] leading-tight">{decodeHtml(user.display_name || user.username)}</div>
                                            <div className="text-[11px] text-[var(--ink-low)] mt-0.5">Level {levelForXp(user.xp)} · {user.xp || 0} XP</div>
                                        </div>
                                    </Link>
                                    <div className="flex gap-2">
                                        <Link href="/social" onClick={() => setIsMobileMenuOpen(false)}
                                            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-low)] text-[11px] font-bold uppercase tracking-wide hover:text-white hover:bg-[var(--fill-3)] transition-colors">
                                            <Mail className="w-3.5 h-3.5" /> Messages
                                            {notifications.unread_messages > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{notifications.unread_messages}</span>}
                                        </Link>
                                        <Link href="/social" onClick={() => setIsMobileMenuOpen(false)}
                                            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-low)] text-[11px] font-bold uppercase tracking-wide hover:text-white hover:bg-[var(--fill-3)] transition-colors">
                                            <Users className="w-3.5 h-3.5" /> Friends
                                            {notifications.pending_requests > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{notifications.pending_requests}</span>}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Nav */}
                            <nav className="flex-1 overflow-y-auto py-1">
                                {navItems.map((item) => {
                                    const Icon = NAV_ICONS[item.name];
                                    const hasExpandable = !!(item.hasDropdown && (item.children?.length || item.columns?.length));
                                    return (
                                        <div key={item.name}>
                                            {hasExpandable ? (
                                                <>
                                                    <button
                                                        onClick={() => setExpandedMobileItem(expandedMobileItem === item.name ? null : item.name)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--fill-1)] transition-colors group"
                                                    >
                                                        {Icon && (
                                                            <div className="w-8 h-8 rounded-lg bg-[var(--fill-2)] border border-[var(--line)] flex items-center justify-center shrink-0 group-hover:bg-accent/10 group-hover:border-accent/20 transition-all">
                                                                <Icon className="w-[15px] h-[15px] text-[var(--ink-low)] group-hover:text-accent transition-colors" />
                                                            </div>
                                                        )}
                                                        <span className="flex-1 text-[13px] font-bold uppercase tracking-[0.07em] text-[var(--ink-hi)] group-hover:text-white transition-colors text-left">{item.name}</span>
                                                        <ChevronDown className={cn("w-4 h-4 text-[var(--ink-faint)] transition-transform duration-200 shrink-0", expandedMobileItem === item.name ? "rotate-180 text-accent" : "")} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {expandedMobileItem === item.name && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.18 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="ml-[52px] mr-4 mb-1 pl-3 border-l border-accent/25 flex flex-col gap-0.5">
                                                                    {item.columns ? (
                                                                        /* Multi-column items (DISCOVER) flatten into titled groups */
                                                                        item.columns.map((col) => (
                                                                            <div key={col.title} className="mb-1.5">
                                                                                <Link href={col.href} onClick={() => setIsMobileMenuOpen(false)}
                                                                                    className="block py-2 text-accent text-[11px] font-bold uppercase tracking-widest">
                                                                                    {col.title}
                                                                                </Link>
                                                                                {col.items.slice(0, 6).map((child, idx) => (
                                                                                    <Link key={idx} href={child.href} onClick={() => setIsMobileMenuOpen(false)}
                                                                                        className="block py-1.5 text-[13px] text-[var(--ink-low)] hover:text-white transition-colors">
                                                                                        {child.name}
                                                                                    </Link>
                                                                                ))}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <>
                                                                            <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-accent text-[11px] font-bold uppercase tracking-widest">
                                                                                All {item.name}
                                                                            </Link>
                                                                            {item.children?.map((child, idx) => (
                                                                                <Link key={idx} href={child.href} onClick={() => setIsMobileMenuOpen(false)}
                                                                                    className="py-1.5 text-[13px] text-[var(--ink-low)] hover:text-white transition-colors">
                                                                                    {child.name}
                                                                                </Link>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </>
                                            ) : (
                                                <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--fill-1)] transition-colors group">
                                                    {Icon && (
                                                        <div className="w-8 h-8 rounded-lg bg-[var(--fill-2)] border border-[var(--line)] flex items-center justify-center shrink-0 group-hover:bg-accent/10 group-hover:border-accent/20 transition-all">
                                                            <Icon className="w-[15px] h-[15px] text-[var(--ink-low)] group-hover:text-accent transition-colors" />
                                                        </div>
                                                    )}
                                                    <span className="text-[13px] font-bold uppercase tracking-[0.07em] text-[var(--ink-hi)] group-hover:text-white transition-colors">{item.name}</span>
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Utility links */}
                                <div className="mx-4 mt-2 pt-3 border-t border-[var(--line)] grid grid-cols-2 gap-1">
                                    {UTILITY_LINKS.map((link) => (
                                        <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn("py-2 px-2 text-[11px] font-semibold tracking-wider rounded-lg hover:bg-[var(--fill-2)] transition-colors",
                                                link.highlight ? "text-accent" : "text-[var(--ink-faint)] hover:text-[var(--ink-mid)]")}>
                                            {link.name}
                                        </Link>
                                    ))}
                                </div>
                            </nav>

                            {/* Bottom */}
                            <div className="shrink-0 border-t border-[var(--line)] px-4 py-4 flex flex-col gap-3">
                                {socialLinks.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        {socialLinks.map((social, idx) => (
                                            <Link key={idx} href={social.href} target="_blank" rel="noopener noreferrer"
                                                className="w-8 h-8 rounded-lg bg-[var(--fill-2)] border border-[var(--line-strong)] flex items-center justify-center text-[var(--ink-low)] hover:text-white hover:bg-accent/10 hover:border-accent/30 transition-all">
                                                <social.icon className="w-[14px] h-[14px]" />
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {user ? (
                                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                        className="w-full py-2.5 text-red-400 border border-red-400/20 rounded-xl hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-wide">
                                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                                    </button>
                                ) : (
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full text-center py-3 font-bold text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors text-[12px] uppercase tracking-widest shadow-lg shadow-accent/20">
                                        Sign In / Register
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
