"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Map as MapIcon, BookOpen, Calendar } from "lucide-react";
import Gta6Countdown from "./Gta6Countdown";

export default function Gta6HubHero() {
    return (
        <section className="relative w-full overflow-hidden gta6-grain bg-[#05070A]">
            {/* Background key art */}
            <div className="absolute inset-0">
                <Image
                    src="/gta6/hero.jpg"
                    alt="Grand Theft Auto VI — Jason and Lucia in Vice City"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                />
            </div>

            {/* Scrims for legibility (subjects sit center/right) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/90 via-[#05070A]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/50 via-transparent to-transparent" />
            <div className="absolute inset-0 gta6-sunset opacity-70 mix-blend-screen pointer-events-none" />

            {/* Content */}
            <div className="relative max-w-[1320px] mx-auto px-4 xl:px-8 min-h-[78vh] md:min-h-[86vh] flex flex-col justify-end pb-12 md:pb-16 pt-28">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-2xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/40 text-white text-[11px] font-bold uppercase tracking-widest mb-5 backdrop-blur-sm">
                        <Calendar className="w-3 h-3 text-[var(--gta-pink)]" />
                        Releases November 19, 2026
                    </div>

                    <p className="text-[var(--gta-cyan)] font-bold tracking-[0.3em] text-[12px] md:text-[13px] uppercase mb-2">
                        The Wait Is Almost Over
                    </p>
                    <h1 className="font-display text-[44px] sm:text-[64px] lg:text-[80px] font-black uppercase leading-[0.88] tracking-tight mb-4">
                        <span className="block text-white gta6-text-glow">Grand Theft</span>
                        <span className="block gta6-neon-text">Auto VI</span>
                    </h1>
                    <p className="text-[#E4E4E5] text-[15px] md:text-[17px] max-w-xl mb-8 drop-shadow">
                        Vice City returns. Your complete hub for everything GTA 6 — the interactive map,
                        characters, vehicles, weapons and the latest news.
                    </p>

                    <div className="mb-9">
                        <Gta6Countdown />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/gta6/map"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--gta-pink)] text-white text-[14px] font-bold hover:bg-[#ff1a7a] transition-colors gta6-glow-pink"
                        >
                            <MapIcon className="w-4 h-4" /> Explore the Map
                        </Link>
                        <Link
                            href="/gta6/everything-we-know"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/8 border border-white/20 text-white text-[14px] font-bold hover:border-[var(--gta-cyan)]/60 hover:bg-white/12 transition-colors backdrop-blur-sm"
                        >
                            <BookOpen className="w-4 h-4" /> Everything We Know
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Animated sunset accent line at the bottom */}
            <div className="gta6-accent-line absolute bottom-0 left-0 right-0" />
        </section>
    );
}
