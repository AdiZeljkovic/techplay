"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import {
    Flame, ArrowRight, Clock, User, ChevronLeft, ChevronRight,
    BookOpenText, Mail, Loader2, Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { getStorageUrl } from "@/lib/imageUrl";
import { SECTIONS, SectionKey } from "./sections";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * News, reviews, tech and guides are one page wearing four labels. One
 * component serves all four so a change lands everywhere at once instead of
 * four times, or twice and then being forgotten.
 *
 * Each section keeps its own list endpoint, because the admin has a separate
 * writing surface per section and those routes are what it feeds. Nothing here
 * changes what an editor publishes or where it appears — only how it looks.
 */

interface Article {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    featured_image_url: string | null;
    published_at: string | null;
    published_at_human?: string | null;
    /** Guides come off the bare model, which orders by created_at and may not have published_at set. */
    created_at?: string | null;
    review_score?: number | null;
    views?: number;
    author?: { display_name?: string | null; username?: string | null } | null;
    category?: { name: string; slug: string } | null;
    difficulty?: string | null;
}

interface Card {
    slug: string;
    title: string;
    excerpt?: string | null;
    featured_image_url?: string | null;
    published_at?: string | null;
    views?: number;
    category?: { name: string; slug: string } | null;
}

interface HubData {
    section: { key: SectionKey; title: string; line: string };
    categories: { slug: string; name: string; count: number }[];
    featured: Card | null;
    trending: { slug: string; title: string }[];
    most_read: Card[];
    upcoming_releases: {
        slug: string; name: string; released: string | null;
        days_away: number; background_image: string | null;
    }[];
    stats: { articles: number; authors: number; this_month: number };
}

/**
 * The list endpoints do not agree on their envelope: news, reviews and tech
 * answer with a resource collection ({ data, meta }), guides with a bare
 * paginator that puts the same numbers at the top level. Read both rather than
 * reshape an endpoint half the site already consumes.
 */
/**
 * Articles come through a resource that has already made their image an
 * absolute URL; guides come straight off the model with a storage-relative
 * path. Everything goes through the resolver, which leaves the former alone.
 */
interface ListBody {
    data?: Article[];
    meta?: { current_page: number; last_page: number; total: number };
    current_page?: number;
    last_page?: number;
    total?: number;
}

const pageInfo = (body?: ListBody) => {
    const meta = body?.meta ?? body;
    if (!meta?.last_page) return null;

    return {
        current: meta.current_page ?? 1,
        last: meta.last_page,
        total: meta.total ?? 0,
    };
};

const shortDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

const timeAgo = (iso?: string | null) => {
    if (!iso) return null;

    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${Math.max(1, mins)} min ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)} h ago`;

    const days = Math.floor(mins / 1440);
    return days < 30 ? `${days} d ago` : shortDate(iso);
};

export default function SectionHub({
    section,
    initialData,
}: {
    section: SectionKey;
    /** The server component already fetched page one; don't make the reader wait for it twice. */
    initialData?: ListBody | null;
}) {
    const config = SECTIONS[section];

    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [email, setEmail] = useState("");
    const [subscribing, setSubscribing] = useState(false);

    const { data: hubBody } = useSWR<{ data: HubData }>(`/newsroom/${config.key}`, fetcher, {
        revalidateOnFocus: false,
    });
    const hub = hubBody?.data;

    const listUrl = useMemo(() => {
        const q = new URLSearchParams({ page: String(page) });
        if (filter !== "all") q.set(config.filterParam, filter);
        return `/${config.key}?${q.toString()}`;
    }, [config.key, config.filterParam, filter, page]);

    const untouched = page === 1 && filter === "all";

    const { data: listBody, isLoading } = useSWR<ListBody>(listUrl, fetcher, {
        keepPreviousData: true,
        fallbackData: untouched && initialData ? initialData : undefined,
    });

    const articles = listBody?.data ?? [];
    const pages = pageInfo(listBody);

    const subscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setSubscribing(true);
        try {
            await axios.post("/newsletter/subscribe", { email: email.trim() });
            toast.success("Check your inbox to confirm.");
            setEmail("");
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "That didn't work. Try again in a moment.");
        } finally {
            setSubscribing(false);
        }
    };

    const [head, ...tail] = (hub?.section.title ?? "").split(" ");

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── the ticker: what has landed lately ── */}
            {hub?.trending.length ? (
                <div className="border-b border-white/[0.07] bg-white/[0.02]">
                    <div className="max-w-[1500px] mx-auto px-4 xl:px-6 h-11 flex items-center gap-4 overflow-x-auto scrollbar-none">
                        <span className="shrink-0 inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-[6px] bg-[var(--accent)] font-display text-[9px] font-black uppercase tracking-[0.12em] text-white">
                            <Flame className="w-3 h-3" /> Just in
                        </span>
                        {hub.trending.map((t, i) => (
                            <span key={t.slug} className="shrink-0 flex items-center gap-4">
                                {i > 0 && <span aria-hidden className="w-1 h-1 rounded-full bg-[var(--accent)]/60" />}
                                <Link
                                    href={`${config.path}/${t.slug}`}
                                    className="text-[12px] text-white/55 hover:text-white whitespace-nowrap transition-colors"
                                >
                                    {t.title}
                                </Link>
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="max-w-[1500px] mx-auto px-4 xl:px-6 py-8 grid grid-cols-1 xl:grid-cols-[1fr_324px] gap-6 items-start">
                <div className="min-w-0">
                    {/* ── masthead + lead story ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-6 items-start">
                        <div className="relative pl-4">
                            <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[3px] rounded bg-[var(--accent)]" />
                            <h1 className="font-display font-black tracking-tight text-[46px] md:text-[58px] leading-[0.86] uppercase">
                                <span className="block text-white">{head}</span>
                                {tail.length > 0 && <span className="block text-[var(--accent)]">{tail.join(" ")}</span>}
                            </h1>
                            {hub && <p className="mt-4 text-[13.5px] font-medium text-white/70">{hub.section.line}</p>}

                            {/* What the section can honestly say about itself. The
                                mockup offered "50+ experts"; there are six people
                                writing here, so it says six. */}
                            {hub && (
                                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/35">
                                    <span className="inline-flex items-center gap-1.5">
                                        <BookOpenText className="w-3.5 h-3.5 text-[var(--accent)]" />
                                        {hub.stats.articles.toLocaleString()} published
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                                        {hub.stats.authors} {hub.stats.authors === 1 ? "writer" : "writers"}
                                    </span>
                                    {hub.stats.this_month > 0 && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                                            {hub.stats.this_month} this month
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {hub?.featured ? (
                            <Link
                                href={`${config.path}/${hub.featured.slug}`}
                                className="group relative block rounded-[14px] overflow-hidden border border-white/[0.07] min-h-[330px]"
                            >
                                {hub.featured.featured_image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={getStorageUrl(hub.featured.featured_image_url)}
                                        alt=""
                                        aria-hidden
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                                    />
                                )}
                                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

                                <span className="absolute top-3 left-3 inline-flex items-center h-[21px] px-2 rounded-[5px] bg-[var(--accent)] font-display text-[9px] font-black uppercase tracking-[0.12em] text-white">
                                    Featured
                                </span>

                                <span className="absolute inset-x-0 bottom-0 p-5">
                                    <span className="block font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                                        {shortDate(hub.featured.published_at)}
                                    </span>
                                    <span className="mt-2 block font-display text-[22px] md:text-[26px] font-black text-white leading-tight line-clamp-3">
                                        {hub.featured.title}
                                    </span>
                                    {hub.featured.excerpt && (
                                        <span className="mt-2 block text-[12.5px] text-white/55 leading-snug line-clamp-2">
                                            {hub.featured.excerpt}
                                        </span>
                                    )}
                                    <span className="mt-3 inline-flex items-center gap-1.5 font-display text-[10.5px] font-black uppercase tracking-[0.1em] text-[var(--accent)]">
                                        Read more <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </span>
                            </Link>
                        ) : (
                            <div className="rounded-[14px] border border-dashed border-white/[0.09] min-h-[330px] grid place-items-center px-6 text-center">
                                <p className="text-[12.5px] text-white/30">
                                    Nothing is flagged for the spotlight here yet.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── tab row, with real counts ── */}
                    <div className="mt-7 flex flex-wrap gap-2">
                        <Tab
                            label="Everything"
                            count={hub?.stats.articles}
                            active={filter === "all"}
                            onClick={() => { setFilter("all"); setPage(1); }}
                        />
                        {hub?.categories.map((c) => {
                            const route = config.categoryRoutes?.[c.slug];

                            return route ? (
                                <Tab key={c.slug} label={c.name} count={c.count} href={route} />
                            ) : (
                                <Tab
                                    key={c.slug}
                                    label={c.name}
                                    count={c.count}
                                    active={filter === c.slug}
                                    onClick={() => { setFilter(c.slug); setPage(1); }}
                                />
                            );
                        })}
                    </div>

                    {/* ── the list ── */}
                    <div className="mt-7 flex items-center justify-between gap-4">
                        <p className="flex items-center gap-2.5">
                            <span aria-hidden className="w-[3px] h-[15px] rounded bg-[var(--accent)]" />
                            <span className="font-display text-[13px] font-black uppercase tracking-[0.14em] text-white">
                                Latest
                            </span>
                        </p>

                        {pages && pages.last > 1 && (
                            <span className="flex items-center gap-3">
                                <span className="font-display text-[10.5px] font-bold tabular-nums text-white/30 whitespace-nowrap">
                                    {pages.total.toLocaleString()} · page {pages.current} of {pages.last}
                                </span>
                                <span className="flex items-center gap-1">
                                    <PageButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)} label="Previous page">
                                        <ChevronLeft className="w-4 h-4" />
                                    </PageButton>
                                    <PageButton disabled={page >= pages.last} onClick={() => setPage((p) => p + 1)} label="Next page">
                                        <ChevronRight className="w-4 h-4" />
                                    </PageButton>
                                </span>
                            </span>
                        )}
                    </div>

                    {isLoading && !articles.length ? (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <span key={i} className="block h-[300px] rounded-[12px] bg-white/[0.03] animate-pulse" />
                            ))}
                        </div>
                    ) : articles.length === 0 ? (
                        <p className="mt-8 py-14 text-center text-[12.5px] text-white/35">
                            Nothing published under this filter yet.
                        </p>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {articles.map((a) => (
                                <ArticleCard key={a.id} article={a} path={config.path} showScore={config.showScore} />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── rail ── */}
                <aside className="space-y-4 xl:sticky xl:top-4">
                    <Panel title="Most read">
                        {hub?.most_read.length ? (
                            <ol className="space-y-3">
                                {hub.most_read.map((a, i) => (
                                    <li key={a.slug}>
                                        <Link href={`${config.path}/${a.slug}`} className="flex gap-3 group">
                                            <span className="font-display text-[15px] font-black tabular-nums text-[var(--accent)] w-4 shrink-0 leading-none pt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="w-[52px] h-[36px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.05]">
                                                {a.featured_image_url && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={getStorageUrl(a.featured_image_url)} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                                )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[12px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                                    {a.title}
                                                </span>
                                                {a.category && (
                                                    <span className="block mt-0.5 text-[10.5px] text-white/30">{a.category.name}</span>
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-[11.5px] text-white/30">Not enough reading yet to rank anything.</p>
                        )}
                    </Panel>

                    {/* The release calendar is ours now, so this rail can lean on
                        it without anybody else's API being up. */}
                    <Panel
                        title="Coming out"
                        action={
                            <Link href="/calendar" className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent)] hover:brightness-110">
                                Calendar
                            </Link>
                        }
                    >
                        {hub?.upcoming_releases.length ? (
                            <div className="space-y-3">
                                {hub.upcoming_releases.map((g) => (
                                    <Link key={g.slug} href={`/calendar/${g.slug}`} className="flex items-center gap-3 group">
                                        <span className="w-[46px] h-[31px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.05]">
                                            {g.background_image && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={getStorageUrl(g.background_image)} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[12px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                {g.name}
                                            </span>
                                            <span className="block text-[10.5px] uppercase tracking-[0.06em] text-white/30">
                                                {shortDate(g.released) ?? "TBA"}
                                            </span>
                                        </span>
                                        <span className="text-right shrink-0">
                                            <span className="block font-display text-[15px] font-black tabular-nums text-[var(--accent)] leading-none">
                                                {Math.max(0, g.days_away)}
                                            </span>
                                            <span className="block text-[8.5px] uppercase tracking-[0.1em] text-white/30">days</span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11.5px] text-white/30">Nothing dated in the window yet.</p>
                        )}
                    </Panel>

                    <Panel title="Stay in the loop" icon={<Mail className="w-3.5 h-3.5 text-[var(--accent)]" />}>
                        <p className="text-[11.5px] text-white/40 leading-snug mb-3">
                            The bigger stories, sent when there is something worth sending.
                        </p>
                        <form onSubmit={subscribe} className="flex gap-2">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email address"
                                aria-label="Email address"
                                className="flex-1 min-w-0 h-9 px-3 rounded-[8px] bg-white/[0.05] border border-white/[0.08] text-[12px] text-white placeholder:text-white/25 outline-none focus:border-[var(--accent)] transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={subscribing}
                                className="shrink-0 h-9 px-4 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-60 font-display text-[10px] font-black uppercase tracking-[0.1em] text-white transition-all"
                            >
                                {subscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Subscribe"}
                            </button>
                        </form>
                    </Panel>
                </aside>
            </div>
        </main>
    );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

/**
 * A tab is a button when it filters the list in place, and a link when the
 * category has a page of its own. Same shape either way, so the row does not
 * look like two different controls.
 */
function Tab({
    label, count, active = false, onClick, href,
}: { label: string; count?: number; active?: boolean; onClick?: () => void; href?: string }) {
    const className = `inline-flex items-center gap-2 h-9 px-4 rounded-[9px] font-display text-[10.5px] font-black uppercase tracking-[0.08em] transition-colors ${
        active ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/50 hover:text-white"
    }`;

    const body = (
        <>
            {label}
            {count !== undefined && (
                <span className={`tabular-nums ${active ? "text-white/70" : "text-white/25"}`}>{count}</span>
            )}
        </>
    );

    return href ? (
        <Link href={href} className={className}>{body}</Link>
    ) : (
        <button onClick={onClick} aria-pressed={active} className={className}>{body}</button>
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
            className="w-7 h-7 rounded-[6px] bg-white/[0.05] text-white/50 hover:text-white disabled:opacity-25 disabled:hover:text-white/50 flex items-center justify-center transition-colors"
        >
            {children}
        </button>
    );
}

function Panel({
    title, icon, action, children,
}: { title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-[13px] border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3 mb-3.5">
                <p className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white">
                    {icon} {title}
                </p>
                {action}
            </div>
            {children}
        </div>
    );
}

function ArticleCard({
    article, path, showScore,
}: { article: Article; path: string; showScore?: boolean }) {
    const author = article.author?.display_name ?? article.author?.username;
    const label = article.category?.name ?? article.difficulty;
    const score = showScore && typeof article.review_score === "number" ? article.review_score : null;

    return (
        <Link
            href={`${path}/${article.slug}`}
            className="group flex flex-col rounded-[12px] border border-white/[0.07] bg-white/[0.02] overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
        >
            <span className="relative block h-[150px] bg-white/[0.04]">
                {article.featured_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={getStorageUrl(article.featured_image_url)}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                )}
                {label && (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center h-[20px] px-2 rounded-[5px] bg-[var(--accent)] font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-white">
                        {label}
                    </span>
                )}
                {score !== null && (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 h-[20px] px-2 rounded-[5px] bg-black/75 backdrop-blur-sm font-display text-[10px] font-black tabular-nums text-white">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {score}
                    </span>
                )}
            </span>

            <span className="flex-1 flex flex-col p-3.5">
                <span className="font-display text-[13px] font-black text-white leading-tight line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                    {article.title}
                </span>
                {article.excerpt && (
                    <span className="mt-1.5 text-[11.5px] text-white/40 leading-snug line-clamp-3">
                        {article.excerpt}
                    </span>
                )}

                <span className="mt-auto pt-3.5 flex items-center justify-between gap-2 text-[10px] text-white/30">
                    {author && (
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="font-display font-bold uppercase tracking-[0.06em] truncate">{author}</span>
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3 h-3" />
                        {article.published_at_human ?? timeAgo(article.published_at ?? article.created_at) ?? "—"}
                    </span>
                </span>
            </span>
        </Link>
    );
}
