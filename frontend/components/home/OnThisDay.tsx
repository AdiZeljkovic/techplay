"use client";

import Link from "next/link";
import useSWR from "swr";
import { CakeSlice, Gamepad2 } from "lucide-react";
import axios from "@/lib/axios";
import SectionCard from "@/components/profile/dashboard/SectionCard";

interface AnniversaryGame {
    slug: string;
    name: string;
    background_image: string | null;
    rating: number;
    released: string | null;
    genres: string[];
    years_ago: number;
}

const fetcher = () =>
    axios.get("/games/on-this-day").then((r) => ({
        results: (r.data?.results ?? []) as AnniversaryGame[],
        date: r.data?.date as string | undefined,
    }));

/** Games that launched on today's date in earlier years. */
export default function OnThisDay() {
    const { data } = useSWR("on-this-day", fetcher, {
        dedupingInterval: 600_000,
        revalidateOnFocus: false,
    });

    const games = data?.results;
    if (games && games.length === 0) return null;

    return (
        <SectionCard
            title="On This Day"
            icon={<CakeSlice className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "Release calendar", href: "/calendar" }}
            bodyClassName="space-y-2"
        >
            {data?.date && (
                <p className="text-[11px] text-white/40 -mt-1 mb-2.5">
                    Games that launched on {data.date}
                </p>
            )}

            {!games &&
                [0, 1, 2, 3].map((i) => <div key={i} className="h-[62px] rounded-xl bg-white/5 animate-pulse" />)}

            {games?.slice(0, 4).map((g) => (
                <Link
                    key={g.slug}
                    href={`/games/${g.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-3.5 p-2 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                    <div className="relative w-[76px] h-[48px] rounded-lg overflow-hidden shrink-0 bg-white/5">
                        {g.background_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.background_image} alt={g.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-4 h-4" /></div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{g.name}</p>
                        <p className="text-[10px] text-white/35 line-clamp-1">{g.genres.join(", ")}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-center">
                        <span className="block text-[13px] font-black text-[var(--accent)] leading-none tabular-nums">{g.years_ago}</span>
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--accent)]/70 mt-0.5">
                            {g.years_ago === 1 ? "year" : "years"}
                        </span>
                    </span>
                </Link>
            ))}
        </SectionCard>
    );
}
