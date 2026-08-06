"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { DashboardGameCover } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import AddFavoriteInline from "./AddFavoriteInline";

/** How many covers the shelf shows before the overflow tile takes a slot. */
const SHOWN = 4;

/**
 * The shelf that says who this gamer is — clean portrait covers, art only.
 * The title lives on the cover; hours and progress belong to the Collection
 * tab, not to a shrine. Empty state is the inline search-and-star picker,
 * so the shelf can be filled without leaving home.
 */
export default function FavoriteGamesRail({
    favorites,
    username,
    total,
}: {
    favorites: DashboardGameCover[];
    username: string;
    /** Full favorite count — the rail only carries the first dozen. */
    total?: number;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const count = total ?? favorites.length;
    const shown = favorites.slice(0, SHOWN);
    const overflow = count - shown.length;

    return (
        <Panel
            title="Favorite Games"
            action={favorites.length > 0 ? { label: `View all (${count})`, href: `/profile/${username}?tab=collection` } : undefined}
            className="h-full flex flex-col"
            bodyClassName="p-4 flex-1 flex flex-col"
        >
            {favorites.length === 0 ? (
                <AddFavoriteInline username={username} />
            ) : pickerOpen ? (
                <AddFavoriteInline username={username} defaultOpen onDismiss={() => setPickerOpen(false)} />
            ) : (
                /* Five equal slots across the card's width, centred in its
                   body — the shelf is as wide as the card and as tall as the
                   covers need, never a corner of stamps over empty panel. */
                <div className="flex-1 grid grid-cols-5 gap-2 content-center">
                    {shown.map((g, i) => (
                        <Link
                            key={g.slug}
                            href={`/games/${g.slug}`}
                            prefetch={false}
                            title={g.name}
                            className={`group relative aspect-[3/4] rounded-[10px] overflow-hidden border border-white/[0.07] bg-[var(--fill-1)] hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.5)] transition-all duration-300 tp-fade-up tp-d${Math.min(6, i + 1)}`}
                        >
                            {g.cover_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={g.cover_url}
                                    alt={g.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-[var(--ease-hud)]"
                                />
                            )}
                            <span aria-hidden className="absolute inset-0 scrim-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="absolute inset-x-0 bottom-0 p-2 text-[11px] font-bold text-white leading-tight line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {g.name}
                            </span>
                        </Link>
                    ))}

                    {/* the fifth slot: the rest of the shelf, or room for one more */}
                    {overflow > 0 ? (
                        <Link
                            href={`/profile/${username}?tab=collection`}
                            className="relative aspect-[3/4] rounded-[10px] overflow-hidden border border-white/[0.07] bg-[var(--fill-1)] flex items-center justify-center hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                        >
                            {favorites[SHOWN]?.cover_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={favorites[SHOWN].cover_url!}
                                    alt=""
                                    aria-hidden
                                    className="absolute inset-0 w-full h-full object-cover opacity-25"
                                />
                            )}
                            <span className="relative font-display text-[17px] font-black text-white">+{overflow}</span>
                        </Link>
                    ) : (
                        <button
                            onClick={() => setPickerOpen(true)}
                            title="Add a favorite"
                            className="aspect-[3/4] rounded-[10px] border border-dashed border-white/[0.14] bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 text-white/30 hover:text-[var(--accent)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                        >
                            <Plus className="w-6 h-6" />
                            <span className="font-display text-[9px] font-bold uppercase tracking-[0.1em]">Add</span>
                        </button>
                    )}
                </div>
            )}
        </Panel>
    );
}
