"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Gamepad2, CalendarDays, Users, UserPlus, Compass } from "lucide-react";
import { Article } from "@/types";
import HeroSlider from "./HeroSlider";

const STAT_CHIPS = [
    { icon: Gamepad2, title: "200K+", sub: "Games in database" },
    { icon: CalendarDays, title: "Release calendar", sub: "Never miss a release" },
    { icon: Users, title: "Gaming community", sub: "Discuss. Share. Play." },
];

/**
 * Public homepage hero — value proposition + search + CTAs, with the current
 * hero article as the visual on the right. Guests only (logged-in users get
 * the dashboard via HomeGate).
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
        <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)] lg:min-h-[460px]">
            <span className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent z-10" />
            {/* ambient accent glow behind the copy */}
            <span
                aria-hidden
                className="pointer-events-none absolute -left-24 -top-24 w-[420px] h-[420px] rounded-full opacity-[0.07]"
                style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
            />
            <div className="relative grid grid-cols-1 lg:grid-cols-12">
                {/* Copy + search + CTAs */}
                <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center">
                    <h1 className="font-display text-[36px] md:text-[44px] font-black leading-[1.05] text-[var(--ink-hi)]">
                        Your gaming world.
                        <br />
                        <span className="text-[var(--accent)]">All in one place.</span>
                    </h1>
                    <p className="mt-4 text-[16px] text-[var(--ink-mid)] max-w-md">
                        Discover games, track releases, read trusted reviews, and connect with a community that plays.
                    </p>

                    <form onSubmit={submitSearch} className="mt-6 max-w-md">
                        <div className="flex items-center gap-2 h-12 pl-4 pr-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line-strong)] focus-within:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] transition-colors">
                            <Search className="w-4 h-4 text-[var(--ink-faint)] shrink-0" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search games, news, guides..."
                                aria-label="Search games"
                                className="flex-1 min-w-0 bg-transparent text-[14px] text-white placeholder:text-[var(--ink-faint)] outline-none"
                            />
                            <button
                                type="submit"
                                aria-label="Search"
                                className="shrink-0 w-9 h-9 rounded-lg bg-[var(--fill-2)] hover:bg-[var(--accent)] text-[var(--ink-low)] hover:text-white flex items-center justify-center transition-colors"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link
                            href="/games"
                            className="inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                        >
                            <Compass className="w-4 h-4" /> Explore Games
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            <UserPlus className="w-4 h-4" /> Create Your Profile
                        </Link>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[var(--line)] flex flex-wrap items-center gap-x-8 gap-y-3">
                        {STAT_CHIPS.map((chip) => (
                            <div key={chip.title} className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                                    <chip.icon className="w-4 h-4 text-[var(--accent)]" />
                                </span>
                                <div>
                                    <p className="font-display text-[13px] font-bold text-[var(--ink-hi)] leading-tight">{chip.title}</p>
                                    <p className="text-[11px] text-[var(--ink-low)]">{chip.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Featured stories slider */}
                <div className="lg:col-span-5 relative min-h-[320px] sm:min-h-[380px] lg:min-h-0">
                    <HeroSlider articles={heroArticles} />
                </div>
            </div>
        </section>
    );
}
