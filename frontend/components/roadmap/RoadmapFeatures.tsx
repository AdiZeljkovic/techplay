"use client";

import { ROADMAP_2026, QUARTERS } from "@/lib/roadmapData";
import FeatureCard from "./FeatureCard";
import { motion } from "framer-motion";

export default function RoadmapFeatures() {
    return (
        <section className="container mx-auto px-4 py-16 max-w-7xl">
            {QUARTERS.map((quarter, quarterIndex) => {
                const features = ROADMAP_2026.filter(f => f.quarter === quarter.id);

                if (features.length === 0) return null;

                return (
                    <motion.div
                        key={quarter.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: quarterIndex * 0.1 }}
                        className="mb-24 last:mb-0"
                    >
                        {/* Quarter header */}
                        <div className="mb-8 pb-4 border-b border-[var(--line)]">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-2 h-8 bg-[var(--accent)] rounded-full" />
                                <h2 className="text-3xl md:text-4xl font-bold text-white">
                                    {quarter.label}
                                </h2>
                            </div>
                            <p className="text-white/35 ml-6 text-lg">
                                {quarter.description}
                            </p>
                        </div>

                        {/* Feature grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                <FeatureCard
                                    key={feature.id}
                                    feature={feature}
                                    index={index}
                                />
                            ))}
                        </div>
                    </motion.div>
                );
            })}
        </section>
    );
}
