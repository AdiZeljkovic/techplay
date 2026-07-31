"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gem, Gamepad2, Users } from "lucide-react";
import axios from "@/lib/axios";
import SectionCard from "@/components/profile/dashboard/SectionCard";

interface GemGame {
    slug: string;
    name: string;
    background_image: string | null;
    rating: number;
    released: string | null;
    genres: string[];
    votes: number;
}

const fetcher = () => axios.get("/games/hidden-gems").then((r) => (r.data?.results ?? []) as GemGame[]);

/**
 * Highly rated games hardly anyone has voted on — the kind of pick only a
 * 200K-title database can surface. Rotates once a day (server-side).
 */
export default function HiddenGems() {
    const { data: games } = useSWR("hidden-gems", fetcher, {
        dedupingInterval: 600_000,
        revalidateOnFocus: false,
    });

    if (games && games.length === 0) return null;

    return (
        <SectionCard
            title="Hidden Gems"
            icon={<Gem className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "Browse database", href: "/games" }}
            bodyClassName="space-y-2"
        >
            {!games &&
                [0, 1, 2, 3].map((i) => <div key={i} className="h-[62px] rounded-[var(--radius-card)] bg-[var(--fill-2)] animate-pulse" />)}

            {games?.slice(0, 4).map((g) => (
                <Link
                    key={g.slug}
                    href={`/games/${g.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-3.5 p-2 -mx-2 rounded-xl hover:bg-[var(--fill-1)] transition-colors duration-300"
                >
                    <div className="relative w-[76px] h-[48px] rounded-lg overflow-hidden shrink-0 bg-[var(--fill-1)]">
                        {g.background_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--ink-faint)]"><Gamepad2 className="w-4 h-4" /></div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-display text-[13px] font-bold text-[var(--ink-hi)] line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{g.name}</p>
                        <p className="text-[10px] text-[var(--ink-faint)] line-clamp-1">
                            {g.released ? new Date(g.released).getFullYear() : ""}
                            {g.genres.length ? ` · ${g.genres.join(", ")}` : ""}
                        </p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="font-display text-[15px] font-bold text-[var(--success)] tabular-nums leading-none">{g.rating.toFixed(1)}</p>
                        <p className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[var(--ink-faint)]">
                            <Users className="w-2.5 h-2.5" /> {g.votes}
                        </p>
                    </div>
                </Link>
            ))}
        </SectionCard>
    );
}
