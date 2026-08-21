"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Search, Building2, Loader2, ArrowDownWideNarrow, Check, ChevronDown, MapPin } from "lucide-react";
import DataAttribution from "@/components/games/DataAttribution";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export interface StudioCard {
    name: string;
    slug: string;
    logo_url: string | null;
    country: { code: number; alpha2: string; name: string } | null;
    founded: string | null;
    kind: string | null;
    status: string | null;
    games_count: number;
    developed_count: number;
    published_count: number;
}

export interface Pagination {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

const SORTS = [
    { key: "games", label: "Most games" },
    { key: "name", label: "Name" },
    { key: "founded", label: "Oldest first" },
] as const;

export default function StudiosClient({
    initialStudios,
    initialPagination,
    country,
}: {
    initialStudios: StudioCard[];
    initialPagination: Pagination | null;
    /** Set on /studios/country/[iso], where every filter stays inside it. */
    country?: { iso: string; name: string };
}) {
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [sort, setSort] = useState<string>("games");
    const [page, setPage] = useState(1);
    const [sortOpen, setSortOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebounced(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const query = useMemo(() => {
        const params = new URLSearchParams({ sort, page: String(page) });
        if (debounced) params.set("search", debounced);
        if (country) params.set("country", country.iso);
        return params.toString();
    }, [sort, page, debounced, country]);

    /* The server already fetched exactly this, so the first render reuses it
       rather than asking again the moment the page hydrates. */
    const untouched = sort === "games" && page === 1 && debounced === "";

    const { data, isLoading } = useSWR(untouched ? null : `/studios?${query}`, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
    });

    const studios: StudioCard[] = untouched ? initialStudios : (data?.data ?? []);
    const pagination: Pagination | null = untouched ? initialPagination : (data?.pagination ?? null);
    const busy = !untouched && isLoading;

    return (
        <main className="bg-[var(--surface-0)] min-h-screen">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <header className="mb-8">
                    <p className="font-display text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                        {country ? (
                            <Link href="/studios" className="hover:text-[var(--accent-hover)] transition-colors">
                                Studios
                            </Link>
                        ) : (
                            "Game database"
                        )}
                    </p>
                    <h1 className="mt-2 font-display text-[30px] sm:text-[38px] font-black tracking-tight text-white">
                        {country ? `Studios in ${country.name}` : "Studios"}
                    </h1>
                    <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-white/55">
                        {country
                            ? `Developers and publishers based in ${country.name}, and everything of theirs in the database.`
                            : "The people behind the catalogue — who developed what, who published it, and everything each of them has shipped."}
                        {pagination && (
                            <span className="text-white/40">
                                {" "}
                                {pagination.total.toLocaleString()} studios listed.
                            </span>
                        )}
                    </p>
                </header>

                <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
                    <label className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search studios…"
                            className="w-full h-[42px] pl-9 pr-3 rounded-[10px] bg-white/[0.03] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] transition-colors"
                        />
                    </label>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setSortOpen((v) => !v)}
                            className="h-[42px] w-full sm:w-auto px-3.5 inline-flex items-center justify-between gap-2 rounded-[10px] bg-white/[0.03] border border-white/[0.08] text-[13px] text-white/80 hover:border-white/20 transition-colors"
                        >
                            <span className="inline-flex items-center gap-2">
                                <ArrowDownWideNarrow className="w-4 h-4 text-white/40" />
                                {SORTS.find((s) => s.key === sort)?.label}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                        </button>

                        {sortOpen && (
                            <div className="absolute right-0 z-20 mt-1.5 w-[190px] rounded-[10px] border border-white/[0.09] bg-[var(--surface-2)] p-1 shadow-2xl">
                                {SORTS.map((s) => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() => {
                                            setSort(s.key);
                                            setPage(1);
                                            setSortOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-[7px] text-[13px] text-white/75 hover:bg-white/[0.06] transition-colors"
                                    >
                                        {s.label}
                                        {sort === s.key && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {busy && studios.length === 0 ? (
                    <div className="py-24 flex justify-center">
                        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                    </div>
                ) : studios.length === 0 ? (
                    <p className="py-24 text-center text-[14px] text-white/40">
                        No studios match “{debounced}”.
                    </p>
                ) : (
                    <div
                        className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 transition-opacity ${busy ? "opacity-50" : ""}`}
                    >
                        {studios.map((studio) => (
                            <StudioTile key={studio.slug} studio={studio} />
                        ))}
                    </div>
                )}

                {pagination && pagination.last_page > 1 && (
                    <nav className="mt-8 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-[36px] px-4 rounded-[9px] border border-white/[0.08] bg-white/[0.03] text-[13px] text-white/75 disabled:opacity-30 hover:border-white/20 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-3 font-display text-[12px] tabular-nums text-white/50">
                            {pagination.current_page} / {pagination.last_page.toLocaleString()}
                        </span>
                        <button
                            type="button"
                            disabled={page >= pagination.last_page}
                            onClick={() => setPage((p) => p + 1)}
                            className="h-[36px] px-4 rounded-[9px] border border-white/[0.08] bg-white/[0.03] text-[13px] text-white/75 disabled:opacity-30 hover:border-white/20 transition-colors"
                        >
                            Next
                        </button>
                    </nav>
                )}

                <DataAttribution className="mt-12 border-t border-white/[0.05] pt-5" />
            </div>
        </main>
    );
}

/** Initials, for the three studios in four that have no logo. */
function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("");
}

function StudioTile({ studio }: { studio: StudioCard }) {
    return (
        <Link
            href={`/studios/${studio.slug}`}
            className="group flex flex-col gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-3.5 hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-white/[0.04] transition-colors"
        >
            {/* A light plate under the logo. These are transparent PNGs drawn
                for white backgrounds, so on a dark tile the near-black
                wordmarks — Square Enix, Activision, Hudson Soft — showed as an
                empty square. The initials fallback keeps the page's own colours,
                since nothing is being placed on it. */}
            <span className={`flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-[10px] border ${
                studio.logo_url
                    ? "border-white/[0.10] bg-[#f2f3f5]"
                    : "border-white/[0.07] bg-white/[0.04]"
            }`}>
                {studio.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={studio.logo_url}
                        alt={studio.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-1.5"
                    />
                ) : (
                    <span className="font-display text-[15px] font-black text-white/30">
                        {initials(studio.name) || <Building2 className="h-5 w-5" />}
                    </span>
                )}
            </span>

            <span className="min-w-0">
                <span className="flex items-start gap-2">
                    <span className="block flex-1 font-display text-[13.5px] font-black leading-tight text-white line-clamp-2">
                        {studio.name}
                    </span>
                    {studio.kind === "Solo Dev" && (
                        <span
                            title="One person"
                            className="mt-0.5 inline-flex h-[17px] shrink-0 items-center rounded-[4px] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] px-1.5 font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-[var(--accent)]"
                        >
                            Solo
                        </span>
                    )}
                </span>

                {/* The split, not just the total. A studio with 400 published
                    and 3 developed is a publisher, and "403 games" says neither.
                    Only shown where both sides exist — a line of zeroes is
                    noise. */}
                <span className="mt-1.5 block text-[11.5px] tabular-nums text-white/45">
                    {studio.developed_count > 0 && studio.published_count > 0 ? (
                        <>
                            {studio.developed_count.toLocaleString()} made
                            <span className="mx-1 text-white/20">·</span>
                            {studio.published_count.toLocaleString()} published
                        </>
                    ) : (
                        <>{studio.games_count.toLocaleString()} {studio.games_count === 1 ? "game" : "games"}</>
                    )}
                </span>

                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/30">
                    {studio.country && (
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-white/20" />
                            {studio.country.name}
                        </span>
                    )}
                    {studio.founded && <span className="tabular-nums">since {studio.founded}</span>}
                    {studio.status && studio.status !== "active" && (
                        <span className="text-white/40">
                            {studio.status === "defunct" ? "closed" : studio.status}
                        </span>
                    )}
                </span>
            </span>
        </Link>
    );
}
