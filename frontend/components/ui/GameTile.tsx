"use client";

import Link from "next/link";
import { Gamepad2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** The one status palette. Every shelf, rail and showcase reads from it. */
export const STATUS_TONE: Record<string, string> = {
    playing: "#34d399",
    completed: "#22c55e",
    backlog: "#60a5fa",
    wishlist: "#f472b6",
    dropped: "#9ca3af",
    favorite: "#facc15",
};

interface GameTileProps {
    name: string;
    slug?: string | null;
    coverUrl?: string | null;
    /** Paints the top edge. The shelf's own language, everywhere else too. */
    status?: string | null;
    /** A short line under the name — platform, hours, progress. */
    meta?: string | null;
    /** Corner marks: a pin, a favourite star, a source badge. */
    badges?: ReactNode;
    /** Bottom-left overlay on the art — a rank number on a ranked list. */
    rank?: number;
    ratio?: "cover" | "wide";
    className?: string;
}

/**
 * One treatment for game art, for the whole site.
 *
 * Continue Playing cropped its art flat with the title underneath. The
 * favourites rail drew a bare square. The shelf had a good card with a status
 * stripe and a scrim, and nothing else borrowed from it. Three treatments of
 * the same object on one screen is what made the profile feel unfinished even
 * where each piece was fine on its own.
 *
 * The scrim is doing real work, not decoration: cover art is designed to be
 * loud, and white text over an unpredictable image is unreadable roughly half
 * the time. A gradient to the panel's own colour gives the name a floor to
 * stand on without hiding the art.
 */
export default function GameTile({
    name, slug, coverUrl, status, meta, badges, rank, ratio = "cover", className = "",
}: GameTileProps) {
    const tone = status ? STATUS_TONE[status] : null;

    const body = (
        <>
            <span className={cn("relative block w-full overflow-hidden bg-[var(--fill-1)]", ratio === "cover" ? "aspect-[3/4]" : "aspect-[16/9]")}>
                {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={coverUrl}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-[var(--ease-hud)] group-hover/tile:scale-[1.05]"
                    />
                ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-white/12">
                        <Gamepad2 className="w-7 h-7" />
                    </span>
                )}

                {/* The floor the name stands on. */}
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--surface-1)] via-[var(--surface-1)]/65 to-transparent" />

                {tone && <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: tone }} />}

                {typeof rank === "number" && (
                    <span className="absolute left-2 top-2 min-w-[26px] h-[26px] px-1.5 rounded-[var(--radius-inner)] bg-black/70 backdrop-blur-sm flex items-center justify-center font-display text-[12px] font-black tabular-nums text-white">
                        {rank}
                    </span>
                )}

                {badges && <span className="absolute right-2 top-2 flex items-center gap-1">{badges}</span>}

                {/* A corner bracket on hover — the HUD language the notched
                    button already speaks, in the one place art can carry it. */}
                <span
                    aria-hidden
                    className="absolute right-1.5 bottom-1.5 w-4 h-4 border-b-2 border-r-2 border-[var(--accent)] opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300"
                />
            </span>

            <span className="block px-2.5 py-2">
                <span className="block font-display text-[12px] font-bold text-white leading-tight line-clamp-1 group-hover/tile:text-[var(--accent-ink)] transition-colors duration-300">
                    {name}
                </span>
                {meta && <span className="mt-0.5 block text-[10.5px] tabular-nums text-white/50 line-clamp-1">{meta}</span>}
            </span>
        </>
    );

    const shell = cn(
        "group/tile block rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)] bg-[var(--surface-1)]",
        "hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300",
        className,
    );

    return slug ? <Link href={`/games/${slug}`} className={shell}>{body}</Link> : <span className={shell}>{body}</span>;
}

/**
 * A place for a tile that is not filled yet.
 *
 * A dashed square with a plus in it was the weakest thing on the profile, and
 * it sat directly beside the showcase — the one part of the page meant to
 * impress. This is the same silhouette as a tile with its corner cut away, so
 * an empty showcase reads as a rack with room in it rather than as something
 * that failed to load.
 */
export function EmptySlot({
    label = "Add", onClick, href, ratio = "cover", className = "",
}: {
    label?: string;
    onClick?: () => void;
    href?: string;
    ratio?: "cover" | "wide";
    className?: string;
}) {
    const inner = (
        <>
            <span
                aria-hidden
                className="absolute inset-0 opacity-[0.5]"
                style={{
                    backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 6px, transparent 6px 12px)",
                }}
            />
            <span className="relative flex flex-col items-center gap-1.5 text-white/25 group-hover/slot:text-[var(--accent-ink)] transition-colors duration-300">
                <Plus className="w-5 h-5" />
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.18em]">{label}</span>
            </span>
        </>
    );

    const shell = cn(
        "group/slot relative flex items-center justify-center w-full overflow-hidden",
        "border border-[var(--line-strong)] bg-[var(--fill-1)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300",
        ratio === "cover" ? "aspect-[3/4]" : "aspect-[16/9]",
        // The cut corner — a slot, not a box.
        "[clip-path:polygon(0_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%)]",
        className,
    );

    if (href) return <Link href={href} className={shell}>{inner}</Link>;

    return <button type="button" onClick={onClick} className={shell}>{inner}</button>;
}
