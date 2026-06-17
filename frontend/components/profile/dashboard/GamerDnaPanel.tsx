"use client";

import { Dna, Gamepad2 } from "lucide-react";
import DistributionBars from "./DistributionBars";
import EmptyState from "./EmptyState";
import type { GamerDna } from "@/lib/types/profile";

export default function GamerDnaPanel({ dna }: { dna: GamerDna }) {
    const hasData = (dna.genres?.length || dna.platforms?.length || dna.playstyle?.length || dna.franchises?.length);

    if (!hasData) {
        return <EmptyState icon={<Dna className="w-6 h-6" />} title="Not enough data yet" hint="Add games to your collection to reveal your taste profile." />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {dna.genres?.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">Favorite Genres</h4>
                    <DistributionBars items={dna.genres} />
                </div>
            )}
            {dna.platforms?.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">Favorite Platforms</h4>
                    <DistributionBars items={dna.platforms} barClassName="bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                </div>
            )}
            {dna.playstyle?.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">Playstyle</h4>
                    <div className="flex flex-wrap gap-2">
                        {dna.playstyle.map((p) => (
                            <span key={p} className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2.5 py-1 rounded-full">{p}</span>
                        ))}
                    </div>
                </div>
            )}
            {dna.franchises?.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">Favorite Franchises</h4>
                    <ul className="space-y-1.5">
                        {dna.franchises.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-[12px] text-white/70">
                                <Gamepad2 className="w-3.5 h-3.5 text-white/30 shrink-0" /> {f}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
