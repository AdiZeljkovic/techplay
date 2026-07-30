"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Gamepad2, CalendarDays, Users, UserPlus, Compass } from "lucide-react";
import { Article } from "@/types";

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
    const featured = heroArticles.find((a) => a.featured_image_url) ?? null;

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (q) router.push(`/games?search=${encodeURIComponent(q)}`);
    };

    return (
        <section className="relative rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-white/[0.06]">
            <span className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-[var(--accent)]/70 via-[var(--accent)]/15 to-transparent z-10" />
            <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Copy + search + CTAs */}
                <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center">
                    <h1 className="font-display text-[34px] md:text-[48px] font-black leading-[1.05] text-white">
                        Your gaming world.
                        <br />
                        <span className="text-[var(--accent)]">All in one place.</span>
                    </h1>
                    <p className="mt-4 text-[15px] text-white/55 max-w-md">
                        Discover games, track releases, read trusted reviews, and connect with a community that plays.
                    </p>

                    <form onSubmit={submitSearch} className="mt-6 max-w-md">
                        <div className="flex items-center gap-2 h-12 px-4 rounded-xl bg-white/[0.04] border border-white/10 focus-within:border-[var(--accent)]/50 transition-colors">
                            <Search className="w-4 h-4 text-white/35 shrink-0" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search games, news, guides..."
                                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 outline-none"
                            />
                        </div>
                    </form>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link
                            href="/games"
                            className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-[var(--accent)] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors"
                        >
                            <Compass className="w-4 h-4" /> Explore Games
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] font-bold uppercase tracking-wider hover:border-[var(--accent)]/40 transition-colors"
                        >
                            <UserPlus className="w-4 h-4" /> Create Your Profile
                        </Link>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/[0.05] flex flex-wrap items-center gap-x-8 gap-y-3">
                        {STAT_CHIPS.map((chip) => (
                            <div key={chip.title} className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                                    <chip.icon className="w-4 h-4 text-[var(--accent)]" />
                                </span>
                                <div>
                                    <p className="text-[13px] font-bold text-white leading-tight">{chip.title}</p>
                                    <p className="text-[11px] text-white/40">{chip.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Featured visual (current hero article) */}
                <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-0">
                    {featured ? (
                        <Link href={`/news/${featured.slug}`} className="group absolute inset-0 block">
                            <Image
                                src={featured.featured_image_url!}
                                alt={featured.title}
                                fill
                                priority
                                className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-[var(--bg-card)] lg:via-transparent lg:to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1.5">Featured</p>
                                <p className="text-[15px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                    {featured.title}
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/15 via-transparent to-transparent" />
                    )}
                </div>
            </div>
        </section>
    );
}
