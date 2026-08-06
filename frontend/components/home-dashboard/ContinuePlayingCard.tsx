"use client";

import Link from "next/link";
import { Play, Gamepad2 } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import type { PlayingNowGame } from "@/lib/types/profile";

/**
 * The first column of the row under the tabs: the game you're in the middle
 * of, art-first, with one hot button. The rest of the Playing list lives in
 * the Collection tab — this card is about lowering the cost of coming back.
 */
export default function ContinuePlayingCard({ games }: { games: PlayingNowGame[] }) {
    const game = games[0];

    // Playtime is only ever as good as the signal behind it — say what we
    // know, never a confident zero.
    const sub =
        game?.playtime_source && game.hours_played > 0
            ? `${game.hours_played}h played${game.progress > 0 ? ` · ${game.progress}%` : ""}`
            : "Ready when you are";

    return (
        <Panel title="Continue Playing" padding="none" className="h-full flex flex-col" bodyClassName="flex-1 flex flex-col">
            {!game ? (
                <div className="flex-1 flex p-4">
                    <EmptyState
                        icon={<Gamepad2 className="w-[18px] h-[18px]" />}
                        title="Nothing in progress"
                        body="Mark a game as Playing and it takes this spot — one click back into it."
                        action={{ label: "Browse games", href: "/games" }}
                    />
                </div>
            ) : (
                <>
                    {/* A fixed art height keeps the whole row short — left to
                        stretch, this card sets the height for two others that
                        have nothing to fill it with. */}
                    <Link href={`/games/${game.slug}`} prefetch={false} className="group relative h-[142px] block overflow-hidden">
                        {game.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={game.cover_url}
                                alt={game.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-[var(--ease-hud)]"
                            />
                        ) : (
                            <span className="absolute inset-0 flex items-center justify-center bg-[var(--fill-1)]">
                                <Gamepad2 className="w-10 h-10 text-[var(--ink-faint)]" />
                            </span>
                        )}
                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                    </Link>

                    <div className="flex-1 flex items-center justify-between gap-3 px-4 py-3.5 border-t border-white/[0.06]">
                        <div className="min-w-0">
                            <Link
                                href={`/games/${game.slug}`}
                                prefetch={false}
                                className="block font-display text-[14px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors duration-200"
                            >
                                {game.name}
                            </Link>
                            <p className="mt-0.5 text-[11px] text-white/40 tabular-nums truncate">{sub}</p>
                        </div>

                        <Link
                            href={`/games/${game.slug}`}
                            prefetch={false}
                            className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-[8px] bg-[var(--accent)] text-white font-display text-[11.5px] font-bold uppercase tracking-[0.08em] hover:brightness-110 transition-[filter] duration-200"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" /> Resume game
                        </Link>
                    </div>
                </>
            )}
        </Panel>
    );
}
