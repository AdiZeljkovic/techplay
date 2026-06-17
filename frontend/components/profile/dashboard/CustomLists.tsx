"use client";

import Link from "next/link";
import ListCoverCollage from "./ListCoverCollage";
import type { GameListPreview } from "@/lib/types/profile";

export default function CustomLists({ lists }: { lists: GameListPreview[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {lists.map((l) => (
                <Link key={l.id} href="?tab=lists" className="group rounded-xl overflow-hidden border border-white/[0.06] bg-[#0B0E14] hover:border-[var(--accent)]/40 transition-colors">
                    <ListCoverCollage covers={l.covers} className="aspect-video w-full" />
                    <div className="p-3">
                        <h4 className="text-[12px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{l.name}</h4>
                        <span className="text-[10px] text-white/35">{l.items_count} {l.items_count === 1 ? "game" : "games"}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
}
