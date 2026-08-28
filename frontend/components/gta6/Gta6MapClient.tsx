"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Search, SlidersHorizontal, X, MapPin, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import type { Gta6Location } from "@/types";
import { getCategoryColor, getCategoryLabel } from "./gta6Utils";
import Gta6MapBackdrop from "./Gta6MapBackdrop";

const Gta6LeafletMap = dynamic(() => import("./Gta6LeafletMap"), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-0)]">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-[var(--gta-pink)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/50 text-[13px]">Loading map...</p>
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
    safehouse:      { label: "Safehouse",      color: "#DC143C" },
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
    const [search, setSearch]                   = useState("");
    const [debouncedSearch, setDebounced]       = useState("");
    const [activeCategory, setActive]           = useState<string>("all");
    const [panelOpen, setPanelOpen]             = useState(false);   // mobile bottom-sheet
    const [panelCollapsed, setPanelCollapsed]   = useState(false);   // desktop collapse
    const [selectedKey, setSelectedKey]         = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const searchRef   = useRef<HTMLInputElement>(null);

    // Desktop: panel visible by default
    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
            setPanelOpen(false); // mobile sheet stays closed; desktop uses the aside
        }
    }, []);

    const openPanel = useCallback((tab: "search" | "filters") => {
        if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
            // Desktop: un-collapse the aside
            setPanelCollapsed(false);
            if (tab === "search") setTimeout(() => searchRef.current?.focus(), 120);
        } else {
            // Mobile: open the bottom-sheet
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

    // Mount the map only after the first full dataset, so island bounds stay
    // stable across filter changes. This used to write a ref during render,
    // which makes the render impure and misbehaves under concurrent rendering.
    const [hasLoaded, setHasLoaded] = useState(false);
    useEffect(() => {
        if (locations.length > 0) setHasLoaded(true);
    }, [locations.length]);

    const handleSelect = (key: string) => {
        setSelectedKey(k => (k === key ? null : key));
        if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
            setPanelOpen(false);
        }
    };

    // Shared panel content (used in both aside and bottom-sheet)
    const PanelSearch = () => (
        <div className="p-4 border-b border-white/[0.07] shrink-0">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search locations..."
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    className="w-full bg-[var(--surface-0)] border border-white/[0.07] rounded-[var(--radius-card)] pl-9 pr-8 py-2 text-[13px] text-white placeholder-white/35 focus:outline-none focus:border-[var(--gta-pink)]/50 transition-colors"
                />
                {search && (
                    <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );

    const PanelCategories = ({ scroll = false }: { scroll?: boolean }) => (
        <div className={`p-4 border-b border-white/[0.07] shrink-0 ${scroll ? "overflow-x-auto" : ""}`}>
            {!scroll && <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">Category</p>}
            <div className={`flex gap-1.5 ${scroll ? "min-w-max" : "flex-wrap"}`}>
                <button
                    onClick={() => setActive("all")}
                    className={`px-2.5 py-1 rounded-[var(--radius-inner)] text-[11px] font-semibold transition-all whitespace-nowrap ${
                        activeCategory === "all"
                            ? "bg-[var(--gta-pink)] text-white"
                            : "bg-[var(--surface-0)] border border-white/[0.07] text-white/50 hover:text-white hover:border-[var(--gta-pink)]/30"
                    }`}
                >
                    All
                </button>
                {displayCategories.map(cat => {
                    const conf   = CATEGORY_CONFIG[cat];
                    const active = activeCategory === cat;
                    return (
                        <button
                            key={cat}
                            onClick={() => setActive(active ? "all" : cat)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-inner)] text-[11px] font-semibold whitespace-nowrap transition-all ${
                                active
                                    ? "border"
                                    : "bg-[var(--surface-0)] border border-white/[0.07] text-white/50 hover:text-white hover:border-white/20"
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
    );

    const PanelList = () => (
        <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
                <div className="p-4 space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-12 bg-white/[0.07] rounded-[var(--radius-card)] animate-pulse" />
                    ))}
                </div>
            ) : locations.length === 0 ? (
                <div className="p-8 text-center text-white/50 text-[13px]">
                    <MapPin className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    No locations found
                </div>
            ) : (
                <div className="divide-y divide-white/[0.07]">
                    {locations.map(loc => {
                        const color    = getCategoryColor(loc.categories);
                        const label    = getCategoryLabel(loc.categories);
                        const isActive = selectedKey === loc.gtadb_key;
                        return (
                            <button
                                key={loc.id}
                                onClick={() => handleSelect(loc.gtadb_key)}
                                className={`group w-full text-left px-4 py-2.5 transition-colors ${
                                    isActive
                                        ? "bg-[var(--gta-pink)]/10 border-l-2 border-[var(--gta-pink)]"
                                        : "hover:bg-white/[0.07]/50 border-l-2 border-transparent"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-medium text-white leading-tight truncate">{loc.name}</p>
                                        <p className="text-[10px] text-white/50 mt-0.5">
                                            {label}
                                            {loc.is_unconfirmed && <span className="ml-1 text-[#F59E0B]">· unconfirmed</span>}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-all ${
                                        isActive ? "text-[var(--gta-pink)] opacity-100" : "text-white/35 opacity-0 group-hover:opacity-100"
                                    }`} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-[calc(100dvh-72px)] min-h-[520px] overflow-hidden bg-[var(--surface-0)]">

            {/* ── LEFT PANEL (desktop only) ─────────────────────────── */}
            <aside
                className={`hidden md:flex flex-col shrink-0 border-r border-white/[0.07] bg-[var(--surface-1)] z-20 transition-[width] duration-300
                    ${panelCollapsed ? "w-12" : "w-80"}`}
            >
                {panelCollapsed ? (
                    /* Collapsed rail */
                    <div className="flex flex-col items-center py-4 gap-3 h-full">
                        <button
                            onClick={() => setPanelCollapsed(false)}
                            title="Expand"
                            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-card)] text-white/35 hover:text-white hover:bg-[var(--gta-pink)]/20 transition-colors shrink-0"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="w-px flex-1 bg-white/[0.07]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#3A3A45] [writing-mode:vertical-rl] rotate-180 pb-2">
                            Locations
                        </span>
                    </div>
                ) : (
                    /* Expanded panel */
                    <>
                        <div className="px-4 pt-4 pb-3 border-b border-white/[0.07] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[var(--gta-pink)] shrink-0" />
                                <h2 className="text-[13px] font-bold text-white">Locations</h2>
                                <span className="text-[11px] text-white/50">
                                    {isLoading ? "…" : (
                                        <><span className="text-[var(--gta-pink)] font-bold">{locations.length}</span> results</>
                                    )}
                                </span>
                            </div>
                            <button
                                onClick={() => setPanelCollapsed(true)}
                                title="Collapse"
                                className="p-1 -mr-1 text-white/35 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                        <PanelSearch />
                        <PanelCategories />
                        <PanelList />
                    </>
                )}
            </aside>

            {/* ── RIGHT STAGE ──────────────────────────────────────────── */}
            <div className="flex-1 relative min-w-0">
                {/* Sunset + palm backdrop fills the stage */}
                <Gta6MapBackdrop />

                {/* Framed map card — floats on the sunset with visible margin */}
                <div className="absolute inset-0 z-10 flex items-center justify-center p-3 md:p-6 lg:p-8">
                    <div className="relative w-full h-full rounded-[var(--radius-panel)] overflow-hidden border border-white/10 shadow-[0_8px_48px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,46,136,0.07)] bg-[var(--surface-0)]">

                        {/* Leaflet map */}
                        {hasLoaded ? (
                            <Gta6LeafletMap
                                locations={locations}
                                selectedKey={selectedKey}
                                onOpenPanel={openPanel}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-2 border-[var(--gta-pink)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-white/60 text-[13px]">Loading map…</p>
                                </div>
                            </div>
                        )}

                        {/* Title chip (SEO H1) */}
                        <div className="absolute top-3 left-3 z-[800] flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-card)] bg-[var(--surface-1)]/90 backdrop-blur border border-white/[0.07] shadow-lg pointer-events-none">
                            <MapPin className="w-3.5 h-3.5 text-[var(--gta-pink)] shrink-0" />
                            <h1 className="text-[12px] font-bold text-white leading-none whitespace-nowrap">
                                GTA 6 Interactive Map
                                {totalLocations > 0 && (
                                    <span className="ml-2 text-[10px] font-normal text-white/50">
                                        {totalLocations.toLocaleString()} locations
                                    </span>
                                )}
                            </h1>
                        </div>

                        {/* Back to Hub */}
                        <Link
                            href="/gta6"
                            className="absolute top-3 right-3 z-[800] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] bg-[var(--surface-1)]/90 backdrop-blur border border-white/[0.07] text-[12px] font-semibold text-white hover:border-[var(--gta-pink)]/50 transition-colors shadow-lg"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">GTA 6 Hub</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile open-panel button */}
                {!panelOpen && (
                    <button
                        onClick={() => setPanelOpen(true)}
                        className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[850] inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-card)] bg-[var(--gta-pink)] text-white text-[13px] font-bold shadow-lg gta6-glow-pink"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters &amp; list
                        {activeCategory !== "all" && (
                            <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px]">
                                {CATEGORY_CONFIG[activeCategory]?.label}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* ── MOBILE BOTTOM-SHEET (fixed, overlays everything) ─────── */}
            {panelOpen && (
                <button
                    aria-label="Close filters"
                    onClick={() => setPanelOpen(false)}
                    className="md:hidden fixed inset-0 z-[900] bg-black/50 backdrop-blur-[2px]"
                />
            )}

            <div
                className={`md:hidden fixed inset-x-0 bottom-0 z-[910] flex flex-col bg-[var(--surface-1)]/97 backdrop-blur border-t border-white/[0.07] shadow-2xl rounded-t-2xl max-h-[80dvh] transition-transform duration-300
                    ${panelOpen ? "translate-y-0" : "translate-y-full"}`}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-[#2A2F38]" />
                </div>

                {/* Sheet header */}
                <div className="px-4 pb-3 border-b border-white/[0.07] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--gta-pink)]" />
                        <span className="text-[13px] font-bold text-white">Locations</span>
                        <span className="text-[11px] text-white/50">
                            {isLoading ? "…" : (
                                <><span className="text-[var(--gta-pink)] font-bold">{locations.length}</span> results</>
                            )}
                        </span>
                    </div>
                    <button onClick={() => setPanelOpen(false)} className="text-white/35 hover:text-white p-1 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <PanelSearch />
                <PanelCategories scroll />
                <PanelList />
            </div>
        </div>
    );
}
