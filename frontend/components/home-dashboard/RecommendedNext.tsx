"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, Sparkles, Star, Check } from "lucide-react";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import type { DashboardGameCover } from "@/lib/types/dashboard";

interface Recommendation {
    slug: string;
    name: string;
    cover_url: string | null;
    rating: number | null;
    match_percent: number;
    matched_genres: string[];
}

const fetcher = (url: string) => axios.get(url).then((r) => (r.data?.data ?? []) as Recommendation[]);

/** The advisor's colour law: a score is green, amber or crimson, not decoration. */
function scoreTone(score: number): string {
    if (score >= 70) return "#34d399";
    if (score >= 50) return "#fbbf24";

    return "var(--accent-ink)";
}

/** "Action and Simulation" — a list a person would say out loud. */
function speak(list: string[]): string {
    if (list.length <= 1) return list[0] ?? "";
    if (list.length === 2) return `${list[0]} and ${list[1]}`;

    return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/**
 * One pick, in the shape the Backlog Advisor uses.
 *
 * The dashboard drew its own narrower version of the same idea and the two
 * disagreed about everything — where the score went, whether genres were chips
 * or a line of grey text, whether the reason was said at all. This is the
 * advisor's row at dashboard width: art, identity, the reason, and the score
 * with its bar on the right.
 */
function Row({
    slug, name, image, genres, rating, match,
}: {
    slug: string;
    name: string;
    image: string | null;
    genres: string[];
    rating?: number | null;
    match?: number;
}) {
    const tone = typeof match === "number" ? scoreTone(match) : undefined;

    return (
        <div className="group flex items-center gap-3.5 rounded-[var(--radius-card)] border border-white/[0.07] bg-white/[0.02] p-3 hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors duration-300">
            <Link
                href={`/games/${slug}`}
                prefetch={false}
                className="relative w-[74px] h-[74px] shrink-0 rounded-[10px] overflow-hidden bg-[var(--fill-1)] border border-white/[0.07]"
            >
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                ) : (
                    <span className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-6 h-6" /></span>
                )}
            </Link>

            <div className="min-w-0 flex-1">
                <Link
                    href={`/games/${slug}`}
                    prefetch={false}
                    className="block font-display text-[14px] font-black text-white leading-tight line-clamp-1 hover:text-[var(--accent)] transition-colors"
                >
                    {name}
                </Link>

                <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {genres.slice(0, 2).map((g) => (
                        <span key={g} className="inline-flex items-center h-[19px] px-1.5 rounded-[5px] bg-white/[0.05] border border-white/[0.07] text-[9.5px] font-semibold text-white/50">
                            {g}
                        </span>
                    ))}
                    {typeof rating === "number" && rating > 0 && (
                        <span className="inline-flex items-center gap-1 font-display text-[9.5px] font-bold tabular-nums text-amber-400/80">
                            <Star className="w-3 h-3 fill-current" /> {rating.toFixed(1)}
                        </span>
                    )}
                </p>

                {/* The one reason this list can stand behind. The score is a
                    genre overlap, so that is what it says — rather than
                    printing the same two genre names on every row as though
                    they described the game. */}
                {genres.length > 0 && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-white/45 leading-snug line-clamp-1">
                        <Check className="w-3 h-3 mt-[3px] shrink-0 text-emerald-400/70" />
                        Matches your taste for {speak(genres.slice(0, 2))}
                    </p>
                )}
            </div>

            {typeof match === "number" && (
                <div className="shrink-0 text-right w-[62px]">
                    <span className="block font-display text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">Match</span>
                    <span className="block font-display text-[22px] font-black tabular-nums leading-none" style={{ color: tone }}>
                        {match}%
                    </span>
                    <span className="mt-1.5 block h-[4px] w-full rounded-full bg-[var(--track)] overflow-hidden">
                        <span
                            className="block h-full rounded-full transition-[width] duration-700"
                            style={{ width: `${match}%`, background: tone }}
                        />
                    </span>
                </div>
            )}
        </div>
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
            action={{ label: "Backlog Advisor", href: "/backlog-advisor" }}
            className="h-full flex flex-col"
            bodyClassName="p-4 flex-1 flex flex-col"
        >
            {loading && !games.length ? (
                <div className="flex-1 space-y-2.5">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-[100px] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />)}
                </div>
            ) : hasRecs || games.length ? (
                <div className="flex-1 space-y-2.5">
                    {hasRecs
                        ? recs!.slice(0, 4).map((r) => (
                            <Row key={r.slug} slug={r.slug} name={r.name} image={r.cover_url} genres={r.matched_genres} rating={r.rating} match={r.match_percent} />
                        ))
                        : games.slice(0, 4).map((g) => (
                            <Row key={g.slug} slug={g.slug} name={g.name} image={g.cover_url} genres={[]} />
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
