"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Play } from "lucide-react";
import Gta6Countdown from "./Gta6Countdown";

function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Gta6HubHero() {
    return (
        <section className="relative w-full overflow-hidden gta6-grain bg-[var(--surface-0)] min-h-[560px] md:min-h-[660px]">
            {/* Background key art (full-bleed) */}
            <div className="absolute inset-0">
                <Image
                    src="/gta6/hero.jpg"
                    alt="Grand Theft Auto VI — Jason and Lucia in Vice City"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-[68%_center]"
                />
            </div>

            {/* Scrims (subjects sit right) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)] via-[var(--surface-0)]/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-transparent to-transparent" />
            <div className="absolute inset-0 gta6-sunset opacity-50 mix-blend-screen pointer-events-none" />

            {/* Content */}
            <div className="relative container-page py-12 md:py-16 flex flex-col justify-center min-h-[560px] md:min-h-[660px]">
                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-xl"
                >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/45 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-5 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gta-pink)] animate-pulse" />
                            The Hype Is Real
                        </div>

                        {/* Official GTA VI logo */}
                        <h1 className="mb-5">
                            <Image
                                src="/gta6/logo.png"
                                alt="Grand Theft Auto VI"
                                width={420}
                                height={340}
                                priority
                                className="w-[220px] sm:w-[290px] md:w-[350px] h-auto drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]"
                            />
                        </h1>

                        <p className="text-white/85 text-[14px] md:text-[16px] max-w-md mb-7 drop-shadow">
                            Vice City is calling. Explore everything we know about GTA 6 — news, trailers,
                            maps, characters, gameplay &amp; more.
                        </p>

                        {/* Release date + countdown */}
                        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-8">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 mb-1">Release Date</p>
                                <p className="font-display text-[20px] md:text-[24px] font-black text-white">Nov 19, 2026</p>
                            </div>
                            <Gta6Countdown />
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => scrollTo("preorder")}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-card)] bg-[var(--gta-pink)] text-white text-[13px] font-bold uppercase tracking-wide hover:bg-[#ff1a7a] transition-colors gta6-glow-pink"
                            >
                                <ShoppingCart className="w-4 h-4" /> Pre-order Now
                            </button>
                            <button
                                onClick={() => scrollTo("trailers")}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-card)] bg-white/8 border border-white/25 text-white text-[13px] font-bold uppercase tracking-wide hover:border-[var(--gta-cyan)]/60 hover:bg-white/12 transition-colors backdrop-blur-sm"
                            >
                                <Play className="w-4 h-4 fill-white" /> Watch Trailer
                            </button>
                        </div>
                    </motion.div>
            </div>

            <div className="gta6-accent-line absolute bottom-0 left-0 right-0" />
        </section>
    );
}
