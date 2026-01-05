"use client";

import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[#0b0c15] z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-teal/20 rounded-full blur-[120px] animate-pulse delay-1000" />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            <div className="container relative z-10 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neon-cyan text-sm mb-6 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">The Next Gen of Tech Media</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight leading-tight">
                        Stay Ahead of the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-teal via-white to-neon-purple drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                            Game & Tech World
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Your ultimate destination for in-depth reviews, breaking news, and community-driven discussions on the latest in gaming and technology.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/news">
                            <Button size="lg" variant="primary" className="min-w-[180px] bg-neon-teal hover:bg-neon-cyan text-black font-bold">
                                Latest News
                            </Button>
                        </Link>
                        <Link href="/reviews">
                            <Button size="lg" variant="secondary" className="min-w-[180px] group">
                                Read Reviews
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <span className="text-xs uppercase tracking-widest">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-neon-teal to-transparent" />
            </motion.div>
        </section>
    );
}
