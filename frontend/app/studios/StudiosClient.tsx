"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Search, Building2, Loader2, ArrowDownWideNarrow, Check, ChevronDown, MapPin, X } from "lucide-react";
import DataAttribution from "@/components/games/DataAttribution";
import { usePagedList } from "@/hooks/usePagedList";

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

/**
 * The six countries that hold most of the catalogue, in the order they hold it:
 * 4,178 companies in the United States, 2,146 in Japan, 1,557 in the UK, 994 in
 * Germany, 952 in France, 869 in Canada.
 */
const COUNTRIES = [
    { label: "United States", iso: "US" },
    { label: "Japan", iso: "JP" },
    { label: "United Kingdom", iso: "GB" },
    { label: "Germany", iso: "DE" },
    { label: "France", iso: "FR" },
    { label: "Canada", iso: "CA" },
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
    /** The pager sits under the grid; a new page starts at its top. */
    const { ref: listTop, scrollToTop } = usePagedList<HTMLDivElement>();

    const goToPage = (next: number) => {
        setPage(next);
        scrollToTop();
    };
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
            {/* ── hero ──────────────────────────────────────────────────────

                The games database's own treatment, down to the backdrop: the
                two sections sit next to each other in the bar and led to two
                different-looking places. Centred title, the search under it,
                and the ways in below that. */}
            <section className="relative overflow-hidden border-b border-white/[0.07]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/page-hero.webp"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_45%,rgba(5,7,10,0.82),rgba(5,7,10,0.55)_72%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-5 md:py-12 text-center">
                    <h1 className="font-display font-black tracking-tight text-[28px] md:text-[58px] leading-none">
                        {country ? (
                            <>
                                <span className="text-white">STUDIOS IN </span>
                                <span className="text-[var(--accent)]">{country.name.toUpperCase()}</span>
                            </>
                        ) : (
                            <>
                                <span className="text-white">GAME </span>
                                <span className="text-[var(--accent)]">STUDIOS</span>
                            </>
                        )}
                    </h1>

                    <p className="hidden md:block mt-3 max-w-[720px] mx-auto text-[13px] text-white/45">
                        {country
                            ? `Developers and publishers based in ${country.name}, and everything of theirs in the database.`
                            : pagination
                                ? `The people behind the catalogue — ${pagination.total.toLocaleString()} studios, and everything each of them has shipped.`
                                : "The people behind the catalogue — who developed what, who published it, and everything each of them has shipped."}
                    </p>

                    <div className="mt-4 md:mt-6 max-w-[640px] mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--ink-faint)] group-focus-within:text-[var(--accent)] transition-colors" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search studios and publishers…"
                            className="w-full h-12 pl-11 pr-10 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line-strong)] text-[13.5px] text-white placeholder:text-[var(--ink-faint)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:ring-1 focus:ring-[var(--accent-soft)] transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* The ways in. Six countries hold most of the catalogue —
                        4,178 companies in the United States, 2,146 in Japan —
                        so they are the shortcuts, the way platforms are on the
                        games hub. */}
                    <div className="mt-4 md:mt-6 flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-2 md:gap-2.5 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide snap-x scroll-pl-4 md:scroll-pl-0">
                        {COUNTRIES.map((c) => {
                            const on = country?.iso === c.iso.toLowerCase();

                            return (
                                <Link
                                    key={c.iso}
                                    href={on ? "/studios" : `/studios/country/${c.iso.toLowerCase()}`}
                                    className={`snap-start shrink-0 inline-flex h-[38px] items-center gap-2 rounded-full border px-4 font-display text-[11px] font-black uppercase tracking-[0.1em] transition-colors ${
                                        on
                                            ? "border-transparent bg-[var(--accent)] text-white"
                                            : "border-white/[0.10] bg-black/40 text-white/70 hover:border-white/25 hover:text-white"
                                    }`}
                                >
                                    <MapPin className={`h-3.5 w-3.5 ${on ? "text-white" : "text-white/35"}`} />
                                    {c.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <div className="container-page py-6">
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2.5 mb-6">
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
                        ref={listTop}
                        /* `items-stretch` is the default and is what makes the
                           figures line up along the bottom of every card in a
                           row — without equal heights the last row sat short
                           and the footers stepped. */
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 transition-opacity ${busy ? "opacity-50" : ""}`}
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
                            onClick={() => goToPage(Math.max(1, page - 1))}
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
                            onClick={() => goToPage(page + 1)}
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

/**
 * One studio, as a card worth clicking.
 *
 * It was a small logo with three lines of grey text beside it, and the two
 * numbers that make a studio interesting — what it made against what it put
 * out — were set as a footnote. They lead now: a publisher with 400 published
 * and 10 developed is a different thing from a studio with 400 developed, and
 * the card should say which one you are looking at before you read a word.
 */
function StudioTile({ studio }: { studio: StudioCard }) {
    const split = studio.developed_count > 0 && studio.published_count > 0;
    const ended = studio.status && studio.status !== "active";

    return (
        <Link
            href={`/studios/${studio.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-[12px] border border-white/[0.07] bg-[var(--surface-1)] transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
        >
            {/* A glow that arrives on hover, from the corner the eye starts in.
                The card is a link and looked like a paragraph. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "radial-gradient(80% 120% at 0% 0%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 62%)" }}
            />

            <span className="relative flex items-start gap-3 p-3.5">
                {/* A light plate under the logo. These are transparent PNGs
                    drawn for white backgrounds, so on a dark tile the near-black
                    wordmarks — Square Enix, Activision, Hudson Soft — showed as
                    an empty square. The initials fallback keeps the page's own
                    colours, since nothing is being placed on it. */}
                <span className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border transition-transform duration-300 group-hover:scale-[1.04] ${
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

                <span className="min-w-0 flex-1">
                    <span className="block font-display text-[13.5px] font-black leading-tight text-white line-clamp-2 group-hover:text-[var(--accent-ink)] transition-colors">
                        {studio.name}
                    </span>

                    <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/50">
                        {studio.country && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-white/20" />
                                {studio.country.name}
                            </span>
                        )}
                        {studio.founded && <span className="tabular-nums">since {studio.founded}</span>}
                    </span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1">
                    {studio.kind === "Solo Dev" && (
                        <span
                            title="One person"
                            className="inline-flex h-[17px] items-center rounded-[4px] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] px-1.5 font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-[var(--accent)]"
                        >
                            Solo
                        </span>
                    )}
                    {ended && (
                        <span className="inline-flex h-[17px] items-center rounded-[4px] border border-white/[0.12] bg-white/[0.04] px-1.5 font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-white/45">
                            {studio.status === "defunct" ? "Closed" : studio.status}
                        </span>
                    )}
                </span>
            </span>

            {/* The figures, on their own ground at the foot of the card. Two
                numbers with their words under them read as a fact; the same two
                run together in a grey sentence read as a caption. */}
            <span className="relative mt-auto flex items-stretch border-t border-white/[0.06] bg-black/25">
                {split ? (
                    <>
                        <Figure value={studio.developed_count} label="Developed" />
                        <span aria-hidden className="w-px bg-white/[0.06]" />
                        <Figure value={studio.published_count} label="Published" />
                    </>
                ) : (
                    <Figure value={studio.games_count} label={studio.games_count === 1 ? "Game" : "Games"} />
                )}
            </span>
        </Link>
    );
}

function Figure({ value, label }: { value: number; label: string }) {
    return (
        <span className="flex-1 px-3.5 py-2.5">
            <span className="block font-display text-[16px] font-black leading-none tabular-nums text-white">
                {value.toLocaleString()}
            </span>
            <span className="mt-1 block font-display text-[8.5px] font-black uppercase tracking-[0.12em] text-white/50">
                {label}
            </span>
        </span>
    );
}
