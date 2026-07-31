"use client";

import Link from "next/link";
import { Play, Gamepad2 } from "lucide-react";
import type { PlayingNowGame } from "@/lib/types/profile";
import Panel from "@/components/ui/Panel";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";

/** Compact in-progress list with real progress — the sidebar's anchor. */
export default function CurrentlyPlayingSidebar({ games }: { games: PlayingNowGame[] }) {
    return (
        <Panel
            title="Currently Playing"
            icon={<Play className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={
                games.length > 0
                    ? { label: "View all", href: "/profile/me?tab=collection" }
                    : undefined
            }
            bodyClassName="p-3"
        >
            {games.length === 0 ? (
                <EmptyState
                    variant="compact"
                    title="Nothing in progress"
                    body="Mark a game as Playing and track it from here."
                    action={{ label: "Browse games", href: "/games" }}
                />
            ) : (
                <div className="flex flex-col gap-1">
                    {games.slice(0, 5).map((g) => (
                        <Link
                            key={g.slug}
                            href={`/games/${g.slug}`}
                            prefetch={false}
                            className="group flex items-center gap-3 p-2 rounded-[var(--radius-card)] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300"
                        >
                            <span className="relative w-[58px] h-[38px] shrink-0 rounded-[var(--radius-inner)] overflow-hidden bg-[var(--fill-1)] border border-[var(--line)]">
                                {g.background_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={g.background_image}
                                        alt={g.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                    />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-[var(--ink-faint)]">
                                        <Gamepad2 className="w-4 h-4" />
                                    </span>
                                )}
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-semibold text-[var(--ink-hi)] truncate group-hover:text-[var(--accent)] transition-colors duration-150">
                                    {g.name}
                                </span>
                                <ProgressBar value={g.progress} className="mt-1.5 h-[4px]" />
                                <span className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-[var(--ink-faint)]">
                                    <span>{g.hours_played}h played</span>
                                    <span className="font-display font-bold text-[var(--ink-low)]">{g.progress}%</span>
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </Panel>
    );
}
