"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, Sparkles } from "lucide-react";
import axios from "@/lib/axios";
import MatchRing from "./MatchRing";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
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
            className="group relative flex items-center gap-3.5 p-2 -mx-2 rounded-[var(--radius-card)] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300"
        >
            <div className="relative w-[112px] h-[62px] rounded-[var(--radius-inner)] overflow-hidden shrink-0 bg-[var(--fill-1)] border border-[var(--line)]">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--ink-faint)]"><Gamepad2 className="w-5 h-5" /></div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-display text-[14px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{name}</p>
                <p className="mt-1 font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/35 line-clamp-1">
                    {genres.length ? genres.join(" · ") : "From your backlog"}
                </p>
            </div>

            {typeof match === "number" && (
                <div className="flex items-center gap-2 shrink-0">
                    <MatchRing percent={match} />
                    <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/35 hidden sm:inline">Match</span>
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
        <Panel
            title="Recommended Next"
            icon={<Sparkles className="w-4 h-4 text-[var(--accent)]" />}
            action={{ label: "View all", href: "/games" }}
            className="h-full flex flex-col"
            bodyClassName="p-5 flex-1 flex flex-col"
        >
            {loading && !games.length ? (
                <div className="flex-1 space-y-2">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-[78px] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />)}
                </div>
            ) : hasRecs || games.length ? (
                <div className="flex-1 divide-y divide-white/[0.07]">
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
                <EmptyState
                    icon={<Sparkles className="w-[18px] h-[18px]" />}
                    title="No picks yet"
                    body="Track a few games and we'll match the catalog against the genres and platforms you actually play."
                    action={{ label: "Explore games", href: "/games", icon: <Gamepad2 className="w-3.5 h-3.5" /> }}
                />
            )}
        </Panel>
    );
}
