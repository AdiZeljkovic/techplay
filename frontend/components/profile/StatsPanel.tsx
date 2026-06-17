"use client";

import { BarChart3, Target, Library, Gamepad2, Cpu } from "lucide-react";
import SectionCard from "./dashboard/SectionCard";
import EmptyState from "./dashboard/EmptyState";
import DistributionBars from "./dashboard/DistributionBars";
import ContributionMilestones from "./dashboard/ContributionMilestones";
import { GamertagsCard } from "./GamertagsCard";
import { SpecsCard } from "./SpecsCard";
import type { ProfileStats, PlatformsGenres, Milestone } from "@/lib/types/profile";

interface Props {
    stats: ProfileStats;
    platformsGenres?: PlatformsGenres;
    milestones?: Milestone[];
    gamertags?: Record<string, string>;
    pcSpecs?: Record<string, string>;
}

export default function StatsPanel({ stats, platformsGenres, milestones = [], gamertags, pcSpecs }: Props) {
    const statusBreakdown = [
        { label: "Playing", value: stats.playing_count ?? 0, color: "#34d399" },
        { label: "Backlog", value: stats.backlog_count ?? 0, color: "#60a5fa" },
        { label: "Completed", value: stats.completed_count ?? 0, color: "#22c55e" },
        { label: "Wishlist", value: stats.wishlist_count ?? 0, color: "#f472b6" },
    ];
    const totalGames = stats.games_count ?? 0;

    const hasGamertags = gamertags && Object.keys(gamertags).length > 0;
    const hasSpecs = pcSpecs && Object.keys(pcSpecs).length > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Collection breakdown */}
            <SectionCard title="Collection Breakdown" icon={<Library className="w-4 h-4 text-violet-400/70" />}>
                {totalGames > 0 ? (
                    <div className="space-y-3">
                        <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.06]">
                            {statusBreakdown.map((s) => {
                                const pct = totalGames > 0 ? (s.value / totalGames) * 100 : 0;
                                return pct > 0 ? <div key={s.label} style={{ width: `${pct}%`, backgroundColor: s.color }} title={`${s.label}: ${s.value}`} /> : null;
                            })}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {statusBreakdown.map((s) => (
                                <div key={s.label} className="flex items-center gap-2 text-[12px]">
                                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                                    <span className="text-white/60">{s.label}</span>
                                    <span className="ml-auto font-bold text-white tabular-nums">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <EmptyState icon={<Gamepad2 className="w-6 h-6" />} title="No games in collection yet" compact />
                )}
            </SectionCard>

            {/* Milestones */}
            <SectionCard title="Contribution Milestones" icon={<Target className="w-4 h-4 text-emerald-400/70" />}>
                {milestones.length > 0 ? <ContributionMilestones milestones={milestones} /> : <EmptyState icon={<Target className="w-6 h-6" />} title="No milestones yet" compact />}
            </SectionCard>

            {/* Platforms */}
            <SectionCard title="Platforms" icon={<BarChart3 className="w-4 h-4 text-blue-400/70" />}>
                {platformsGenres && platformsGenres.platforms.length > 0 ? (
                    <DistributionBars items={platformsGenres.platforms} barClassName="bg-gradient-to-r from-blue-500 to-cyan-400" />
                ) : <EmptyState icon={<BarChart3 className="w-6 h-6" />} title="No data yet" compact />}
            </SectionCard>

            {/* Genres */}
            <SectionCard title="Genres" icon={<BarChart3 className="w-4 h-4 text-[var(--accent)]" />}>
                {platformsGenres && platformsGenres.genres.length > 0 ? (
                    <DistributionBars items={platformsGenres.genres} />
                ) : <EmptyState icon={<BarChart3 className="w-6 h-6" />} title="No data yet" compact />}
            </SectionCard>

            {/* Gamer IDs */}
            {hasGamertags && (
                <div className="lg:col-span-1"><GamertagsCard tags={gamertags!} /></div>
            )}

            {/* PC Specs */}
            {hasSpecs && (
                <div className="lg:col-span-1"><SpecsCard specs={pcSpecs!} /></div>
            )}

            {!hasGamertags && !hasSpecs && (
                <SectionCard title="Gamer IDs & Rig" icon={<Cpu className="w-4 h-4 text-white/50" />} className="lg:col-span-2">
                    <EmptyState icon={<Cpu className="w-6 h-6" />} title="No gamertags or PC specs added" hint="Add them from Settings to show your setup here." />
                </SectionCard>
            )}
        </div>
    );
}
