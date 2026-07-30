"use client";

import Link from "next/link";
import { Gamepad2, Wand2 } from "lucide-react";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import type { DashboardGameCover } from "@/lib/types/dashboard";

export default function RecommendedNext({ games }: { games: DashboardGameCover[] }) {
    if (!games.length) return null;

    return (
        <SectionCard
            title="Recommended Next"
            icon={<Wand2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "Backlog Advisor", href: "/backlog-advisor" }}
            bodyClassName="space-y-2"
        >
            {games.map((g) => (
                <Link
                    key={g.slug}
                    href={`/games/${g.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                    <div className="relative w-[72px] h-[44px] rounded-lg overflow-hidden shrink-0 bg-white/5">
                        {g.background_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.background_image} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-4 h-4" /></div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors">{g.name}</p>
                        <p className="text-[11px] text-white/40">In your backlog</p>
                    </div>
                </Link>
            ))}
        </SectionCard>
    );
}
