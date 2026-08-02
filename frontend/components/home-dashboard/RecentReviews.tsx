"use client";

import Link from "next/link";
import { PenLine, Gamepad2 } from "lucide-react";
import type { DashboardReview } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import { timeAgo } from "@/lib/timeAgo";
import EmptyState from "@/components/ui/EmptyState";
import ScoreBadge from "@/components/ui/ScoreBadge";

/** The user's published verdicts, with their words — not just numbers. */
export default function RecentReviews({ reviews }: { reviews: DashboardReview[] }) {
    return (
        <Panel
            title="Recent Reviews"
            icon={<PenLine className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={
                reviews.length > 0
                    ? { label: "All activity", href: "/profile/me?tab=activity" }
                    : undefined
            }
            bodyClassName="p-4"
        >
            {reviews.length === 0 ? (
                <EmptyState
                    variant="compact"
                    title="No reviews published yet"
                    body="Played something worth talking about? Rate it — your verdicts show up here."
                    action={{ label: "Rate a game", href: "/profile/me?tab=collection" }}
                />
            ) : (
                <div className="flex flex-col divide-y divide-white/[0.07]">
                    {reviews.map((r) => (
                        <Link
                            key={r.id}
                            href={`/games/${r.game.slug}`}
                            prefetch={false}
                            className="group flex gap-3.5 py-3.5 first:pt-0 last:pb-0"
                        >
                            <span className="relative w-[76px] h-[48px] shrink-0 rounded-[var(--radius-inner)] overflow-hidden bg-[var(--fill-1)] border border-[var(--line)]">
                                {r.game.background_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={r.game.background_image}
                                        alt={r.game.name}
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
                                <span className="flex items-center justify-between gap-3">
                                    <span className="font-display text-[13px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors duration-300">
                                        {r.game.name}
                                    </span>
                                    <ScoreBadge score={r.rating * 2} className="shrink-0 scale-90 origin-right" />
                                </span>
                                {r.excerpt && (
                                    <span className="block mt-1 text-[12px] text-[var(--ink-low)] leading-relaxed line-clamp-2">
                                        &ldquo;{r.excerpt}&rdquo;
                                    </span>
                                )}
                                <span className="block mt-1 text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">
                                    {timeAgo(r.created_at)}
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </Panel>
    );
}
