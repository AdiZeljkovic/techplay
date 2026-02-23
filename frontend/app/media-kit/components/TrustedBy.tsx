"use client";

import { motion } from "framer-motion";

const partners = [
    { name: "IGN", logo: "IGN", color: "from-red-500 to-red-600" },
    { name: "GameSpot", logo: "GS", color: "from-yellow-500 to-orange-500" },
    { name: "PC Gamer", logo: "PC", color: "from-blue-500 to-cyan-500" },
    { name: "Kotaku", logo: "KT", color: "from-purple-500 to-pink-500" },
    { name: "Polygon", logo: "PG", color: "from-green-500 to-emerald-500" },
    { name: "Eurogamer", logo: "EG", color: "from-indigo-500 to-blue-500" },
];

export default function TrustedBy() {
    return (
        <section className="relative py-16 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />

            <div className="relative container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <span className="text-white/40 text-xs font-semibold uppercase tracking-[0.2em] block mb-3">
                        Featured In & Trusted By
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white/60">
                        Industry Recognition
                    </h3>
                </motion.div>

                {/* Logo grid */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
                    {partners.map((partner, i) => (
                        <motion.div
                            key={partner.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ y: -4, scale: 1.05 }}
                            className="relative group"
                        >
                            <div className="aspect-[3/2] rounded-xl bg-white/[0.02] border border-white/[0.04]
                                          hover:bg-white/[0.04] hover:border-white/[0.08]
                                          transition-all duration-500 flex items-center justify-center
                                          backdrop-blur-xl overflow-hidden">
                                {/* Gradient overlay on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${partner.color} opacity-0
                                               group-hover:opacity-[0.08] transition-opacity duration-500`} />

                                {/* Logo */}
                                <div className="relative z-10 flex flex-col items-center gap-1">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${partner.color}
                                                   flex items-center justify-center shadow-lg
                                                   group-hover:scale-110 transition-transform duration-500`}>
                                        <span className="text-white text-xs font-black">{partner.logo}</span>
                                    </div>
                                    <span className="text-white/50 text-[9px] font-bold group-hover:text-white/70
                                                   transition-colors duration-500">
                                        {partner.name}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Stats bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="mt-12 grid grid-cols-3 gap-6 max-w-3xl mx-auto"
                >
                    {[
                        { value: "15+", label: "Media Partners" },
                        { value: "50K+", label: "Cross-Platform Reach" },
                        { value: "98%", label: "Trust Rating" },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl md:text-3xl font-black text-white mb-1">{stat.value}</div>
                            <div className="text-xs text-white/40 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
