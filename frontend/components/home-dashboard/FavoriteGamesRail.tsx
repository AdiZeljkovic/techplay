"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Plus } from "lucide-react";
import type { DashboardGameCover } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import AddFavoriteInline from "./AddFavoriteInline";

/**
 * The shelf that says who this gamer is. Empty state is the inline
 * search-and-star picker, so the shelf can be filled without leaving home.
 */
export default function FavoriteGamesRail({
    favorites,
    username,
}: {
    favorites: DashboardGameCover[];
    username: string;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);

    return (
        <Panel
            title="Favorite Games"
            icon={<Star className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={
                favorites.length > 0
                    ? { label: "View all", href: "/profile/me?tab=collection" }
                    : undefined
            }
            bodyClassName="p-4"
        >
            {favorites.length === 0 ? (
                <AddFavoriteInline username={username} />
            ) : pickerOpen ? (
                <AddFavoriteInline username={username} defaultOpen onDismiss={() => setPickerOpen(false)} />
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {favorites.slice(0, 5).map((g) => (
                        <Link
                            key={g.slug}
                            href={`/games/${g.slug}`}
                            prefetch={false}
                            title={g.name}
                            className="group relative aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden bg-[var(--fill-1)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
                        >
                            {g.background_image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={g.background_image}
                                    alt={g.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                                />
                            )}
                            <span aria-hidden className="absolute inset-0 scrim-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="absolute inset-x-0 bottom-0 p-2 text-[10px] font-semibold text-white leading-tight line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {g.name}
                            </span>
                        </Link>
                    ))}
                    {/* the sixth slot invites the next favorite */}
                    <button
                        onClick={() => setPickerOpen(true)}
                        title="Add a favorite"
                        className="group aspect-[3/4] rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] bg-[var(--fill-1)] flex flex-col items-center justify-center gap-1.5 text-[var(--ink-faint)] hover:text-[var(--accent)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
                    </button>
                </div>
            )}
        </Panel>
    );
}
