"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";
import type { GameListPreview } from "@/lib/types/profile";

export default function CustomLists({ lists }: { lists: GameListPreview[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {lists.map((l) => (
                <Link key={l.id} href="?tab=lists" className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#0B0E14] aspect-[16/10] hover:border-[var(--accent)]/40 transition-colors">
                    {l.covers?.[0] ? (
                        <img src={l.covers[0]} alt={l.name} className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/15"><ListChecks className="w-7 h-7" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-md bg-black/40 border border-white/[0.08] flex items-center justify-center shrink-0">
                            <ListChecks className="w-4 h-4 text-[var(--accent)]" />
                        </span>
                        <div className="min-w-0">
                            <div className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{l.name}</div>
                            <div className="text-[10px] text-white/55">{l.items_count} {l.items_count === 1 ? "Game" : "Games"}</div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
