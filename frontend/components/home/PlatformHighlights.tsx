"use client";

import Link from "next/link";
import { Gamepad2, CalendarDays, MessageSquare, Star } from "lucide-react";

const CARDS = [
    { Icon: Gamepad2, title: "GAME DATABASE", description: "200,000+ games and counting. Search, filter, find your next obsession.", cta: "EXPLORE GAMES", href: "/games" },
    { Icon: CalendarDays, title: "RELEASE CALENDAR", description: "What's dropping this month? All platforms, all dates — one place.", cta: "VIEW CALENDAR", href: "/calendar" },
    { Icon: MessageSquare, title: "COMMUNITY FORUM", description: "Got a hot take? Drop it in the forum. We want to hear it.", cta: "JOIN THE FORUM", href: "/forum" },
    { Icon: Star, title: "REVIEWS & SCORES", description: "Honest reviews. Helpful scores. No sponsored opinions.", cta: "READ REVIEWS", href: "/reviews" },
];

export default function PlatformHighlights() {
    return (
        <section className="px-4 xl:px-0 max-w-[1320px] mx-auto mb-[80px]">
            <div className="bg-white dark:bg-[#05070A] rounded-[16px] border border-zinc-200 dark:border-tp-accent/40 shadow-sm dark:shadow-[0_0_30px_rgba(252,65,0,0.05)] p-8 lg:p-10 relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/20 dark:via-tp-accent/50 to-transparent" />
                <div className="absolute -top-[150px] -left-[100px] w-[400px] h-[400px] bg-tp-accent/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="mb-10 relative z-10 text-center lg:text-left">
                    <span className="text-tp-accent font-bold tracking-[0.15em] text-[11px] uppercase mb-3 block">
                        EXPLORE TECHPLAY.GG
                    </span>
                    <h2 className="font-display text-[28px] lg:text-[34px] font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
                        One platform for everything gaming
                    </h2>
                    <p className="text-zinc-600 dark:text-[#A1A1AA] text-[15px]">
                        Discover games, track releases, join the community, and read trusted reviews.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 relative z-10">
                    {CARDS.map((card) => (
                        <div key={card.href} className="relative overflow-hidden bg-zinc-50 dark:bg-[#0B0E14] rounded-[16px] border border-zinc-200 dark:border-[#161B22] hover:border-tp-accent/30 transition-all duration-300 p-6 lg:p-7 flex flex-col group shadow-sm dark:shadow-lg">
                            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-tp-accent scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 rounded-l-[16px]" />
                            <div className="w-[62px] h-[62px] mx-auto rounded-full border border-tp-accent bg-tp-accent/5 flex items-center justify-center mb-8 group-hover:shadow-[0_0_15px_rgba(252,65,0,0.2)] transition-all">
                                <div className="w-[48px] h-[48px] rounded-full bg-white dark:bg-[#1A1F26] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-none">
                                    <card.Icon className="w-[22px] h-[22px] text-tp-accent" strokeWidth={2} />
                                </div>
                            </div>
                            <div className="flex flex-col flex-1 text-center mb-8">
                                <h3 className="text-zinc-900 dark:text-white font-bold text-[15px] mb-3 font-sans uppercase tracking-widest leading-tight">{card.title}</h3>
                                <p className="text-zinc-500 dark:text-[#8B949E] text-[14px] leading-relaxed whitespace-pre-line">{card.description}</p>
                            </div>
                            <Link href={card.href} className="mt-auto bg-tp-accent hover:bg-tp-accent-hover text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-tp-accent/20">
                                {card.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
