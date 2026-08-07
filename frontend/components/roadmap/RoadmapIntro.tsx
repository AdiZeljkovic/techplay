"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, Users, Zap } from "lucide-react";

export default function RoadmapIntro() {
    const highlights = [
        { icon: Target, label: "Clear Vision", description: "Strategic goals for 2026" },
        { icon: Users, label: "Community First", description: "Built for gamers, by gamers" },
        { icon: Zap, label: "Innovation", description: "Cutting-edge features" },
    ];

    return (
        <section className="relative container mx-auto px-4 py-20 max-w-6xl">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-[var(--accent)] opacity-5 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500 opacity-5 blur-[100px] rounded-full" />
            </div>

            <div className="relative">
                {/* Main intro */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full mb-6">
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-sm font-semibold text-[var(--accent)]">The Future is Here</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                        Building the Ultimate Gaming Platform
                    </h2>

                    <p className="text-lg md:text-xl text-white/55 leading-relaxed max-w-3xl mx-auto">
                        At TechPlay, we're constantly evolving to bring you the best gaming and tech experience.
                        Here's our roadmap for 2026 - a year of innovation, community growth, and groundbreaking features.
                    </p>
                </motion.div>

                {/* Highlight cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {highlights.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5 }}
                            className="relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-transparent rounded-[var(--radius-panel)] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-panel)] p-6 text-center h-full">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-[var(--radius-card)] bg-[var(--accent)]/10 flex items-center justify-center">
                                    <item.icon className="w-6 h-6 text-[var(--accent)]" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.label}</h3>
                                <p className="text-sm text-white/35">{item.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
