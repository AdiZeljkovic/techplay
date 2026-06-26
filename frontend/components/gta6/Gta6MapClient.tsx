"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import type { Gta6Location } from "@/types";
import { getCategoryColor, getCategoryLabel } from "./gta6Utils";

// Single dynamic import for the entire Leaflet map — SSR disabled
const Gta6LeafletMap = dynamic(() => import("./Gta6LeafletMap"), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex items-center justify-center bg-[#05070A]">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[#71717A] text-[13px]">Loading map...</p>
            </div>
        </div>
    ),
});

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    hotel:          { label: "Hotel",          color: "#3B82F6" },
    residential:    { label: "Residential",    color: "#10B981" },
    restaurant:     { label: "Restaurant",     color: "#F59E0B" },
    retail:         { label: "Retail",         color: "#8B5CF6" },
    office:         { label: "Office",         color: "#6366F1" },
    safehouse:      { label: "Safehouse",      color: "#FC4100" },
    landmark:       { label: "Landmark",       color: "#EC4899" },
    transportation: { label: "Transport",      color: "#06B6D4" },
    leisure:        { label: "Leisure",        color: "#84CC16" },
    construction:   { label: "Construction",   color: "#F97316" },
    industrial:     { label: "Industrial",     color: "#9CA3AF" },
    government:     { label: "Government",     color: "#EAB308" },
    service:        { label: "Service",        color: "#A78BFA" },
    public:         { label: "Public",         color: "#34D399" },
    demolished:     { label: "Demolished",     color: "#6B7280" },
};

const fetcher = (url: string) => axios.get(url).then(r => r.data?.data ?? []);

interface Props {
    initialCategories: string[];
}

export default function Gta6MapClient({ initialCategories }: Props) {
    const [search, setSearch]               = useState("");
    const [debouncedSearch, setDebounced]   = useState("");
    const [activeCategory, setActive]       = useState<string>("all");
    const [showFilters, setShowFilters]     = useState(false);
    const [selectedKey, setSelectedKey]     = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleSearch = useCallback((val: string) => {
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebounced(val), 400);
    }, []);

    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (debouncedSearch)          params.set("search", debouncedSearch);
    const apiUrl = `/gta6/locations?${params.toString()}`;

    const { data: locations = [], isLoading } = useSWR<Gta6Location[]>(apiUrl, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
    });

    const displayCategories = initialCategories.filter(c => CATEGORY_CONFIG[c]);

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-130px)] min-h-[560px]">
            {/* Sidebar */}
            <div className={`${showFilters ? "flex" : "hidden md:flex"} flex-col w-full md:w-72 lg:w-80 shrink-0 bg-[#0B0E14] border-r border-[#161B22] z-10 overflow-hidden`}>

                {/* Search */}
                <div className="p-4 border-b border-[#161B22]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
                        <input
                            type="text"
                            placeholder="Search locations..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            className="w-full bg-[#05070A] border border-[#161B22] rounded-lg pl-9 pr-8 py-2 text-[13px] text-white placeholder-[#71717A] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                        />
                        {search && (
                            <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories */}
                <div className="p-4 border-b border-[#161B22]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A] mb-3">Category</p>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setActive("all")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                activeCategory === "all"
                                    ? "bg-[var(--accent)] text-white"
                                    : "bg-[#05070A] border border-[#161B22] text-[#71717A] hover:text-white hover:border-[var(--accent)]/30"
                            }`}
                        >
                            All
                        </button>
                        {displayCategories.map(cat => {
                            const conf  = CATEGORY_CONFIG[cat];
                            const active = activeCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActive(active ? "all" : cat)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                        active
                                            ? "border"
                                            : "bg-[#05070A] border border-[#161B22] text-[#71717A] hover:text-white hover:border-white/20"
                                    }`}
                                    style={active ? {
                                        backgroundColor: conf.color + "22",
                                        borderColor:     conf.color + "66",
                                        color:           conf.color,
                                    } : {}}
                                >
                                    {conf.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Count */}
                <div className="px-4 py-3 border-b border-[#161B22]">
                    <p className="text-[12px] text-[#71717A]">
                        {isLoading
                            ? "Loading..."
                            : <><span className="text-white font-bold">{locations.length}</span> locations</>
                        }
                    </p>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-12 bg-[#161B22] rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="p-8 text-center text-[#71717A] text-[13px]">
                            <MapPin className="w-6 h-6 mx-auto mb-2 opacity-30" />
                            No locations found
                        </div>
                    ) : (
                        <div className="divide-y divide-[#161B22]">
                            {locations.map(loc => {
                                const color    = getCategoryColor(loc.categories);
                                const label    = getCategoryLabel(loc.categories);
                                const isActive = selectedKey === loc.gtadb_key;
                                return (
                                    <button
                                        key={loc.id}
                                        onClick={() => setSelectedKey(k => k === loc.gtadb_key ? null : loc.gtadb_key)}
                                        className={`w-full text-left px-4 py-2.5 transition-colors ${isActive ? "bg-[var(--accent)]/10 border-l-2 border-[var(--accent)]" : "hover:bg-[#161B22]/50 border-l-2 border-transparent"}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-medium text-white leading-tight truncate">{loc.name}</p>
                                                <p className="text-[10px] text-[#71717A] mt-0.5">
                                                    {label}
                                                    {loc.is_unconfirmed && <span className="ml-1 text-[#F59E0B]">· unconfirmed</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                {/* Mobile filter toggle */}
                <button
                    onClick={() => setShowFilters(v => !v)}
                    className="md:hidden absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-2 bg-[#0B0E14] border border-[#161B22] rounded-lg text-[12px] text-white shadow-lg"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Filters {activeCategory !== "all" && `(${CATEGORY_CONFIG[activeCategory]?.label})`}
                </button>

                <Gta6LeafletMap locations={locations} selectedKey={selectedKey} />
            </div>
        </div>
    );
}
