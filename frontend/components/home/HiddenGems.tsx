import Link from "next/link";
import { Gamepad2, Users } from "lucide-react";
import Panel from "@/components/ui/Panel";
import ScoreBadge from "@/components/ui/ScoreBadge";

export interface GemGame {
    slug: string;
    name: string;
    cover_url: string | null;
    rating: number;
    released: string | null;
    genres: string[];
    votes: number;
}

/**
 * Highly rated games hardly anyone has voted on — the kind of pick only a
 * 200K-title database can surface. Rotates once a day (server-side).
 *
 * A server component. It used to fetch through SWR, which meant the section
 * did not exist until the page had shipped its JavaScript, hydrated, and made
 * a round trip — for a list that changes once a day. The page fetches it now.
 */
export default function HiddenGems({ games }: { games: GemGame[] }) {
    if (games.length === 0) return null;

    return (
        <Panel
            title="Hidden Gems"
            action={{ label: "Browse database", href: "/games" }}
            className="h-full"
            bodyClassName="p-4"
        >
            <p className="text-[11px] text-[var(--ink-low)] mb-3.5">
                Brilliantly rated. Almost nobody has played them.
            </p>

            <div className="grid grid-cols-2 gap-3">
                {games.slice(0, 4).map((g) => (
                    <Link
                        key={g.slug}
                        href={`/games/${g.slug}`}
                        prefetch={false}
                        className="group flex flex-col rounded-[var(--radius-card)] overflow-hidden bg-[var(--surface-2)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all duration-300"
                    >
                        {/* clean artwork */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--fill-1)]">
                            {g.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={g.cover_url}
                                    alt={g.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-[var(--ink-faint)]">
                                    <Gamepad2 className="w-6 h-6" />
                                </span>
                            )}
                            {/* rarity stamp — the whole point of the section */}
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 h-5 px-1.5 rounded bg-[var(--surface-0)]/85 backdrop-blur-md border border-[var(--line-strong)] text-[9px] font-bold uppercase tracking-wider text-[var(--ink-mid)]">
                                <Users className="w-2.5 h-2.5" />
                                {g.votes} {g.votes === 1 ? "vote" : "votes"}
                            </span>
                        </div>

                        {/* accent seam draws in on hover */}
                        <span aria-hidden className="h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]" />

                        <div className="flex-1 flex flex-col justify-between gap-2 p-3">
                            <p className="font-display text-[12px] font-bold text-[var(--ink-hi)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors duration-300">
                                {g.name}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)] truncate">
                                    {[g.released ? new Date(g.released).getFullYear() : null, g.genres[0]].filter(Boolean).join(" · ")}
                                </span>
                                <ScoreBadge score={g.rating} className="shrink-0 scale-90 origin-right" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </Panel>
    );
}
