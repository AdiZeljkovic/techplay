"use client";

import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, UserPlus } from "lucide-react";
import Meter from "@/components/ui/Meter";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

interface Match {
    comparable: boolean;
    reason?: "self" | "too_small";
    yours_is_short?: boolean;
    needed?: number;
    score?: number;
    verdict?: string;
    breakdown?: { key: string; label: string; percent: number }[];
    shared_games?: { slug: string; name: string; cover_url: string | null }[];
    shared_genres?: { name: string; count: number }[];
    they_love?: { name: string; count: number }[];
    you_love?: { name: string; count: number }[];
    counts?: { yours: number; theirs: number; shared: number };
}

/**
 * How much your taste and theirs overlap.
 *
 * Everything else on a stranger's Insights describes one person. This is the
 * only part that answers the question a stranger actually arrived with — how
 * does this relate to me — and it is the most natural moment there has ever
 * been to send a friend request.
 *
 * Draws nothing on your own profile and nothing when signed out: a comparison
 * needs two libraries, and there is only one in either case.
 */
export default function TasteMatch({ username, displayName }: { username: string; displayName: string }) {
    const { user } = useAuth();

    const { data } = useSWR<Match>(
        user && user.username !== username ? `/users/${username}/taste-match` : null,
        fetcher,
        { revalidateOnFocus: false },
    );

    if (!user || user.username === username || !data) return null;

    // Not enough shelf to measure. Said plainly, with the fix that applies to
    // whichever side is short — a shrug that fits both cases helps neither.
    if (!data.comparable) {
        if (data.reason !== "too_small") return null;

        return (
            <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] p-5">
                <p className="font-display text-[11px] font-black uppercase tracking-[0.16em] text-white/55">Taste match</p>
                <p className="mt-2 text-[13px] text-white/50 leading-relaxed max-w-[520px]">
                    {data.yours_is_short
                        ? `Add ${data.needed} games to your collection and this will tell you how close your taste is to ${displayName}'s.`
                        : `${displayName} has not shelved enough games yet for this to mean anything.`}
                </p>
                {data.yours_is_short && (
                    <Link href="/games" className="mt-3 inline-flex items-center h-9 px-4 rounded-[var(--radius-card)] bg-[var(--accent)] hover:brightness-110 font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white transition-[filter]">
                        Browse games
                    </Link>
                )}
            </section>
        );
    }

    const score = data.score ?? 0;

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border p-5 md:p-6"
            style={{
                background: "var(--surface-2)",
                borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09)",
            }}
        >
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(72% 120% at 12% 0%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 62%)" }}
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 lg:gap-8 items-start">
                {/* The number, once, at the size it deserves. */}
                <div className="shrink-0">
                    <p className="flex items-center gap-1.5 font-display text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent-ink)]">
                        <Sparkles className="w-3.5 h-3.5" /> Taste match
                    </p>
                    <p className="mt-2 flex items-baseline gap-1">
                        <span className="font-display text-[52px] font-black tabular-nums leading-none text-white">{score}</span>
                        <span className="font-display text-[20px] font-black text-white/30">%</span>
                    </p>
                    <p className="mt-1.5 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
                        {data.verdict}
                    </p>
                    <p className="mt-2 text-[11.5px] text-white/50">
                        {data.counts?.shared ?? 0} of your {data.counts?.yours ?? 0} games in common
                    </p>
                </div>

                <div className="min-w-0 space-y-4">
                    {/* Why, in the site's own words. A match percentage nobody
                        can explain is a horoscope. */}
                    <div className="space-y-2.5">
                        {(data.breakdown ?? []).map((part) => (
                            <Meter key={part.key} value={part.percent} max={100} label={part.label} showCount={false} />
                        ))}
                    </div>

                    {(data.shared_genres?.length ?? 0) > 0 && (
                        <p className="flex flex-wrap items-center gap-1.5">
                            <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/50 mr-1">Both of you</span>
                            {data.shared_genres!.map((g) => (
                                <span key={g.name} className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-[11px] font-bold text-[var(--accent-ink)]">
                                    {g.name}
                                </span>
                            ))}
                        </p>
                    )}

                    {/* The disagreement is more interesting than the agreement,
                        and it is what people actually reply to. */}
                    {(data.they_love?.length ?? 0) > 0 && (
                        <p className="flex flex-wrap items-center gap-1.5">
                            <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/50 mr-1">Only them</span>
                            {data.they_love!.map((g) => (
                                <span key={g.name} className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-white/[0.05] border border-white/[0.09] text-[11px] font-bold text-white/55">
                                    {g.name}
                                </span>
                            ))}
                        </p>
                    )}

                    {(data.shared_games?.length ?? 0) > 0 && (
                        <div>
                            <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/50 mb-2">Both on your shelves</p>
                            <div className="flex flex-wrap gap-2">
                                {data.shared_games!.map((g) => (
                                    <Link
                                        key={g.slug}
                                        href={`/games/${g.slug}`}
                                        title={g.name}
                                        className="group relative w-[46px] h-[62px] rounded-[var(--radius-inner)] overflow-hidden border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] transition-colors"
                                    >
                                        {g.cover_url && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={g.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <Link
                        href={`/profile/${username}`}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-card)] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors"
                    >
                        <UserPlus className="w-3.5 h-3.5" /> See their profile
                    </Link>
                </div>
            </div>
        </section>
    );
}
