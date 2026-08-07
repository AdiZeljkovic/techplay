"use client";

import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Search, X, Package } from "lucide-react";
import type { Gta6Entity } from "@/types";
import Gta6EntityCard from "./Gta6EntityCard";

const fetcher = (url: string) => axios.get(url).then(r => r.data?.data ?? []);

function cap(s?: string | null): string {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function subtitleFor(section: string, e: Gta6Entity): string | null {
    if (section === "characters") return e.role ? cap(e.role) : null;
    if (section === "vehicles")   return e.vehicle_class ?? null;
    if (section === "weapons")    return e.weapon_type ?? null;
    return null;
}

interface Props {
    section: "characters" | "vehicles" | "weapons";
    basePath: string;         // /gta6/characters
    apiPath: string;          // /gta6/characters
    filterParam?: string;     // role | class | type
    filterLabel?: string;     // "Role" | "Class" | "Type"
    filterOptions?: string[];
    emptyTitle: string;
    emptyHint: string;
    linkable?: boolean;       // false = showcase cards without detail links
    initialItems?: Gta6Entity[]; // SSR-fetched list so content is in the HTML for crawlers
}

export default function Gta6EntityGrid({
    section, basePath, apiPath, filterParam, filterLabel, filterOptions = [], emptyTitle, emptyHint, linkable = true, initialItems,
}: Props) {
    const [search, setSearch]             = useState("");
    const [debounced, setDebounced]       = useState("");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleSearch = useCallback((val: string) => {
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebounced(val), 400);
    }, []);

    const params = new URLSearchParams();
    if (debounced)                                params.set("search", debounced);
    if (filterParam && activeFilter !== "all")    params.set(filterParam, activeFilter);
    const url = `${apiPath}?${params.toString()}`;

    const { data: items = [], isLoading } = useSWR<Gta6Entity[]>(url, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        fallbackData: initialItems,
    });

    return (
        <div>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="relative sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-full bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-card)] pl-9 pr-8 py-2 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-[var(--gta-pink)]/50 transition-colors"
                    />
                    {search && (
                        <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {filterParam && filterOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setActiveFilter("all")}
                            className={`px-2.5 py-1 rounded-[var(--radius-inner)] text-[11px] font-semibold transition-all ${
                                activeFilter === "all"
                                    ? "bg-[var(--gta-pink)] text-white"
                                    : "bg-[var(--surface-1)] border border-white/[0.07] text-white/35 hover:text-white hover:border-[var(--gta-pink)]/30"
                            }`}
                        >
                            All {filterLabel}
                        </button>
                        {filterOptions.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setActiveFilter(a => a === opt ? "all" : opt)}
                                className={`px-2.5 py-1 rounded-[var(--radius-inner)] text-[11px] font-semibold capitalize transition-all ${
                                    activeFilter === opt
                                        ? "bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/50 text-[var(--gta-pink)]"
                                        : "bg-[var(--surface-1)] border border-white/[0.07] text-white/35 hover:text-white hover:border-white/20"
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-card)] overflow-hidden">
                            <div className="aspect-[4/3] bg-[var(--surface-2)] animate-pulse" />
                            <div className="p-4"><div className="h-4 bg-white/[0.07] rounded animate-pulse" /></div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <Package className="w-10 h-10 mx-auto mb-4 text-[#2A2F38]" />
                    <p className="text-white font-bold text-[16px] mb-1">{emptyTitle}</p>
                    <p className="text-white/35 text-[13px] max-w-md mx-auto">{emptyHint}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map(e => (
                        <Gta6EntityCard key={e.id} entity={e} basePath={basePath} subtitle={subtitleFor(section, e)} linkable={linkable} />
                    ))}
                </div>
            )}
        </div>
    );
}
