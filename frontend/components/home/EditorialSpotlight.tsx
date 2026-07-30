"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Article } from "@/types";

function articleHref(article: Article): string {
    const type = article.category?.type ?? "news";
    const segment = type === "tech" ? "hardware" : type;
    return `/${segment}/${article.slug}`;
}

const KICKER: Record<string, string> = { news: "News", reviews: "Reviews", tech: "Hardware" };

function SideCard({ article }: { article: Article }) {
    const kicker = KICKER[article.category?.type ?? "news"] ?? "News";
    return (
        <Link href={articleHref(article)} className="group flex gap-4 items-stretch rounded-xl border border-white/[0.06] bg-[var(--bg-card)] overflow-hidden hover:border-[var(--accent)]/40 transition-colors">
            <div className="relative w-[130px] shrink-0">
                {article.featured_image_url && (
                    <Image src={article.featured_image_url} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
            </div>
            <div className="flex-1 min-w-0 py-3.5 pr-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">{kicker}</p>
                <p className="text-[14px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                    {article.title}
                </p>
                <p className="mt-1.5 text-[11px] text-white/35">
                    {article.published_at_human}{article.reading_time ? ` · ${article.reading_time}` : ""}
                </p>
            </div>
        </Link>
    );
}

/**
 * Featured story + one pick per editorial vertical (news / reviews / hardware).
 * Data comes from the /home payload (props), so links are in the SSR HTML.
 */
export default function EditorialSpotlight({ news, reviews, tech }: { news: Article[]; reviews: Article[]; tech: Article[] }) {
    const featured = news[0];
    if (!featured) return null;

    const side = [news[1], reviews[0], tech[0]].filter(Boolean) as Article[];

    return (
        <section>
            <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2.5 text-[18px] font-bold text-white font-display">
                    <span className="w-1.5 h-5 rounded-sm bg-[var(--accent)]" />
                    Editorial Spotlight
                </h2>
                <Link href="/news" className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                    View all stories <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Featured story */}
                <Link href={articleHref(featured)} className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[var(--bg-card)] min-h-[320px] hover:border-[var(--accent)]/40 transition-colors">
                    {featured.featured_image_url && (
                        <Image src={featured.featured_image_url} alt={featured.title} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-2">Featured</p>
                        <h3 className="font-display text-[22px] md:text-[26px] font-black text-white leading-tight line-clamp-3 group-hover:text-[var(--accent)] transition-colors">
                            {featured.title}
                        </h3>
                        {featured.excerpt && (
                            <p className="mt-2 text-[13px] text-white/55 line-clamp-2 max-w-lg">{featured.excerpt}</p>
                        )}
                        <p className="mt-3 text-[11px] text-white/40">
                            {featured.author?.display_name || featured.author?.name}
                            {featured.published_at_human ? ` · ${featured.published_at_human}` : ""}
                            {featured.reading_time ? ` · ${featured.reading_time}` : ""}
                        </p>
                    </div>
                </Link>

                {/* Vertical picks */}
                <div className="flex flex-col gap-4">
                    {side.map((a) => <SideCard key={a.id} article={a} />)}
                </div>
            </div>
        </section>
    );
}
