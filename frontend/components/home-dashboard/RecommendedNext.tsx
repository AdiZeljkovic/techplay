"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, ChevronRight, Sparkles } from "lucide-react";
import axios from "@/lib/axios";
import MatchRing from "./MatchRing";
import type { DashboardGameCover } from "@/lib/types/dashboard";

interface Recommendation {
    slug: string;
    name: string;
    background_image: string | null;
    match_percent: number;
    matched_genres: string[];
}

const fetcher = (url: string) => axios.get(url).then((r) => (r.data?.data ?? []) as Recommendation[]);

function Row({
    slug,
    name,
    image,
    genres,
    match,
}: {
    slug: string;
    name: string;
    image: string | null;
    genres: string[];
    match?: number;
}) {
    return (
        <Link
            href={`/games/${slug}`}
            prefetch={false}
            className="group flex items-center gap-3.5 p-2 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors"
        >
            <div className="relative w-[112px] h-[62px] rounded-lg overflow-hidden shrink-0 bg-white/5">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-5 h-5" /></div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{name}</p>
                <p className="mt-1 text-[11.5px] text-white/40 line-clamp-1">
                    {genres.length ? genres.join(", ") : "From your backlog"}
                </p>
            </div>

            {typeof match === "number" && (
                <div className="flex items-center gap-2 shrink-0">
                    <MatchRing percent={match} />
                    <span className="text-[11px] text-white/40 hidden sm:inline">Match</span>
                </div>
            )}
        </Link>
    );
}

/**
 * Personalized picks from GET /me/recommendations (genre-profile match %).
 * Falls back to the backlog preview while loading or when the library is too
 * thin to score against.
 */
export default function RecommendedNext({ games }: { games: DashboardGameCover[] }) {
    const { data: recs } = useSWR("/me/recommendations", fetcher, {
        dedupingInterval: 600_000,
        revalidateOnFocus: false,
    });

    const hasRecs = !!recs?.length;
    const loading = !recs;

    return (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-white">Recommended Next For You</h3>
                <Link href="/games" className="flex items-center gap-0.5 text-[11.5px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {loading && !games.length ? (
                <div className="flex-1 space-y-2">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-[78px] rounded-xl bg-white/[0.04] animate-pulse" />)}
                </div>
            ) : hasRecs || games.length ? (
                <div className="flex-1 divide-y divide-white/[0.04]">
                    {hasRecs
                        ? recs!.slice(0, 4).map((r) => (
                            <Row key={r.slug} slug={r.slug} name={r.name} image={r.background_image} genres={r.matched_genres} match={r.match_percent} />
                        ))
                        : games.slice(0, 4).map((g) => (
                            <Row key={g.slug} slug={g.slug} name={g.name} image={g.background_image} genres={[]} />
                        ))}
                </div>
            ) : (
                // Recommendations are derived from the library — say so instead of vanishing
                <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                    <span className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                        <Sparkles className="w-[18px] h-[18px] text-[var(--accent)]" />
                    </span>
                    <p className="text-[13px] font-semibold text-white/70">No picks yet</p>
                    <p className="text-[11.5px] text-white/35 max-w-[260px]">
                        Track a few games and we&apos;ll match the catalog against the genres and platforms you actually play.
                    </p>
                    <Link
                        href="/games"
                        className="mt-1 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--accent)] text-white text-[12px] font-bold hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        <Gamepad2 className="w-3.5 h-3.5" /> Explore games
                    </Link>
                </div>
            )}
        </div>
    );
}
