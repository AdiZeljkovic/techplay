"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Compass } from "lucide-react";
import { Article } from "@/types";
import HeroSlider from "./HeroSlider";

const STATS = [
    { value: "200K+", label: "Games in database" },
    { value: "Daily", label: "Release tracking" },
    { value: "Live", label: "Player community" },
];

/**
 * Public homepage hero. Left: value prop + search + CTAs + stat row.
 * Right: featured-stories slider behind a signature diagonal seam.
 * Guests only — logged-in users get the dashboard via HomeGate.
 */
export default function HomeHero({ heroArticles }: { heroArticles: Article[] }) {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (q) router.push(`/games?search=${encodeURIComponent(q)}`);
    };

    return (
        <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)] lg:min-h-[500px]">
            {/* Crown */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] z-20 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

            {/* Ambient: HUD grid fading out to the right + accent glow behind the copy */}
            <div
                aria-hidden
                className="absolute inset-0 bg-hud-grid pointer-events-none"
                style={{ maskImage: "linear-gradient(to right, black 0%, transparent 55%)", WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 55%)" }}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute -left-32 -top-32 w-[520px] h-[520px] rounded-full opacity-[0.08]"
                style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-2">
                {/* ── Copy + search + CTAs ── */}
                <div className="relative z-10 p-6 py-10 md:p-12 flex flex-col justify-center">
                    <p className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">
                        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                        The Gamer Platform
                    </p>

                    <h1 className="font-display text-[38px] md:text-[50px] font-black leading-[1.02] text-[var(--ink-hi)]">
                        Your gaming world.
                        <br />
                        <span className="text-[var(--accent)]">All in one place.</span>
                    </h1>

                    <p className="mt-5 text-[15px] text-[var(--ink-mid)] leading-relaxed max-w-[420px]">
                        Discover games, track releases, read trusted reviews, and connect with a community that plays.
                    </p>

                    <form onSubmit={submitSearch} className="mt-7 max-w-[440px]">
                        <div className="flex items-center gap-2 h-[52px] pl-4 pr-1.5 rounded-[var(--radius-card)] bg-[var(--surface-0)]/70 backdrop-blur-sm border border-[var(--line-strong)] focus-within:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] focus-within:shadow-[var(--glow-accent)] transition-all duration-300">
                            <Search className="w-4 h-4 text-[var(--ink-faint)] shrink-0" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search 200,000+ games..."
                                aria-label="Search games"
                                className="flex-1 min-w-0 bg-transparent text-[14px] text-white placeholder:text-[var(--ink-faint)] outline-none"
                            />
                            <button
                                type="submit"
                                aria-label="Search"
                                className="shrink-0 w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] hover:bg-[var(--accent)] text-[var(--ink-low)] hover:text-white flex items-center justify-center transition-colors duration-300"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-7 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                        >
                            <UserPlus className="w-4 h-4" /> Create Your Profile
                        </Link>
                        <Link
                            href="/games"
                            className="inline-flex items-center gap-2 px-7 h-12 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            <Compass className="w-4 h-4" /> Explore Games
                        </Link>
                    </div>

                    {/* Stat row — Command Numerals over hairline dividers */}
                    <div className="mt-9 pt-6 border-t border-[var(--line)] grid grid-cols-3 max-w-[440px]">
                        {STATS.map((stat, i) => (
                            <div key={stat.label} className={i > 0 ? "pl-5 border-l border-[var(--line)]" : ""}>
                                <p className="font-display text-[20px] font-bold tabular-nums text-[var(--ink-hi)] leading-none">
                                    {stat.value}
                                </p>
                                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-faint)] leading-tight">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Featured stories slider behind the diagonal seam ── */}
                <div className="relative min-h-[340px] sm:min-h-[400px] lg:min-h-0">
                    {/* accent sliver along the diagonal cut */}
                    <div
                        aria-hidden
                        className="hidden lg:block absolute inset-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--accent)_55%,transparent)] to-transparent"
                        style={{ clipPath: "polygon(9.5% 0, 10% 0, 0.5% 100%, 0% 100%)" }}
                    />
                    <div
                        className="absolute inset-0 lg:[clip-path:polygon(10%_0,100%_0,100%_100%,0%_100%)]"
                    >
                        <HeroSlider articles={heroArticles} />
                    </div>
                </div>
            </div>
        </section>
    );
}
