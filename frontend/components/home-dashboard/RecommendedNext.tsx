"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, ChevronRight } from "lucide-react";
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
    if (!hasRecs && !games.length) return null;

    return (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-white">Recommended Next For You</h3>
                <Link href="/games" className="flex items-center gap-0.5 text-[11.5px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="flex-1 divide-y divide-white/[0.04]">
                {hasRecs
                    ? recs!.slice(0, 4).map((r) => (
                        <Row key={r.slug} slug={r.slug} name={r.name} image={r.background_image} genres={r.matched_genres} match={r.match_percent} />
                    ))
                    : games.slice(0, 4).map((g) => (
                        <Row key={g.slug} slug={g.slug} name={g.name} image={g.background_image} genres={[]} />
                    ))}
            </div>
        </div>
    );
}
