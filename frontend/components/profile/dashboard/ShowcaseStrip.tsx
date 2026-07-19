"use client";

import Link from "next/link";
import { Gamepad2, Play, Star, Pin } from "lucide-react";
import type { PlayingNowGame, CollectionSnapshotTile } from "@/lib/types/profile";

interface Props {
    playingNow: PlayingNowGame[];
    snapshot: CollectionSnapshotTile[];
    playingCount?: number;
    /** User-curated pins ("Pin to profile") — take priority over everything. */
    showcase?: PlayingNowGame[];
}

/**
 * The visual centerpiece of the overview — large cover-art cards.
 * Priority: user-pinned showcase > Playing Now > collection bucket covers.
 * Renders nothing when there is no visual data (caller handles empty state).
 */
export default function ShowcaseStrip({ playingNow, snapshot, playingCount, showcase = [] }: Props) {
    const pinned = showcase.length > 0;
    const games = pinned ? showcase : playingNow;
    const hasPlaying = games.length > 0;
    const coveredBuckets = snapshot.filter((t) => t.cover && t.count > 0);

    if (!hasPlaying && coveredBuckets.length === 0) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
            <span className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-[var(--accent)]/70 via-[var(--accent)]/15 to-transparent" />

            <div className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2.5 text-[13px] font-black uppercase tracking-[0.14em] text-white">
                        {pinned ? (
                            <><Pin className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" /> Showcase</>
                        ) : hasPlaying ? (
                            <><Play className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" /> Now Playing</>
                        ) : (
                            <><Star className="w-4 h-4 text-[var(--accent)]" /> Game Showcase</>
                        )}
                    </h2>
                    <Link href="?tab=collection" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-[var(--accent)] transition-colors">
                        {!pinned && hasPlaying && playingCount ? `All ${playingCount} playing` : "View collection"}
                    </Link>
                </div>

                {hasPlaying ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {games.slice(0, 4).map((g, i) => (
                            <Link
                                key={g.slug}
                                href={`/games/${g.slug}`}
                                prefetch={false}
                                className={`group relative aspect-[16/10] rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)]/60 transition-all bg-[var(--bg-elevated)] tp-fade-up tp-d${Math.min(6, i + 1)}`}
                            >
                                {g.background_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.background_image} alt={g.name} loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Gamepad2 className="w-8 h-8 text-white/10" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-3">
                                    <p className="text-[12px] font-bold text-white line-clamp-1 drop-shadow group-hover:text-[var(--accent)] transition-colors">
                                        {g.name}
                                    </p>
                                    {typeof g.progress === "number" && g.progress > 0 && (
                                        <div className="mt-1.5 h-1 bg-white/15 rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${Math.min(100, g.progress)}%` }} />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {coveredBuckets.slice(0, 4).map((t, i) => (
                            <Link
                                key={t.status}
                                href="?tab=collection"
                                className={`group relative aspect-[16/10] rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)]/60 transition-all bg-[var(--bg-elevated)] tp-fade-up tp-d${Math.min(6, i + 1)}`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={t.cover!} alt={t.label} loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-3 flex items-baseline justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: t.color }}>{t.label}</span>
                                    <span className="text-[13px] font-black text-white">{t.count}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
