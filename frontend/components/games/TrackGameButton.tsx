"use client";

import { useState, useRef, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import {
    Plus, Check, Gamepad2, Layers, CheckCircle2, Heart, Archive, ChevronDown, Loader2, X,
} from "lucide-react";

type Status = "playing" | "backlog" | "completed" | "wishlist" | "dropped";

const STATUSES: { value: Status; label: string; icon: any; color: string }[] = [
    { value: "playing", label: "Playing", icon: Gamepad2, color: "#34d399" },
    { value: "backlog", label: "Backlog", icon: Layers, color: "#60a5fa" },
    { value: "completed", label: "Completed", icon: CheckCircle2, color: "#22c55e" },
    { value: "wishlist", label: "Wishlist", icon: Heart, color: "#f472b6" },
    { value: "dropped", label: "Dropped", icon: Archive, color: "#9ca3af" },
];

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? null);

interface Props {
    slug: string;
    gameName?: string;
    /** "full" = sidebar button; "compact" = small card overlay button */
    variant?: "full" | "compact";
    wrapperClassName?: string;
    /** ISO date string — if in the future, hides Completed and Dropped */
    released?: string | null;
}

export default function TrackGameButton({ slug, gameName, variant = "full", wrapperClassName, released }: Props) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [open]);

    const swrKey = user ? `/collection/games/${slug}` : null;
    const { data: entry, mutate } = useSWR(swrKey, fetcher);

    const currentStatus = entry?.status as Status | undefined;
    const currentMeta = STATUSES.find((s) => s.value === currentStatus);

    const isUpcoming = !released || new Date(released) >= new Date(new Date().toDateString());
    const visibleStatuses = isUpcoming
        ? STATUSES.filter((s) => s.value === "playing" || s.value === "backlog" || s.value === "wishlist")
        : STATUSES;

    async function setStatus(status: Status) {
        if (busy) return;
        setBusy(true);
        setOpen(false);
        try {
            await axios.put(`/collection/games/${slug}`, { status });
            mutate();
            globalMutate((key: string) => typeof key === "string" && key.includes("/collection"), undefined, { revalidate: true });
            globalMutate((key: string) => typeof key === "string" && key.includes("/users/") && key.includes("/profile"), undefined, { revalidate: true });
            toast.success(gameName ? `${gameName} — ${STATUSES.find((s) => s.value === status)?.label}` : "Updated!");
        } catch {
            toast.error("Couldn't update collection");
        } finally {
            setBusy(false);
        }
    }

    async function removeFromCollection() {
        if (busy) return;
        setBusy(true);
        setOpen(false);
        try {
            await axios.delete(`/collection/games/${slug}`);
            mutate(null, false);
            globalMutate((key: string) => typeof key === "string" && key.includes("/collection"), undefined, { revalidate: true });
            globalMutate((key: string) => typeof key === "string" && key.includes("/users/") && key.includes("/profile"), undefined, { revalidate: true });
            toast.success("Removed from collection");
        } catch {
            toast.error("Couldn't remove");
        } finally {
            setBusy(false);
        }
    }

    // Not logged in — redirect to login on click
    if (!user) {
        if (variant === "compact") {
            return (
                <a href="/login" onClick={(e) => e.stopPropagation()} className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-card)] bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors">
                    <Plus className="w-4 h-4" />
                </a>
            );
        }
        return (
            <a href="/login" className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-card)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-[13px] uppercase tracking-wider transition-colors">
                <Plus className="w-4 h-4" /> Track This Game
            </a>
        );
    }

    // --- COMPACT variant (card hover overlay) ---
    if (variant === "compact") {
        return (
            <div className="relative" onClick={(e) => e.preventDefault()}>
                <button
                    onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                    className={`flex items-center justify-center w-8 h-8 rounded-[var(--radius-card)] backdrop-blur-sm border transition-colors ${
                        currentMeta
                            ? "border-transparent text-white"
                            : "bg-black/60 border-white/10 text-white/70 hover:text-white hover:border-white/30"
                    }`}
                    style={currentMeta ? { backgroundColor: `${currentMeta.color}CC`, borderColor: currentMeta.color } : {}}
                    title={currentMeta ? currentMeta.label : "Track"}
                >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : currentMeta ? <currentMeta.icon className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>

                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <div className="absolute right-0 top-9 z-50 w-40 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/10 shadow-2xl overflow-hidden py-1">
                            {visibleStatuses.map((s) => (
                                <button key={s.value} onClick={() => setStatus(s.value)}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-semibold transition-colors ${currentStatus === s.value ? "text-white bg-white/10" : "text-white/65 hover:text-white hover:bg-white/[0.05]"}`}>
                                    <s.icon className="w-3.5 h-3.5 shrink-0" style={{ color: s.color }} />
                                    {s.label}
                                    {currentStatus === s.value && <Check className="w-3 h-3 ml-auto" style={{ color: s.color }} />}
                                </button>
                            ))}
                            {currentStatus && (
                                <>
                                    <div className="h-px bg-white/[0.06] mx-3 my-1" />
                                    <button onClick={removeFromCollection} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
                                        <X className="w-3.5 h-3.5" /> Remove
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // --- FULL variant (game detail sidebar) ---
    return (
        <div ref={wrapperRef} className={`relative ${wrapperClassName ?? "w-full"}`}>
            {currentMeta ? (
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2.5 py-3 px-4 rounded-[var(--radius-card)] border" style={{ backgroundColor: `${currentMeta.color}15`, borderColor: `${currentMeta.color}40` }}>
                        <currentMeta.icon className="w-4 h-4 shrink-0" style={{ color: currentMeta.color }} />
                        <span className="text-[13px] font-bold" style={{ color: currentMeta.color }}>{currentMeta.label}</span>
                    </div>
                    <button onClick={() => setOpen((v) => !v)} disabled={busy}
                        className="px-3 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 transition-colors">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            ) : (
                <button onClick={() => setOpen((v) => !v)} disabled={busy}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-card)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-[13px] uppercase tracking-wider transition-colors">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Track This Game
                </button>
            )}

            {open && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
                    <div
                        className="fixed z-[9999] rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/10 shadow-2xl overflow-hidden py-1"
                        style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width || undefined, minWidth: 180 }}
                    >
                        {visibleStatuses.map((s) => (
                            <button key={s.value} onClick={() => setStatus(s.value)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold transition-colors ${currentStatus === s.value ? "text-white bg-white/10" : "text-white/65 hover:text-white hover:bg-white/[0.05]"}`}>
                                <s.icon className="w-4 h-4 shrink-0" style={{ color: s.color }} />
                                {s.label}
                                {currentStatus === s.value && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: s.color }} />}
                            </button>
                        ))}
                        {currentStatus && (
                            <>
                                <div className="h-px bg-white/[0.06] mx-4 my-1" />
                                <button onClick={removeFromCollection} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
                                    <X className="w-4 h-4" /> Remove from Collection
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
