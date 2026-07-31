"use client";

import Link from "next/link";
import { Gamepad2, Heart, Star, Check, ChevronRight, Rocket } from "lucide-react";
import Panel from "@/components/ui/Panel";
import type { DashboardStats } from "@/lib/types/dashboard";

/** First missions — each one is checkable against real collection data. */
const STEPS = [
    {
        icon: Gamepad2,
        title: "Add your first game",
        hint: "Search 200,000+ titles and start your collection",
        href: "/games",
        done: (s: DashboardStats) => s.games_count > 0,
    },
    {
        icon: Heart,
        title: "Build a wishlist",
        hint: "Get notified when the games you want release",
        href: "/calendar",
        done: (s: DashboardStats) => s.wishlist_count > 0,
    },
    {
        icon: Star,
        title: "Star a favorite",
        hint: "Favorites headline your public profile",
        href: "/games",
        done: (s: DashboardStats) => s.favorites_count > 0,
    },
];

/** Shown while the collection is empty — the way in, as a mission list. */
export default function OnboardingCard({ stats }: { stats: DashboardStats }) {
    const states = STEPS.map((s) => s.done(stats));
    const completed = states.filter(Boolean).length;
    const percent = Math.round((completed / STEPS.length) * 100);

    return (
        <Panel
            title="Get Started"
            icon={<Rocket className="w-3.5 h-3.5 text-[var(--accent)]" />}
            crown
            bodyClassName="p-4"
        >
            {/* mission progress */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-[6px] rounded-full bg-[var(--track)] overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] transition-[width] duration-700 ease-[var(--ease-hud)]"
                        style={{
                            width: `${percent}%`,
                            boxShadow: "0 0 10px color-mix(in srgb, var(--accent) 45%, transparent)",
                        }}
                    />
                </div>
                <span className="font-display text-[11px] font-bold tabular-nums text-[var(--ink-low)] shrink-0">
                    {completed} / {STEPS.length}
                </span>
            </div>

            <div className="space-y-2">
                {STEPS.map((s, i) => {
                    const done = states[i];
                    return (
                        <Link
                            key={s.title}
                            href={s.href}
                            className={`group flex items-center gap-3.5 p-3 rounded-[var(--radius-card)] border transition-colors duration-300 tp-fade-up tp-d${i + 1} ${
                                done
                                    ? "border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
                                    : "border-[var(--line)] bg-[var(--fill-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-[var(--fill-2)]"
                            }`}
                        >
                            {/* step numeral / completion mark */}
                            <span
                                className={`w-10 h-10 shrink-0 rounded-[var(--radius-inner)] flex items-center justify-center transition-colors duration-300 ${
                                    done
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-[var(--fill-2)] border border-[var(--line)] text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white group-hover:border-transparent"
                                }`}
                            >
                                {done ? <Check className="w-5 h-5" strokeWidth={3} /> : <s.icon className="w-[18px] h-[18px]" />}
                            </span>

                            <span className="flex-1 min-w-0">
                                <span className="flex items-center gap-2">
                                    <span className="font-display text-[9px] font-bold tabular-nums text-[var(--ink-faint)]">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span
                                        className={`font-display text-[13px] font-bold transition-colors duration-300 ${
                                            done ? "text-[var(--ink-low)] line-through" : "text-[var(--ink-hi)] group-hover:text-[var(--accent)]"
                                        }`}
                                    >
                                        {s.title}
                                    </span>
                                </span>
                                <span className="block mt-0.5 text-[11px] text-[var(--ink-low)]">{s.hint}</span>
                            </span>

                            {!done && (
                                <ChevronRight className="w-4 h-4 shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all duration-300" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </Panel>
    );
}
