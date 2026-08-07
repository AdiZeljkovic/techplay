"use client";

import { Dna, Gamepad2, Monitor, BookOpen, Compass, Target, Users, Sparkles } from "lucide-react";
import DistributionBars from "./DistributionBars";
import EmptyState from "./EmptyState";
import type { GamerDna } from "@/lib/types/profile";

function platformIcon(name: string) {
    const s = name.toLowerCase();
    if (s.includes("pc") || s.includes("windows")) return Monitor;
    return Gamepad2;
}

function playstyleIcon(tag: string) {
    const s = tag.toLowerCase();
    if (s.includes("story")) return BookOpen;
    if (s.includes("explor")) return Compass;
    if (s.includes("complet")) return Target;
    if (s.includes("co-op") || s.includes("coop") || s.includes("multi")) return Users;
    return Sparkles;
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-[var(--radius-card)] bg-white/[0.02] border border-white/[0.06] p-4">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">{title}</h4>
        {children}
    </div>
);

export default function GamerDnaPanel({ dna }: { dna: GamerDna }) {
    const hasData = (dna.genres?.length || dna.platforms?.length || dna.playstyle?.length || dna.franchises?.length);

    if (!hasData) {
        return <EmptyState icon={<Dna className="w-6 h-6" />} title="Not enough data yet" hint="Add games to your collection to reveal your taste profile." />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Panel title="Favorite Genres">
                {dna.genres?.length > 0 ? <DistributionBars items={dna.genres} inline /> : <p className="text-[11px] text-white/25">No data</p>}
            </Panel>

            <Panel title="Favorite Platform">
                {dna.platforms?.length > 0 ? (
                    <div className="space-y-2.5">
                        {dna.platforms.map((p) => {
                            const Icon = platformIcon(p.name);
                            return (
                                <div key={p.name} className="flex items-center gap-2">
                                    <Icon className="w-3.5 h-3.5 text-white/40 shrink-0" />
                                    <span className="flex-1 text-[12px] text-white/70 truncate">{p.name}</span>
                                    <span className="text-[11px] font-bold text-white/45 tabular-nums">{p.percent}%</span>
                                </div>
                            );
                        })}
                    </div>
                ) : <p className="text-[11px] text-white/25">No data</p>}
            </Panel>

            <Panel title="Playstyle">
                {dna.playstyle?.length > 0 ? (
                    <div className="flex flex-col gap-2 items-start">
                        {dna.playstyle.map((p) => {
                            const Icon = playstyleIcon(p);
                            return (
                                <span key={p} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--accent)]/40 text-[var(--accent)] text-[11px] font-semibold">
                                    <Icon className="w-3.5 h-3.5" /> {p}
                                </span>
                            );
                        })}
                    </div>
                ) : <p className="text-[11px] text-white/25">Not set</p>}
            </Panel>

            <Panel title="Favorite Franchises">
                {dna.franchises?.length > 0 ? (
                    <ul className="space-y-2">
                        {dna.franchises.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-[12px] text-white/70">
                                <Gamepad2 className="w-3.5 h-3.5 text-white/30 shrink-0" /> <span className="truncate">{f}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-[11px] text-white/25">No favorites yet</p>}
            </Panel>
        </div>
    );
}
