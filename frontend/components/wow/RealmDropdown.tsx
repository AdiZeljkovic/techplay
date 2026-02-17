"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { ChevronDown, Search, Check, Globe, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "@/lib/axios";

interface WowRealm {
    name: string;
    slug: string;
    locale: string;
}

interface RealmDropdownProps {
    region: string;
    value: string;
    onChange: (slug: string) => void;
    error?: string;
}

const RealmDropdown = forwardRef<HTMLInputElement, RealmDropdownProps>(
    ({ region, value, onChange, error }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState("");
        const [selectedRealm, setSelectedRealm] = useState<WowRealm | null>(null);
        const [allRealms, setAllRealms] = useState<WowRealm[]>([]);
        const [loading, setLoading] = useState(false);
        const [fetchError, setFetchError] = useState<string | null>(null);
        const dropdownRef = useRef<HTMLDivElement>(null);

        // Fetch realms from API when region changes
        useEffect(() => {
            const fetchRealms = async () => {
                if (!region) return;

                setLoading(true);
                setFetchError(null);

                try {
                    const response = await axios.get(`/wow/realms/${region}`);
                    if (response.data.success) {
                        setAllRealms(response.data.data.realms || []);
                    } else {
                        setFetchError('Failed to load realms');
                        setAllRealms([]);
                    }
                } catch (err) {
                    console.error('Failed to fetch realms:', err);
                    setFetchError('Failed to load realms. Please try again.');
                    setAllRealms([]);
                } finally {
                    setLoading(false);
                }
            };

            fetchRealms();
        }, [region]);

        // Filter realms based on search query
        const filteredRealms = allRealms.filter(realm =>
            realm.name.toLowerCase().includes(search.toLowerCase()) ||
            realm.slug.includes(search.toLowerCase())
        );

        // Update selected realm when value changes
        useEffect(() => {
            const realm = allRealms.find(r => r.slug === value);
            setSelectedRealm(realm || null);
        }, [value, allRealms]);

        // Close dropdown when clicking outside
        useEffect(() => {
            function handleClickOutside(event: MouseEvent) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }

            if (isOpen) {
                document.addEventListener("mousedown", handleClickOutside);
                return () => document.removeEventListener("mousedown", handleClickOutside);
            }
        }, [isOpen]);

        const handleSelect = (realm: WowRealm) => {
            setSelectedRealm(realm);
            onChange(realm.slug);
            setIsOpen(false);
            setSearch("");
        };

        return (
            <div className="w-full relative" ref={dropdownRef}>
                {/* Hidden input for form compatibility */}
                <input
                    ref={ref}
                    type="hidden"
                    value={value}
                />

                {/* Dropdown Trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={loading}
                    className={cn(
                        "w-full px-5 py-4 bg-[var(--bg-elevated)] border-2 rounded-2xl text-left transition-all duration-200 flex items-center justify-between group font-medium text-lg",
                        error
                            ? "border-red-400 focus:border-red-400"
                            : "border-[var(--border)] hover:border-[var(--accent)]/60",
                        isOpen && "border-[var(--accent)] bg-[var(--bg-card)] shadow-lg shadow-[var(--accent)]/20",
                        loading && "opacity-60 cursor-wait"
                    )}
                >
                    <span className={selectedRealm ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]/60"}>
                        {loading ? "Loading realms..." : selectedRealm ? selectedRealm.name : "Select a realm..."}
                    </span>
                    {loading ? (
                        <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
                    ) : (
                        <ChevronDown className={cn(
                            "w-5 h-5 text-[var(--accent)] transition-transform duration-200",
                            isOpen && "transform rotate-180"
                        )} />
                    )}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div
                        className="absolute z-[100] mt-3 w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-[var(--accent)]/30 bg-[var(--bg-card)]"
                    >
                        {/* Search Header */}
                        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--accent)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search realms..."
                                    className="w-full pl-11 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--accent)] focus:shadow-lg focus:shadow-[var(--accent)]/20 transition-all font-medium"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Realm List */}
                        <div className="overflow-y-auto max-h-72 custom-scrollbar">
                            {fetchError ? (
                                <div className="px-5 py-12 text-center text-red-400">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                                    <p className="text-sm font-medium">{fetchError}</p>
                                    <p className="text-xs mt-1 opacity-60">Please refresh and try again</p>
                                </div>
                            ) : loading ? (
                                <div className="px-5 py-12 text-center text-[var(--text-secondary)]">
                                    <Loader2 className="w-10 h-10 mx-auto mb-3 text-[var(--accent)] animate-spin" />
                                    <p className="text-sm font-medium">Loading realms...</p>
                                </div>
                            ) : filteredRealms.length > 0 ? (
                                filteredRealms.map((realm) => (
                                    <button
                                        key={realm.slug}
                                        type="button"
                                        onClick={() => handleSelect(realm)}
                                        className={cn(
                                            "w-full px-5 py-3.5 text-left transition-all flex items-center justify-between group",
                                            selectedRealm?.slug === realm.slug
                                                ? "bg-[var(--accent)]/15 border-l-4 border-l-[var(--accent)]"
                                                : "hover:bg-[var(--bg-elevated)] border-l-4 border-l-transparent hover:border-l-[var(--accent)]/30"
                                        )}
                                    >
                                        <div className="flex-1">
                                            <div className={cn(
                                                "font-bold transition-colors text-base",
                                                selectedRealm?.slug === realm.slug
                                                    ? "text-[var(--accent)]"
                                                    : "text-[var(--text-primary)] group-hover:text-[var(--accent)]"
                                            )}>
                                                {realm.name}
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                                                {realm.slug}
                                            </div>
                                        </div>
                                        {selectedRealm?.slug === realm.slug && (
                                            <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center ml-3">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-5 py-12 text-center text-[var(--text-secondary)]">
                                    <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No realms found for "{search}"</p>
                                    <p className="text-xs mt-1 opacity-60">Try a different search term</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!loading && !fetchError && (
                            <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-center gap-2 bg-[var(--bg-elevated)]">
                                <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="text-xs font-bold">
                                    <span className="text-[var(--accent)]">{filteredRealms.length}</span>
                                    <span className="text-[var(--text-secondary)]"> realm{filteredRealms.length !== 1 && 's'} in </span>
                                    <span className="text-[var(--accent)] uppercase">{region}</span>
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </p>
                )}

                {/* Custom Scrollbar Styles */}
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: var(--bg-secondary);
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: var(--border);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: var(--accent);
                    }
                `}</style>
            </div>
        );
    }
);

RealmDropdown.displayName = "RealmDropdown";

export default RealmDropdown;
