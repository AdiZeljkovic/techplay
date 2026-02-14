"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { ChevronDown, Search, Check, Globe } from "lucide-react";
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
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    <Globe className="w-4 h-4 inline mr-1 text-yellow-500" />
                    Realm
                </label>

                {/* Hidden input for form compatibility */}
                <input
                    ref={ref}
                    type="hidden"
                    value={value}
                />

                {/* WoW-Style Dropdown Trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full px-4 py-3 rounded-lg text-left transition-all duration-200 flex items-center justify-between group",
                        "bg-gradient-to-b from-[#2a1810] to-[#1a0f08] border-2",
                        error
                            ? "border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                            : "border-[#8B7355] hover:border-yellow-600 shadow-[0_0_15px_rgba(139,115,85,0.2)]",
                        isOpen && "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                    )}
                    style={{
                        background: isOpen
                            ? 'linear-gradient(to bottom, #3a2820, #2a1810)'
                            : 'linear-gradient(to bottom, #2a1810, #1a0f08)'
                    }}
                >
                    <span className={selectedRealm ? "text-yellow-100 font-semibold" : "text-gray-400"}>
                        {selectedRealm ? selectedRealm.name : "Select a realm..."}
                    </span>
                    <ChevronDown className={cn(
                        "w-5 h-5 text-yellow-600 transition-transform duration-200",
                        isOpen && "transform rotate-180"
                    )} />
                </button>

                {/* WoW Tooltip-Style Dropdown Menu */}
                {isOpen && (
                    <div
                        className="absolute z-[100] mt-2 w-full rounded-lg overflow-hidden shadow-2xl border-2 border-[#8B7355]"
                        style={{
                            background: 'linear-gradient(to bottom, #1a1410 0%, #0f0a06 100%)',
                            boxShadow: '0 0 30px rgba(0,0,0,0.9), inset 0 0 20px rgba(139,115,85,0.1)'
                        }}
                    >
                        {/* WoW-Style Header with Search */}
                        <div className="p-3 border-b-2 border-[#8B7355]/30 bg-gradient-to-b from-[#2a1f15] to-[#1a1410]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-600" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search realms..."
                                    className="w-full pl-10 pr-4 py-2 bg-black/40 border border-[#8B7355]/50 rounded text-yellow-100 placeholder:text-gray-500 focus:outline-none focus:border-yellow-600 focus:shadow-[0_0_10px_rgba(234,179,8,0.3)] text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Realm List with WoW Scroll */}
                        <div className="overflow-y-auto max-h-64 custom-scrollbar">
                            {realms.length > 0 ? (
                                realms.map((realm) => (
                                    <button
                                        key={realm.slug}
                                        type="button"
                                        onClick={() => handleSelect(realm)}
                                        className={cn(
                                            "w-full px-4 py-3 text-left transition-all flex items-center justify-between group border-b border-[#8B7355]/10",
                                            selectedRealm?.slug === realm.slug
                                                ? "bg-gradient-to-r from-yellow-900/30 to-yellow-800/20"
                                                : "hover:bg-gradient-to-r hover:from-[#3a2820] hover:to-[#2a1810]"
                                        )}
                                    >
                                        <div>
                                            <div className={cn(
                                                "font-semibold transition-colors",
                                                selectedRealm?.slug === realm.slug
                                                    ? "text-yellow-400"
                                                    : "text-yellow-100 group-hover:text-yellow-300"
                                            )}>
                                                {realm.name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {realm.slug}
                                            </div>
                                        </div>
                                        {selectedRealm?.slug === realm.slug && (
                                            <Check className="w-4 h-4 text-yellow-500 animate-pulse" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No realms found for "{search}"</p>
                                </div>
                            )}
                        </div>

                        {/* WoW-Style Footer */}
                        <div
                            className="px-4 py-2 border-t-2 border-[#8B7355]/30 text-xs text-center"
                            style={{
                                background: 'linear-gradient(to bottom, #1a1410, #2a1f15)'
                            }}
                        >
                            <span className="text-yellow-600 font-semibold">{realms.length}</span>
                            <span className="text-gray-400"> realm{realms.length !== 1 && 's'} in </span>
                            <span className="text-yellow-500 font-semibold uppercase">{region}</span>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error ? (
                    <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                        <span className="text-red-500">✖</span> {error}
                    </p>
                ) : (
                    <p className="mt-1.5 text-sm text-gray-500">
                        Choose your character's home realm
                    </p>
                )}

                {/* Custom Scrollbar Styles */}
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #0f0a06;
                        border-left: 1px solid #8B7355;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: linear-gradient(to bottom, #8B7355, #6B5345);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(to bottom, #ab9375, #8B7355);
                    }
                `}</style>
            </div>
        );
    }
);

RealmDropdown.displayName = "RealmDropdown";

export default RealmDropdown;
