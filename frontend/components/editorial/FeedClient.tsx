"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWRInfinite from "swr/infinite";
import axios from "@/lib/axios";
import { Clock, User, Star, Sparkles, Info, Loader2, Newspaper, Gamepad2, Cpu, BookOpen, Layers, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStorageUrl } from "@/lib/imageUrl";
import PageHero from "@/components/ui/PageHero";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * Everything the site publishes, in one stream — and the same stream reordered
 * around what the reader has shown interest in.
 *
 * "For you" is not a different set of articles. It is the same feed with a
 * different order and a line saying why each piece is where it is, which is
 * the part a reader can actually check.
 */

interface FeedItem {
    id: string;
    kind: "article" | "guide";
    section: "news" | "reviews" | "tech" | "guides";
    slug: string;
    url: string;
    title: string;
    excerpt: string | null;
    featured_image_url: string | null;
    published_at: string | null;
    views: number;
    review_score: number | null;
    category: { name: string; slug: string } | null;
    author: { username: string; name: string; avatar: string | null } | null;
    reason?: string | null;
}

interface FeedBody {
    data: {
        items: FeedItem[];
        meta: { current_page: number; last_page: number; total: number };
        /** Only on the personalised feed: false means we had nothing to go on. */
        personalised?: boolean;
        basis?: { reads: number; bookmarks: number; comments: number; games: number };
        interests?: string[];
    };
}

/** The hero's own row: which feed, not which section. */
const VIEWS = [
    { id: "latest", label: "Latest", icon: Clock },
    { id: "you", label: "For you", icon: Sparkles },
];

const SECTIONS = [
    { id: "all", label: "Everything", icon: Layers },
    { id: "news", label: "News", icon: Newspaper },
    { id: "reviews", label: "Reviews", icon: Gamepad2 },
    { id: "tech", label: "Tech", icon: Cpu },
    { id: "guides", label: "Guides", icon: BookOpen },
] as const;

const SECTION_LABEL: Record<FeedItem["section"], string> = {
    news: "News",
    reviews: "Review",
    tech: "Tech",
    guides: "Guide",
};

const shortDate = (iso?: string | null) =>
    iso ? new Date(iso.replace(" ", "T")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

const timeAgo = (iso?: string | null) => {
    if (!iso) return null;

    const mins = Math.floor((Date.now() - new Date(iso.replace(" ", "T")).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)} h ago`;

    const days = Math.floor(mins / 1440);
    return days < 30 ? `${days} d ago` : shortDate(iso);
};

export default function FeedClient() {
    const { user } = useAuth();

    const [tab, setTab] = useState<"latest" | "you">("latest");
    const [section, setSection] = useState<string>("all");

    const mine = tab === "you" && Boolean(user);

    /**
     * Pages accumulate instead of replacing each other.
     *
     * The feed used to page: 24 pieces, then "Page 1 of 26" and a jump back to
     * the top. A stream of everything the site publishes is not a document with
     * pages, it is something you scroll. getKey returns null once the last page
     * has arrived, and that is what stops SWR asking for more.
     */
    const getKey = useCallback(
        (index: number, previous: FeedBody | null) => {
            if (previous && previous.data.meta.current_page >= previous.data.meta.last_page) {
                return null;
            }

            const q = new URLSearchParams({ page: String(index + 1), limit: "24" });

            if (mine) return `/feed/personalized?${q.toString()}`;

            if (section !== "all") q.set("type", section);

            return `/feed/latest?${q.toString()}`;
        },
        [mine, section],
    );

    const { data, size, setSize, isLoading, isValidating } = useSWRInfinite<FeedBody>(getKey, fetcher, {
        revalidateFirstPage: false,
        keepPreviousData: true,
    });

    const pages = data ?? [];
    const items = pages.flatMap((p) => p.data.items);
    const meta = pages[pages.length - 1]?.data.meta;
    const personalised = pages[0]?.data.personalised;
    const interests = pages[0]?.data.interests ?? [];

    const done = Boolean(meta && meta.current_page >= meta.last_page);
    const loadingMore = isValidating && pages.length > 0 && pages.length < size;

    // The sentinel sits under the grid; when it comes into view the next page
    // is requested. rootMargin starts that a screen early, so the reader never
    // arrives at the bottom and waits.
    const sentinel = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const node = sentinel.current;

        if (!node || done || loadingMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setSize((s) => s + 1); },
            { rootMargin: "600px 0px" },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [done, loadingMore, setSize]);

    const reset = (fn: () => void) => { fn(); setSize(1); };

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* Which feed you are reading is the page's first question, so it
                is asked in the hero rather than under it. PageHero already
                carries a row for exactly this. */}
            <PageHero
                title="The Feed"
                description="Everything we publish, in one place — news, reviews, tech and guides as they land."
                categories={VIEWS}
                categorySize="lg"
                selectedCategory={tab}
                onSelectCategory={(id) => reset(() => setTab(id as "latest" | "you"))}
            />

            <div className="container-page pt-0 pb-6 md:py-8">
                {tab === "latest" && (
                    // Five sections wrapped into three centred rows on a phone
                    // and cost 290px to ask one question. One row that scrolls
                    // costs 60px, stays put while the feed moves under it, and
                    // says "there is more this way" with its cut-off edge.
                    <div className="under-bar -mx-4 px-4 py-2 md:mx-0 md:px-0 md:py-0 bg-[var(--surface-0)] md:bg-transparent">
                        <div className="flex flex-nowrap md:flex-wrap gap-1.5 p-1.5 overflow-x-auto scrollbar-hide snap-x scroll-pl-1.5 rounded-[12px] border border-white/[0.07] bg-[var(--surface-1)]">
                            {SECTIONS.map((s) => (
                                <SwitchTab
                                    key={s.id}
                                    icon={s.icon}
                                    active={section === s.id}
                                    onClick={() => reset(() => setSection(s.id))}
                                >
                                    {s.label}
                                </SwitchTab>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "you" && (
                    <div className="mt-4">
                        {!user ? (
                            <Note>
                                <Link href="/login" className="text-[var(--accent)] font-bold hover:brightness-110">Sign in</Link>
                                {" "}to get a feed built around what you read.
                            </Note>
                        ) : personalised === false ? (
                            <Note>
                                Not enough to go on yet — read a few pieces, save what you like, or{" "}
                                <Link href="/games" className="text-[var(--accent)] font-bold hover:brightness-110">add games</Link>
                                {" "}to your collection, and this becomes yours.
                            </Note>
                        ) : interests.length > 0 ? (
                            <Note>
                                Ordered around{" "}
                                {interests.slice(0, 3).map((tag, i) => (
                                    <span key={tag}>
                                        {i > 0 && ", "}
                                        <span className="text-white font-bold">{tag}</span>
                                    </span>
                                ))}
                                {interests.length > 3 && ` and ${interests.length - 3} more`} — picked up from what you read and collect.
                            </Note>
                        ) : null}
                    </div>
                )}

                {isLoading && items.length === 0 ? (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="h-[310px] rounded-[12px] bg-white/[0.03] animate-pulse" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <p className="mt-10 py-16 text-center text-[12.5px] text-white/35">
                        Nothing published here yet.
                    </p>
                ) : (
                    <>
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {items.map((item, i) => (
                                <Fragment key={`${item.kind}-${item.id}`}>
                                    {/* No ad in the feed.
                                        There used to be one card in twelve from
                                        the third row down, spaced by ratio rather
                                        than count because the feed loads forever.
                                        The unit itself was never the problem: what
                                        Google served into it was a "Discover more"
                                        related-search box, a white panel of text
                                        links among artwork on a near-black grid.
                                        The creative arrives finished in its own
                                        frame and cannot be restyled from here, and
                                        the format is picked per impression, so the
                                        slot could not be trusted to hold something
                                        that belongs. Removed here for the same
                                        reason it was removed from the section
                                        grids. */}
                                    <Card item={item} />
                                </Fragment>
                            ))}
                        </div>

                        {/* The observer drives this. The button is here because a
                            keyboard reader never trips a scroll sentinel. */}
                        <div ref={sentinel} className="mt-8 flex flex-col items-center gap-3">
                            {loadingMore && (
                                <span className="inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/35">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading
                                </span>
                            )}

                            {!done && !loadingMore && (
                                <button
                                    onClick={() => setSize((s) => s + 1)}
                                    className="inline-flex items-center h-10 px-6 rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] font-display text-[11px] font-black uppercase tracking-[0.1em] text-white/70 hover:text-white transition-colors"
                                >
                                    Load more
                                </button>
                            )}

                            {done && meta && (
                                <span className="font-display text-[10.5px] font-bold tabular-nums uppercase tracking-[0.1em] text-white/25">
                                    That is all {meta.total.toLocaleString()} pieces
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function SwitchTab({
    active, onClick, icon: Icon, children,
}: { active: boolean; onClick: () => void; icon: LucideIcon; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            // `flex-1` is what made these wrap into rows: in a scrolling row
            // they size to their words instead, and reach the 44px floor.
            className={`shrink-0 snap-start md:flex-1 md:min-w-[112px] inline-flex items-center justify-center gap-2 h-11 md:h-10 px-4 md:px-3 rounded-[8px] whitespace-nowrap font-display text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-200 ${
                active ? "bg-[var(--accent)] text-white" : "text-white/45 hover:text-white hover:bg-white/[0.05]"
            }`}
        >
            <Icon className="w-3.5 h-3.5" /> {children}
        </button>
    );
}

function Note({ children }: { children: React.ReactNode }) {
    return (
        <p className="flex items-start gap-2.5 rounded-[10px] border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[12.5px] text-white/50 leading-relaxed">
            <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-[1px]" />
            <span>{children}</span>
        </p>
    );
}

function Card({ item }: { item: FeedItem }) {
    return (
        <Link
            href={item.url}
            className="group flex flex-col rounded-[12px] border border-white/[0.07] bg-white/[0.02] overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
        >
            <span className="relative block h-[150px] bg-white/[0.04]">
                {item.featured_image_url && (
                    // A 150px-tall card was downloading the 4K original. `sizes`
                    // is what tells the optimiser which width to actually serve.
                    <Image
                        src={getStorageUrl(item.featured_image_url)}
                        alt={item.title}
                        fill
                        sizes={"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                )}

                {/* The section, always — in a mixed stream a reader needs to know
                    whether they are looking at news or a review before clicking. */}
                <span className="absolute top-2.5 left-2.5 inline-flex items-center h-[20px] px-2 rounded-[5px] bg-[var(--accent)] font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-white">
                    {SECTION_LABEL[item.section]}
                </span>

                {item.review_score !== null && (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 h-[20px] px-2 rounded-[5px] bg-black/75 backdrop-blur-sm font-display text-[10px] font-black tabular-nums text-white">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {item.review_score}
                    </span>
                )}
            </span>

            <span className="flex-1 flex flex-col p-3.5">
                {item.category && (
                    <span className="block mb-1.5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">
                        {item.category.name}
                    </span>
                )}

                <span className="font-display text-[13px] font-black text-white leading-tight line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                    {item.title}
                </span>

                {item.excerpt && (
                    <span className="mt-1.5 text-[11.5px] text-white/40 leading-snug line-clamp-2">
                        {item.excerpt}
                    </span>
                )}

                {item.reason && (
                    <span className="mt-2.5 inline-flex items-center gap-1.5 text-[10.5px] text-[var(--accent)]/90 leading-snug">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="line-clamp-1">{item.reason}</span>
                    </span>
                )}

                <span className="mt-auto pt-3.5 flex items-center justify-between gap-2 text-[10px] text-white/30">
                    {item.author && (
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="font-display font-bold uppercase tracking-[0.06em] truncate">{item.author.name}</span>
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span suppressHydrationWarning>{timeAgo(item.published_at) ?? "—"}</span>
                    </span>
                </span>
            </span>
        </Link>
    );
}
