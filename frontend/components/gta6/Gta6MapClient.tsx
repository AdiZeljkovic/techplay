"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Search, SlidersHorizontal, X, MapPin, ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import type { Gta6Location } from "@/types";
import { getCategoryColor, getCategoryLabel } from "./gta6Utils";
import Gta6MapBackdrop from "./Gta6MapBackdrop";

// Single dynamic import for the entire Leaflet map — SSR disabled
const Gta6LeafletMap = dynamic(() => import("./Gta6LeafletMap"), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex items-center justify-center bg-[#05070A]">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[var(--gta-pink)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
    totalLocations?: number;
}

export default function Gta6MapClient({ initialCategories, totalLocations = 0 }: Props) {
    const [search, setSearch]               = useState("");
    const [debouncedSearch, setDebounced]   = useState("");
    const [activeCategory, setActive]       = useState<string>("all");
    const [panelOpen, setPanelOpen]         = useState(false);   // mobile drawer / desktop collapse
    const [selectedKey, setSelectedKey]     = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const searchRef   = useRef<HTMLInputElement>(null);

    const openPanel = useCallback((tab: "search" | "filters") => {
        setPanelOpen(true);
        if (tab === "search") setTimeout(() => searchRef.current?.focus(), 120);
    }, []);

    // Panel open by default on desktop (overlay), closed on mobile (drawer)
    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
            setPanelOpen(true);
        }
    }, []);

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

    const handleSelect = (key: string) => {
        setSelectedKey(k => (k === key ? null : key));
        // close the drawer on mobile so the user sees the map fly
        if (window.matchMedia("(max-width: 767px)").matches) setPanelOpen(false);
    };

    return (
        <div className="relative w-full h-[calc(100dvh-106px)] min-h-[520px] overflow-hidden bg-[#05070A]">
            {/* Sunset/palm backdrop behind the map */}
            <Gta6MapBackdrop />

            {/* Map fills everything (above backdrop) */}
            <div className="absolute inset-0 z-10">
                <Gta6LeafletMap locations={locations} selectedKey={selectedKey} onOpenPanel={openPanel} />
            </div>

            {/* Title chip (SEO H1) */}
            <div className="absolute top-3 left-3 z-[800] hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#0B0E14]/85 backdrop-blur border border-[#161B22] shadow-lg pointer-events-none">
                <MapPin className="w-4 h-4 text-[var(--gta-pink)]" />
                <h1 className="text-[13px] font-bold text-white">
                    GTA 6 Interactive Map
                    <span className="ml-2 text-[11px] font-normal text-[#71717A]">
                        {totalLocations ? totalLocations.toLocaleString() : ""} locations
                    </span>
                </h1>
            </div>

            {/* Back to hub */}
            <Link
                href="/gta6"
                className="absolute top-3 right-3 z-[800] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B0E14]/85 backdrop-blur border border-[#161B22] text-[12px] font-semibold text-white hover:border-[var(--gta-pink)]/50 transition-colors shadow-lg"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">GTA 6 Hub</span>
            </Link>

            {/* Mobile open-panel button (desktop uses the toolbar) */}
            {!panelOpen && (
                <button
                    onClick={() => setPanelOpen(true)}
                    className="md:hidden absolute bottom-4 left-4 z-[800] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gta-pink)] text-white text-[13px] font-bold shadow-lg gta6-glow-pink"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters &amp; list
                    {activeCategory !== "all" && (
                        <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px]">{CATEGORY_CONFIG[activeCategory]?.label}</span>
                    )}
                </button>
            )}

            {/* Backdrop (mobile only) */}
            {panelOpen && (
                <button
                    aria-label="Close filters"
                    onClick={() => setPanelOpen(false)}
                    className="md:hidden absolute inset-0 z-[850] bg-black/50 backdrop-blur-[2px]"
                />
            )}

            {/* Floating filter/list panel */}
            <div
                className={`absolute z-[900] flex flex-col bg-[#0B0E14]/95 backdrop-blur border border-[#161B22] shadow-2xl overflow-hidden
                    transition-transform duration-300
                    md:top-16 md:left-4 md:w-80 md:max-h-[calc(100%-5rem)] md:rounded-2xl
                    inset-x-0 bottom-0 max-h-[78%] rounded-t-2xl md:inset-x-auto md:bottom-auto
                    ${panelOpen ? "translate-y-0" : "translate-y-full md:translate-y-0 md:hidden"}`}
            >
                {/* Panel header */}
                <div className="px-4 pt-4 pb-3 border-b border-[#161B22] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[13px] font-bold text-white tracking-wide">Locations</h2>
                        <span className="text-[11px] text-[#71717A]">
                            {isLoading ? "…" : <><span className="text-[var(--gta-pink)] font-bold">{locations.length}</span> results</>}
                        </span>
                    </div>
                    <button onClick={() => setPanelOpen(false)} className="text-[#71717A] hover:text-white p-1 -mr-1" aria-label="Collapse">
                        <span className="md:hidden"><X className="w-4 h-4" /></span>
                        <span className="hidden md:inline"><ChevronLeft className="w-4 h-4" /></span>
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-[#161B22] shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search locations..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            className="w-full bg-[#05070A] border border-[#161B22] rounded-lg pl-9 pr-8 py-2 text-[13px] text-white placeholder-[#71717A] focus:outline-none focus:border-[var(--gta-pink)]/50 transition-colors"
                        />
                        {search && (
                            <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories */}
                <div className="p-4 border-b border-[#161B22] shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A] mb-3">Category</p>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setActive("all")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                activeCategory === "all"
                                    ? "bg-[var(--gta-pink)] text-white"
                                    : "bg-[#05070A] border border-[#161B22] text-[#71717A] hover:text-white hover:border-[var(--gta-pink)]/30"
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
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
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
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: conf.color }} />
                                    {conf.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto min-h-0">
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
                                        onClick={() => handleSelect(loc.gtadb_key)}
                                        className={`group w-full text-left px-4 py-2.5 transition-colors ${isActive ? "bg-[var(--gta-pink)]/10 border-l-2 border-[var(--gta-pink)]" : "hover:bg-[#161B22]/50 border-l-2 border-transparent"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12px] font-medium text-white leading-tight truncate">{loc.name}</p>
                                                <p className="text-[10px] text-[#71717A] mt-0.5">
                                                    {label}
                                                    {loc.is_unconfirmed && <span className="ml-1 text-[#F59E0B]">· unconfirmed</span>}
                                                </p>
                                            </div>
                                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-all ${isActive ? "text-[var(--gta-pink)] opacity-100" : "text-[#71717A] opacity-0 group-hover:opacity-100"}`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
