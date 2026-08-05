"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import {
    Clock, User, ChevronLeft, ChevronRight, Star, Sparkles,
    Layers, Info, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStorageUrl } from "@/lib/imageUrl";

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

const SECTIONS = [
    { id: "all", label: "Everything" },
    { id: "news", label: "News" },
    { id: "reviews", label: "Reviews" },
    { id: "tech", label: "Tech" },
    { id: "guides", label: "Guides" },
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
    const [page, setPage] = useState(1);

    const mine = tab === "you" && Boolean(user);

    const url = useMemo(() => {
        const q = new URLSearchParams({ page: String(page), limit: "24" });
        if (mine) return `/feed/personalized?${q.toString()}`;

        if (section !== "all") q.set("type", section);
        return `/feed/latest?${q.toString()}`;
    }, [mine, section, page]);

    const { data, isLoading } = useSWR<FeedBody>(url, fetcher, { keepPreviousData: true });

    const items = data?.data.items ?? [];
    const meta = data?.data.meta;
    const personalised = data?.data.personalised;
    const interests = data?.data.interests ?? [];

    const switchTab = (next: "latest" | "you") => {
        setTab(next);
        setPage(1);
    };

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <div className="max-w-[1500px] mx-auto px-4 xl:px-6 py-8">
                {/* ── masthead ── */}
                <div className="relative pl-4">
                    <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[3px] rounded bg-[var(--accent)]" />
                    <h1 className="font-display font-black tracking-tight text-[46px] md:text-[58px] leading-[0.86] uppercase">
                        <span className="text-white">The </span>
                        <span className="text-[var(--accent)]">Feed</span>
                    </h1>
                    <p className="mt-3 text-[13.5px] font-medium text-white/70 max-w-[560px]">
                        Everything we publish, in one place — news, reviews, tech and guides as they land.
                    </p>
                </div>

                {/* ── which feed ── */}
                <div className="mt-7 flex flex-wrap items-center gap-2">
                    <Tab active={tab === "latest"} onClick={() => switchTab("latest")} icon={<Layers className="w-3.5 h-3.5" />}>
                        Latest
                    </Tab>
                    <Tab active={tab === "you"} onClick={() => switchTab("you")} icon={<Sparkles className="w-3.5 h-3.5" />}>
                        For you
                    </Tab>

                    {meta && (
                        <span className="ml-auto font-display text-[10.5px] font-bold tabular-nums uppercase tracking-[0.1em] text-white/30">
                            {meta.total.toLocaleString()} pieces
                        </span>
                    )}
                </div>

                {/* ── section filter: only meaningful on the chronological feed ── */}
                {tab === "latest" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {SECTIONS.map((s) => (
                            <Chip
                                key={s.id}
                                active={section === s.id}
                                onClick={() => { setSection(s.id); setPage(1); }}
                            >
                                {s.label}
                            </Chip>
                        ))}
                    </div>
                )}

                {/* ── what the personal feed is and is not ── */}
                {tab === "you" && (
                    <div className="mt-4">
                        {!user ? (
                            <Note>
                                <Link href="/login" className="text-[var(--accent)] font-bold hover:brightness-110">Sign in</Link>
                                {" "}and this becomes your feed — ordered by what you read, save and collect.
                            </Note>
                        ) : personalised === false ? (
                            <Note>
                                We don&apos;t know your taste yet, so this is simply the newest first. Read a few
                                pieces, save what you like, or{" "}
                                <Link href="/games" className="text-[var(--accent)] font-bold hover:brightness-110">
                                    add games to your collection
                                </Link>
                                {" "}and it starts shaping itself.
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

                {/* ── the stream ── */}
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
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {items.map((item) => <Card key={item.id} item={item} />)}
                    </div>
                )}

                {/* ── paging ── */}
                {meta && meta.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <PageButton disabled={page <= 1} onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0 }); }} label="Previous page">
                            <ChevronLeft className="w-4 h-4" />
                        </PageButton>
                        <span className="font-display text-[11px] font-bold tabular-nums uppercase tracking-[0.1em] text-white/35">
                            Page {meta.current_page} of {meta.last_page}
                        </span>
                        <PageButton disabled={page >= meta.last_page} onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0 }); }} label="Next page">
                            <ChevronRight className="w-4 h-4" />
                        </PageButton>
                    </div>
                )}
            </div>
        </main>
    );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function Tab({
    active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`inline-flex items-center gap-2 h-10 px-5 rounded-[10px] font-display text-[11px] font-black uppercase tracking-[0.1em] transition-colors ${
                active ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/50 hover:text-white"
            }`}
        >
            {icon} {children}
        </button>
    );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`h-8 px-3.5 rounded-[8px] font-display text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
                active
                    ? "bg-white/[0.10] text-white"
                    : "bg-white/[0.03] text-white/40 hover:text-white/80"
            }`}
        >
            {children}
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

function PageButton({
    disabled, onClick, label, children,
}: { disabled: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="w-8 h-8 rounded-[7px] bg-white/[0.05] text-white/50 hover:text-white disabled:opacity-25 disabled:hover:text-white/50 flex items-center justify-center transition-colors"
        >
            {children}
        </button>
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={getStorageUrl(item.featured_image_url)}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
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
                        {timeAgo(item.published_at) ?? "—"}
                    </span>
                </span>
            </span>
        </Link>
    );
}
