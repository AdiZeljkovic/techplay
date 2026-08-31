"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Flame, Heart, Bell, BellRing, Gamepad2, Loader2, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PlatformIcon, { platformBrandColor } from "@/components/games/PlatformIcon";
import { useReleaseReminder } from "@/hooks/useReleaseReminder";

export interface ReleaseCardGame {
    slug: string;
    name: string;
    released: string | null;
    cover_url: string | null;
    platforms: string[];
    /** How big a release this is across every store we read. */
    added: number;
    wishlists: number;
    wishlisted: boolean;
    reminder: boolean;
}

const MARK_LABELS: Record<string, string> = {
    PC: "PC",
    PLAYSTATION: "PlayStation",
    XBOX: "Xbox",
    NINTENDO: "Nintendo",
};

const MARK_ORDER = ["PC", "PLAYSTATION", "XBOX", "NINTENDO"];

/** Dozens of store platform strings collapse to the four families people name. */
export function platformMarks(platforms: string[]): string[] {
    const found = new Set<string>();

    for (const platform of platforms) {
        const p = platform.toUpperCase();

        if (p.includes("PLAYSTATION") || /^PS\d?\b/.test(p)) found.add("PLAYSTATION");
        else if (p.includes("XBOX")) found.add("XBOX");
        else if (p.includes("SWITCH") || p.includes("NINTENDO")) found.add("NINTENDO");
        else if (p.includes("PC") || p.includes("WINDOWS") || p.includes("LINUX") || p.includes("MAC") || p.includes("STEAM")) found.add("PC");
    }

    return MARK_ORDER.filter((mark) => found.has(mark));
}

export function PlatformMarks({ platforms, className = "w-3.5 h-3.5" }: { platforms: string[]; className?: string }) {
    const marks = platformMarks(platforms);

    if (marks.length === 0) return null;

    return (
        <span className="flex items-center gap-1.5 shrink-0">
            {marks.map((mark) => (
                <span key={mark} title={MARK_LABELS[mark]} style={{ color: platformBrandColor(mark) ?? undefined }}>
                    <PlatformIcon label={mark} className={className} />
                </span>
            ))}
        </span>
    );
}

function compact(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}

/**
 * A game that has not come out yet, as the calendar draws one.
 *
 * Lifted out of CalendarClient so the dashboard's "Upcoming for you" row can
 * be the same object rather than a second interpretation of it. The two were
 * showing the same games in two different shapes on two pages of one site.
 *
 * Nothing but the art is on the art: the date used to sit on the cover in
 * accent red, over whatever the publisher happened to put there, and on half
 * of them it was unreadable. The facts sit underneath.
 */
export default function ReleaseCard({
    game, href, onChanged, className = "",
}: {
    game: ReleaseCardGame;
    /** Where the poster leads — the calendar entry or the game page. */
    href: string;
    onChanged?: () => void;
    /** For the caller's grid — responsive visibility, mostly. */
    className?: string;
}) {
    const { user } = useAuth();
    const [busy, setBusy] = useState<"wishlist" | "reminder" | null>(null);
    // The request, the toast and the failure message live in one place now;
    // this file, CalendarClient and ReleaseClient each had their own copy.
    const { toggle: remind } = useReleaseReminder(game.slug, onChanged);

    const act = async (kind: "wishlist" | "reminder") => {
        if (!user) return toast.error("Sign in to track releases.");
        setBusy(kind);
        try {
            if (kind === "wishlist") {
                await axios.put(`/collection/games/${game.slug}`, { status: "wishlist" });
                toast.success(`${game.name} wishlisted.`);
            } else {
                await remind();
            }
            onChanged?.();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "That didn't work.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className={`group flex flex-col ${className}`}>
            <Link
                href={href}
                prefetch={false}
                aria-label={game.name}
                className="relative block aspect-[3/4] rounded-[12px] overflow-hidden border border-white/[0.07] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
            >
                {game.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.cover_url} alt={game.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                ) : (
                    <span className="w-full h-full flex items-center justify-center bg-white/[0.03] text-white/15"><Gamepad2 className="w-7 h-7" /></span>
                )}
            </Link>

            <p className="mt-2.5 min-h-[30px] font-display text-[12px] font-black text-white leading-[15px] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                {game.name}
            </p>

            <div className="mt-1.5 mb-2.5 flex items-center justify-between gap-2">
                <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/45">
                    {game.released
                        ? new Date(game.released).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                        : "TBA"}
                </span>
                <PlatformMarks platforms={game.platforms} className="w-3.5 h-3.5" />
            </div>

            <div className="mt-auto pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <span className="flex items-center gap-3 font-display text-[10px] font-bold tabular-nums">
                    <span className="inline-flex items-center gap-1 text-[var(--accent)]" title="How big a release this is, across every store we read">
                        <Flame className="w-3 h-3" /> {compact(game.added)}
                    </span>
                    {game.wishlists > 0 && (
                        <span className="inline-flex items-center gap-1 text-pink-400/80" title="Wishlisted on TechPlay">
                            <Heart className="w-3 h-3" /> {compact(game.wishlists)}
                        </span>
                    )}
                </span>

                <span className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => act("wishlist")}
                        disabled={busy !== null || game.wishlisted}
                        title={game.wishlisted ? "Already on your wishlist" : "Add to wishlist"}
                        className={`w-8 h-8 inline-flex items-center justify-center rounded-[7px] transition-colors ${
                            game.wishlisted
                                ? "bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)]"
                                : "bg-[var(--accent)] hover:brightness-110 text-white"
                        }`}
                    >
                        {busy === "wishlist" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : game.wishlisted ? <Check className="w-3.5 h-3.5" />
                            : <Heart className="w-3.5 h-3.5" />}
                    </button>

                    <button
                        onClick={() => act("reminder")}
                        disabled={busy !== null}
                        title={game.reminder ? "We'll tell you when it lands" : "Remind me on release day"}
                        className={`w-8 h-8 rounded-[7px] border flex items-center justify-center transition-colors ${
                            game.reminder
                                ? "border-[var(--accent)]/40 bg-[var(--accent)]/12 text-[var(--accent)]"
                                : "border-white/[0.09] bg-white/[0.04] text-white/35 hover:text-white"
                        }`}
                    >
                        {busy === "reminder" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : game.reminder ? <BellRing className="w-3.5 h-3.5" />
                            : <Bell className="w-3.5 h-3.5" />}
                    </button>
                </span>
            </div>
        </div>
    );
}
