"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { searchRealms, getRealmsByRegion, WowRealm } from "@/data/wow-realms";
import { cn } from "@/lib/utils";

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
        const dropdownRef = useRef<HTMLDivElement>(null);

        const realms = searchRealms(region, search);

        // Update selected realm when value changes
        useEffect(() => {
            const allRealms = getRealmsByRegion(region);
            const realm = allRealms.find(r => r.slug === value);
            setSelectedRealm(realm || null);
        }, [value, region]);

        // Close dropdown when clicking outside
        useEffect(() => {
            function handleClickOutside(event: MouseEvent) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const handleSelect = (realm: WowRealm) => {
            setSelectedRealm(realm);
            onChange(realm.slug);
            setIsOpen(false);
            setSearch("");
        };

        return (
            <div className="w-full" ref={dropdownRef}>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Realm
                </label>

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
                    className={cn(
                        "w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-left text-[var(--text-primary)] transition-all duration-200 flex items-center justify-between",
                        "hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]",
                        error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-red-100",
                        isOpen && "border-[var(--accent)] ring-2 ring-[var(--accent-light)]"
                    )}
                >
                    <span className={selectedRealm ? "" : "text-[var(--text-muted)]"}>
                        {selectedRealm ? selectedRealm.name : "Select a realm..."}
                    </span>
                    <ChevronDown className={cn(
                        "w-5 h-5 text-[var(--text-muted)] transition-transform",
                        isOpen && "transform rotate-180"
                    )} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 mt-2 w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-2xl max-h-80 overflow-hidden">
                        {/* Search */}
                        <div className="p-3 border-b border-[var(--border)]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search realms..."
                                    className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Realm List */}
                        <div className="overflow-y-auto max-h-60">
                            {realms.length > 0 ? (
                                realms.map((realm) => (
                                    <button
                                        key={realm.slug}
                                        type="button"
                                        onClick={() => handleSelect(realm)}
                                        className={cn(
                                            "w-full px-4 py-3 text-left hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-between group",
                                            selectedRealm?.slug === realm.slug && "bg-[var(--bg-elevated)]"
                                        )}
                                    >
                                        <div>
                                            <div className="text-[var(--text-primary)] font-medium group-hover:text-[var(--accent)] transition-colors">
                                                {realm.name}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                                {realm.slug}
                                            </div>
                                        </div>
                                        {selectedRealm?.slug === realm.slug && (
                                            <Check className="w-4 h-4 text-[var(--accent)]" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-[var(--text-muted)]">
                                    No realms found for "{search}"
                                </div>
                            )}
                        </div>

                        {/* Footer Hint */}
                        <div className="px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                            {realms.length} realm{realms.length !== 1 && 's'} available in {region.toUpperCase()}
                        </div>
                    </div>
                )}

                {/* Helper Text / Error */}
                {error ? (
                    <p className="mt-1.5 text-sm text-[var(--danger)]">{error}</p>
                ) : (
                    <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                        Choose your character's realm
                    </p>
                )}
            </div>
        );
    }
);

RealmDropdown.displayName = "RealmDropdown";

export default RealmDropdown;
