"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2, X } from "lucide-react";
import { TIERS, type GameListItemEntry, type Tier } from "@/lib/types/profile";

/**
 * A tier list, drawn as a board.
 *
 * A ranking answers "which is first". A tier list answers "which of these are
 * the same" — four games can share S and be equally S, which a numbered order
 * cannot express. So the row is the unit here, not the position, and the
 * letters are fixed: S above A is the Japanese 秀 sitting above a report card,
 * and it is the only reason a stranger can read someone else's board at a
 * glance.
 *
 * Cover art is the card, because a board of covers is scannable and a board of
 * titles is a spreadsheet.
 *
 * Placing works two ways on purpose. Dragging is what a tier list maker is,
 * and it is also the interaction that fails hardest on a phone — where these
 * get made and shared most. So every card also opens a row of letters on tap.
 */

/** Hot at the top, cold at the bottom — the gradient the format has always used. */
const TIER_TONE: Record<Tier, { bar: string; text: string }> = {
    S: { bar: "#B3213B", text: "#FFE3E8" },
    A: { bar: "#C25A1F", text: "#FFEBDC" },
    B: { bar: "#B08312", text: "#FFF6DC" },
    C: { bar: "#3F7D3A", text: "#E4F6E2" },
    D: { bar: "#2C5F8A", text: "#DFEDF8" },
    F: { bar: "#4A4A55", text: "#E6E6EC" },
};

/** An item whose game survived — the board never draws a row with nothing in it. */
type PlacedEntry = GameListItemEntry & { game: NonNullable<GameListItemEntry["game"]> };

function Card({
    entry,
    editable,
    onAssign,
    onRemove,
}: {
    entry: PlacedEntry;
    editable: boolean;
    onAssign?: (itemId: number, tier: Tier | null) => void;
    onRemove?: (itemId: number) => void;
}) {
    const [picking, setPicking] = useState(false);
    const cover = entry.game.cover_url;

    const art = (
        <>
            {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={cover}
                    alt={entry.game.name}
                    loading="lazy"
                    draggable={false}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="w-full h-full flex items-center justify-center bg-[var(--fill-1)]">
                    <Gamepad2 className="w-4 h-4 text-[var(--ink-faint)]" />
                </span>
            )}

            {/* The title lives under a scrim rather than beside the card: a row
                of forty games has no room for labels, and a board people cannot
                read is a wall of thumbnails. */}
            <span className="absolute inset-x-0 bottom-0 px-1 pt-3 pb-1 bg-gradient-to-t from-black/90 to-transparent">
                <span className="block text-[8.5px] leading-tight font-semibold text-white/90 line-clamp-2">
                    {entry.game.name}
                </span>
            </span>
        </>
    );

    const shell =
        "group/card relative w-[64px] h-[86px] shrink-0 rounded-[6px] overflow-hidden border border-white/[0.1] bg-[var(--surface-2)]";

    if (!editable) {
        return (
            <Link href={`/games/${entry.game.slug}`} prefetch={false} className={`${shell} hover:border-[var(--accent)] transition-colors`}>
                {art}
            </Link>
        );
    }

    return (
        <span className="relative">
            <button
                type="button"
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", String(entry.id));
                    e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => setPicking((v) => !v)}
                aria-label={`Place ${entry.game.name}`}
                aria-expanded={picking}
                className={`${shell} cursor-grab active:cursor-grabbing hover:border-[var(--accent)] transition-colors`}
            >
                {art}
            </button>

            {onRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    aria-label={`Remove ${entry.game.name}`}
                    className="absolute -top-1.5 -right-1.5 z-10 w-[18px] h-[18px] rounded-full bg-[var(--surface-0)] border border-white/[0.15] flex items-center justify-center text-white/50 opacity-0 group-hover/card:opacity-100 focus:opacity-100 hover:text-red-400 transition-[opacity,color]"
                >
                    <X className="w-2.5 h-2.5" />
                </button>
            )}

            {/* The phone path. Same choice as the drag, one tap instead. */}
            {picking && (
                <span className="absolute z-30 top-full left-0 mt-1 flex items-center gap-1 p-1 rounded-[8px] border border-white/[0.12] bg-[var(--surface-2)] shadow-[0_14px_34px_rgba(0,0,0,0.7)]">
                    {TIERS.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => { onAssign?.(entry.id, t); setPicking(false); }}
                            className="w-6 h-6 rounded-[5px] font-display text-[11px] font-black transition-transform hover:scale-110"
                            style={{ background: TIER_TONE[t].bar, color: TIER_TONE[t].text }}
                        >
                            {t}
                        </button>
                    ))}
                    {entry.tier && (
                        <button
                            type="button"
                            onClick={() => { onAssign?.(entry.id, null); setPicking(false); }}
                            title="Back to unranked"
                            className="w-6 h-6 rounded-[5px] bg-white/[0.07] text-white/50 flex items-center justify-center hover:text-white transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </span>
            )}
        </span>
    );
}

export default function TierBoard({
    items,
    editable = false,
    onAssign,
    onRemove,
}: {
    items: GameListItemEntry[];
    editable?: boolean;
    onAssign?: (itemId: number, tier: Tier | null) => void;
    onRemove?: (itemId: number) => void;
}) {
    const [over, setOver] = useState<Tier | "tray" | null>(null);

    // A game deleted from the catalogue leaves its row behind. There is no
    // card to draw for it, so it does not reach the board.
    const placed = items.filter((i): i is PlacedEntry => Boolean(i.game));

    const byTier = (t: Tier) =>
        placed.filter((i) => i.tier === t).sort((a, b) => a.position - b.position);
    const unranked = placed.filter((i) => !i.tier).sort((a, b) => a.position - b.position);

    const drop = (e: React.DragEvent, tier: Tier | null) => {
        e.preventDefault();
        setOver(null);

        const id = Number(e.dataTransfer.getData("text/plain"));
        if (id) onAssign?.(id, tier);
    };

    const dropProps = (tier: Tier | null, key: Tier | "tray") =>
        editable
            ? {
                onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(key); },
                onDragLeave: () => setOver((o) => (o === key ? null : o)),
                onDrop: (e: React.DragEvent) => drop(e, tier),
            }
            : {};

    return (
        <div className="space-y-4">
            <div className="rounded-[12px] border border-white/[0.08] overflow-hidden">
                {TIERS.map((t) => {
                    const row = byTier(t);
                    const tone = TIER_TONE[t];

                    return (
                        <div key={t} className="flex items-stretch border-b border-white/[0.06] last:border-0">
                            <span
                                className="w-[52px] md:w-[62px] shrink-0 flex items-center justify-center font-display text-[22px] md:text-[26px] font-black"
                                style={{ background: tone.bar, color: tone.text }}
                            >
                                {t}
                            </span>

                            <div
                                {...dropProps(t, t)}
                                className={`flex-1 min-h-[96px] flex flex-wrap items-start content-start gap-1.5 p-2 transition-colors ${
                                    over === t ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]" : "bg-white/[0.015]"
                                }`}
                            >
                                {row.map((entry) => (
                                    <Card
                                        key={entry.id}
                                        entry={entry}
                                        editable={editable}
                                        onAssign={onAssign}
                                        onRemove={onRemove}
                                    />
                                ))}

                                {/* An empty rung is a statement — nothing here is
                                    this good, or this bad — so it stays drawn. */}
                                {row.length === 0 && (
                                    <span className="self-center text-[11px] text-white/15 pl-1">
                                        {editable ? "Drop a game here" : "—"}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {(editable || unranked.length > 0) && (
                <div
                    {...dropProps(null, "tray")}
                    className={`rounded-[12px] border border-dashed p-3 transition-colors ${
                        over === "tray"
                            ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                            : "border-white/[0.1]"
                    }`}
                >
                    <p className="mb-2 font-display text-[9.5px] font-black uppercase tracking-[0.16em] text-white/35">
                        Unranked · {unranked.length}
                    </p>

                    {unranked.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {unranked.map((entry) => (
                                <Card
                                    key={entry.id}
                                    entry={entry}
                                    editable={editable}
                                    onAssign={onAssign}
                                    onRemove={onRemove}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-[11.5px] text-white/25">
                            Every game on the board has a tier.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
