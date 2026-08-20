"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, User as UserIcon } from "lucide-react";
import { Article } from "@/types";
import { articleHref } from "@/lib/articleHref";
import { isOwnUpload } from "@/lib/imageUrl";

/** What each vertical is called. The name carries it; an icon beside it only repeated the word. */
const TYPE_LABEL: Record<string, string> = {
    news: "News",
    reviews: "Reviews",
    tech: "Hardware",
    guides: "Guides",
};

const typeLabel = (a: Article) => TYPE_LABEL[a.category?.type ?? "news"] ?? TYPE_LABEL.news;

/** Round-robin across the verticals so the rail never turns into one long news list. */
function interleave(...lists: Article[][]): Article[] {
    const out: Article[] = [];
    const longest = Math.max(...lists.map((l) => l.length), 0);
    for (let i = 0; i < longest; i++) {
        for (const list of lists) if (list[i]) out.push(list[i]);
    }
    return out;
}

function Kicker({ article, className = "" }: { article: Article; className?: string }) {
    return (
        <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[var(--accent)] ${className}`}>
            {typeLabel(article)}
        </span>
    );
}

function Meta({ article, withAuthor = false }: { article: Article; withAuthor?: boolean }) {
    const author = article.author?.display_name || article.author?.name;
    return (
        <div className="flex items-center gap-2 text-[11px] text-[var(--ink-low)]">
            {withAuthor && author && (
                <>
                    <span className="flex items-center gap-1.5 text-[var(--ink-mid)] font-semibold">
                        {article.author?.avatar_url ? (
                            <Image src={article.author.avatar_url} alt={author} width={20} height={20} className="w-5 h-5 rounded-full object-cover" unoptimized={!isOwnUpload(article.author.avatar_url)} />
                        ) : (
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"><UserIcon className="w-2.5 h-2.5 text-white/40" /></span>
                        )}
                        {author}
                    </span>
                    <span className="text-[var(--ink-faint)]">·</span>
                </>
            )}
            {article.published_at_human && <span>{article.published_at_human}</span>}
            {article.reading_time && (
                <>
                    <span className="text-[var(--ink-faint)]">·</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.reading_time}</span>
                </>
            )}
        </div>
    );
}

/** Big lead story — image fills the card, copy sits on the gradient. */
function FeaturedCard({ article }: { article: Article }) {
    return (
        <Link
            href={articleHref(article)}
            className="group relative h-full flex flex-col justify-end rounded-[var(--radius-panel)] overflow-hidden border border-[var(--line)] bg-[var(--surface-1)] min-h-[340px] lg:min-h-[420px] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
        >
            {article.featured_image_url && (
                <Image
                    src={article.featured_image_url}
                    alt={article.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-hud)] group-hover:scale-[1.04]"
                />
            )}
            <div className="absolute inset-0 scrim-card" />
            <div className="relative p-6 md:p-7">
                <div className="flex items-center gap-2.5 mb-3">
                    <span className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest">
                        Featured
                    </span>
                    <Kicker article={article} className="!text-white/60" />
                </div>
                <h3 className="font-display text-[24px] md:text-[30px] font-black text-white leading-[1.15] line-clamp-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] group-hover:text-[var(--accent)] transition-colors">
                    {article.title}
                </h3>
                {article.excerpt && (
                    <p className="mt-2.5 text-[13px] text-[var(--ink-mid)] line-clamp-2 max-w-xl">{article.excerpt}</p>
                )}
                <div className="mt-4"><Meta article={article} withAuthor /></div>
            </div>
        </Link>
    );
}

/** Compact horizontal row for the right rail. */
function SideCard({ article }: { article: Article }) {
    return (
        <Link
            href={articleHref(article)}
            className="group relative flex gap-4 items-stretch rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
        >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)] scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300" />
            <div className="relative w-[120px] sm:w-[132px] shrink-0 overflow-hidden">
                {article.featured_image_url && (
                    <Image
                        src={article.featured_image_url}
                        alt={article.title}
                        fill
                        sizes="132px"
                        className="object-cover transition-transform duration-700 ease-[var(--ease-hud)] group-hover:scale-[1.04]"
                    />
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center py-3.5 pr-4">
                <Kicker article={article} />
                <p className="mt-1.5 font-display text-[14px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                    {article.title}
                </p>
                {article.excerpt && (
                    <p className="mt-1.5 text-[12px] text-[var(--ink-low)] leading-snug line-clamp-2">
                        {article.excerpt}
                    </p>
                )}
                <div className="mt-2"><Meta article={article} /></div>
            </div>
        </Link>
    );
}

/** Poster card for the bottom row. */
function GridCard({ article }: { article: Article }) {
    return (
        <Link
            href={articleHref(article)}
            className="group h-full flex flex-col rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
        >
            <div className="relative aspect-[16/9] overflow-hidden bg-[var(--fill-1)]">
                {article.featured_image_url && (
                    <Image
                        src={article.featured_image_url}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-[var(--ease-hud)] group-hover:scale-[1.04]"
                    />
                )}
                <div className="absolute inset-0 scrim-card" />
            </div>
            <div className="flex-1 flex flex-col p-4">
                <Kicker article={article} />
                <p className="mt-1.5 font-display text-[14px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                    {article.title}
                </p>
                {article.excerpt && (
                    <p className="mt-2 text-[12.5px] text-[var(--ink-low)] leading-snug line-clamp-2">
                        {article.excerpt}
                    </p>
                )}
                <div className="mt-auto pt-3"><Meta article={article} /></div>
            </div>
        </Link>
    );
}

/**
 * Lead story + a rail of three + a bottom row of three, drawn round-robin from
 * news / reviews / hardware so every vertical is represented. Data arrives as
 * props from the /home payload, so all links ship in the SSR HTML.
 */
export default function EditorialSpotlight({ news, reviews, tech }: { news: Article[]; reviews: Article[]; tech: Article[] }) {
    const featured = news[0];
    if (!featured) return null;

    // Distinct stories after the lead, mixed across verticals
    const seen = new Set([featured.slug]);
    const rest = interleave(news.slice(1), reviews, tech).filter((a) => {
        if (!a?.slug || seen.has(a.slug)) return false;
        seen.add(a.slug);
        return true;
    });

    const side = rest.slice(0, 3);
    const grid = rest.slice(3, 6);

    return (
        <section>
            <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                    <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                    Editorial Spotlight
                </h2>
                <Link href="/news" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150">
                    View all stories <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Both columns end level: the grid stretches the cells, the
                    lead card fills its own, and the three beside it set the
                    height between them. */}
                <div className="lg:col-span-7"><FeaturedCard article={featured} /></div>
                <div className="lg:col-span-5 flex flex-col gap-5 min-h-[340px] lg:min-h-[420px]">
                    {side.map((a) => <SideCard key={a.slug} article={a} />)}
                </div>
            </div>

            {grid.length > 0 && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {grid.map((a, i) => (
                        <div key={a.slug} className={`h-full tp-fade-up tp-d${Math.min(6, i + 1)}`}>
                            <GridCard article={a} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
