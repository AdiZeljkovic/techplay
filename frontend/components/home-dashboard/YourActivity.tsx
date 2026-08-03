"use client";

import Link from "next/link";
import useSWR from "swr";
import { BookOpen, Bookmark, Search, PenLine, ChevronRight, Gamepad2, Activity } from "lucide-react";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";

interface ReadingArticle {
    slug: string;
    title: string;
    featured_image_url: string | null;
    category: string | null;
    category_type: string | null;
}

interface ReadingData {
    saved: { total: number; items: ReadingArticle[] };
    continue_reading: (ReadingArticle & { progress: number; last_read_at: string | null }) | null;
    recent_searches: string[];
    draft_reviews: {
        total: number;
        items: { slug: string; name: string; background_image: string | null; rating: number }[];
    };
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as ReadingData);

/** Same mapping as lib/articleHref, against this endpoint's flat category_type. */
const hrefFor = (a: ReadingArticle) => {
    const type = a.category_type ?? "news";
    return `/${type === "tech" ? "hardware" : type}/${a.slug}`;
};

function Card({
    title,
    icon,
    action,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    action?: { label: string; href: string };
    children: React.ReactNode;
}) {
    return (
        <div className="group/card relative rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors duration-300">
            {/* accent rail draws across the card on hover */}
            <span
                aria-hidden
                className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover/card:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
            />
            <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                    <span className="text-[var(--accent)]">{icon}</span>
                    {title}
                </h3>
                {action && (
                    <Link href={action.href} className="flex items-center gap-0.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 hover:text-[var(--accent)] transition-colors duration-150">
                        {action.label} <ChevronRight className="w-3 h-3" />
                    </Link>
                )}
            </div>
            <div className="flex-1 flex flex-col">{children}</div>
        </div>
    );
}

const Hint = ({ children }: { children: string }) => <EmptyState variant="hint" title={children} />;

/**
 * "Pick up where you left off" — reading progress, saved articles, recent
 * searches and unpublished review drafts, all from GET /me/reading.
 */
export default function YourActivity() {
    const { data } = useSWR("/me/reading", fetcher, { dedupingInterval: 120_000, revalidateOnFocus: false });

    if (!data) {
        return <div className="h-[440px] rounded-[var(--radius-panel)] bg-[var(--fill-2)] animate-pulse" />;
    }

    const { continue_reading: reading, saved, recent_searches: searches, draft_reviews: drafts } = data;

    return (
        <Panel
            title="Your Activity"
            icon={<Activity className="w-4 h-4 text-[var(--accent)]" />}
            bodyClassName="p-4"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Continue reading */}
                <Card title="Continue Reading" icon={<BookOpen className="w-3.5 h-3.5" />} action={reading ? { label: "View all", href: "/news" } : undefined}>
                    {reading ? (
                        <Link href={hrefFor(reading)} className="group flex gap-3">
                            <div className="relative w-[74px] h-[74px] rounded-lg overflow-hidden shrink-0 bg-[var(--fill-2)]">
                                {reading.featured_image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={reading.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col">
                                <p className="text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                    {reading.title}
                                </p>
                                {reading.category && <p className="mt-1 text-[10px] text-[var(--ink-faint)]">{reading.category}</p>}
                                <div className="mt-auto pt-2 flex items-center gap-2">
                                    <span className="flex-1 h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
                                        <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${reading.progress}%` }} />
                                    </span>
                                    <span className="text-[10px] font-bold text-[var(--ink-low)] tabular-nums">{reading.progress}%</span>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <Hint>Start an article and it&apos;ll wait for you here</Hint>
                    )}
                </Card>

                {/* Saved articles */}
                <Card title="Saved Articles" icon={<Bookmark className="w-3.5 h-3.5" />} action={saved.total > 0 ? { label: "View all", href: "/profile/me?tab=activity" } : undefined}>
                    {saved.total > 0 ? (
                        <>
                            <p className="font-display text-[28px] font-black text-white leading-none tabular-nums">{saved.total}</p>
                            <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/35 mt-1.5">Saved article{saved.total === 1 ? "" : "s"}</p>
                            <div className="mt-auto pt-3 flex gap-1.5">
                                {saved.items.slice(0, 4).map((a) => (
                                    <Link key={a.slug} href={hrefFor(a)} title={a.title} className="relative flex-1 aspect-square rounded-md overflow-hidden bg-[var(--fill-1)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors">
                                        {a.featured_image_url && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={a.featured_image_url} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </Link>
                                ))}
                                {saved.total > 4 && (
                                    <span className="flex-1 aspect-square rounded-md bg-[var(--fill-2)] border border-[var(--line)] flex items-center justify-center text-[11px] font-bold text-[var(--ink-low)]">
                                        +{saved.total - 4}
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <Hint>Hit Save on any article to build a reading list</Hint>
                    )}
                </Card>

                {/* Recent searches */}
                <Card title="Recent Searches" icon={<Search className="w-3.5 h-3.5" />}>
                    {searches.length > 0 ? (
                        <div className="space-y-1.5">
                            {searches.slice(0, 3).map((term) => (
                                <Link
                                    key={term}
                                    href={`/games?search=${encodeURIComponent(term)}`}
                                    className="group flex items-center gap-2 h-9 px-3 rounded-lg bg-[var(--fill-1)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
                                >
                                    <Search className="w-3 h-3 text-[var(--ink-faint)] shrink-0" />
                                    <span className="text-[12px] text-[var(--ink-mid)] truncate group-hover:text-white transition-colors">{term}</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Hint>Your recent searches will show up here</Hint>
                    )}
                </Card>

                {/* Draft reviews */}
                <Card title="Reviews to Finish" icon={<PenLine className="w-3.5 h-3.5" />} action={drafts.total > 0 ? { label: "View all", href: "/profile/me?tab=activity" } : undefined}>
                    {drafts.total > 0 ? (
                        <div className="flex gap-3">
                            <div className="shrink-0">
                                <p className="font-display text-[28px] font-black text-white leading-none tabular-nums">{drafts.total}</p>
                                <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/35 mt-1.5 max-w-[52px] leading-tight">Draft review{drafts.total === 1 ? "" : "s"}</p>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                                {drafts.items.slice(0, 2).map((d) => (
                                    <Link key={d.slug} href={`/games/${d.slug}`} prefetch={false} className="group flex items-center gap-2">
                                        <span className="relative w-[42px] h-[28px] rounded overflow-hidden shrink-0 bg-[var(--fill-2)]">
                                            {d.background_image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={d.background_image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-3 h-3 text-[var(--ink-faint)]" /></span>
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[11px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors">{d.name}</span>
                                            <span className="block text-[10px] text-[var(--ink-faint)]">(Draft)</span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Hint>Save a review as a draft and finish it later</Hint>
                    )}
                </Card>
            </div>
        </Panel>
    );
}
