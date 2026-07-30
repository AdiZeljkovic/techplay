"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, Wand2 } from "lucide-react";
import axios from "@/lib/axios";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import type { DashboardGameCover } from "@/lib/types/dashboard";

interface Recommendation {
    slug: string;
    name: string;
    background_image: string | null;
    match_percent: number;
    matched_genres: string[];
}

const fetcher = (url: string) => axios.get(url).then((r) => (r.data?.data ?? []) as Recommendation[]);

function Row({ slug, name, image, caption, badge }: { slug: string; name: string; image: string | null; caption: string; badge?: number }) {
    return (
        <Link
            href={`/games/${slug}`}
            prefetch={false}
            className="group flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors"
        >
            <div className="relative w-[72px] h-[44px] rounded-lg overflow-hidden shrink-0 bg-white/5">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-4 h-4" /></div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{name}</p>
                <p className="text-[11px] text-white/40 line-clamp-1">{caption}</p>
            </div>
            {typeof badge === "number" && (
                <span className="shrink-0 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-black tabular-nums">
                    {badge}% Match
                </span>
            )}
        </Link>
    );
}

/**
 * Personalized picks from GET /me/recommendations (genre-profile match %).
 * Falls back to the backlog preview while recommendations are loading or
 * when the library is too thin to score against.
 */
export default function RecommendedNext({ games }: { games: DashboardGameCover[] }) {
    const { data: recs } = useSWR("/me/recommendations", fetcher, {
        dedupingInterval: 600_000,
        revalidateOnFocus: false,
    });

    const hasRecs = !!recs?.length;
    if (!hasRecs && !games.length) return null;

    return (
        <SectionCard
            title="Recommended Next"
            icon={<Wand2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "Backlog Advisor", href: "/backlog-advisor" }}
            bodyClassName="space-y-2"
        >
            {hasRecs
                ? recs!.slice(0, 4).map((r) => (
                    <Row
                        key={r.slug}
                        slug={r.slug}
                        name={r.name}
                        image={r.background_image}
                        caption={r.matched_genres.join(", ") || "Based on your library"}
                        badge={r.match_percent}
                    />
                ))
                : games.map((g) => (
                    <Row key={g.slug} slug={g.slug} name={g.name} image={g.background_image} caption="In your backlog" />
                ))}
        </SectionCard>
    );
}
