"use client";

import { motion } from "framer-motion";

export default function RoadmapIntro() {
    return (
        <section className="container mx-auto px-4 py-16 max-w-4xl text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
                    At TechPlay, we're constantly evolving to bring you the best gaming and tech experience.
                    Here's what we're building in 2026 to make our community even stronger, smarter, and more connected.
                </p>
            </motion.div>
        </section>
    );
}
