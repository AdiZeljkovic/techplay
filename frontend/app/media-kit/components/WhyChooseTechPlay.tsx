"use client";

import { motion } from "framer-motion";
import { Check, X, Zap, Target, TrendingUp, Shield, Clock, Award } from "lucide-react";

const features = [
    {
        category: "Audience Quality",
        icon: Target,
        items: [
            { feature: "Tech-Savvy Audience", techplay: true, others: "partial", description: "98% tech enthusiasts" },
            { feature: "Gaming Focus", techplay: true, others: false, description: "Dedicated gaming coverage" },
            { feature: "Purchase Intent", techplay: "92%", others: "60%", description: "High conversion potential" },
            { feature: "Age 18-34", techplay: "77%", others: "45%", description: "Prime demographic" },
        ]
    },
    {
        category: "Ad Performance",
        icon: TrendingUp,
        items: [
            { feature: "Average CTR", techplay: "4.2%", others: "1.8%", description: "Industry-leading engagement" },
            { feature: "Viewability Rate", techplay: "95%", others: "72%", description: "Premium placements" },
            { feature: "Ad Fraud Protection", techplay: true, others: "partial", description: "Verified traffic only" },
            { feature: "Brand Safety", techplay: true, others: true, description: "Strict content guidelines" },
        ]
    },
    {
        category: "Service & Support",
        icon: Award,
        items: [
            { feature: "Dedicated Account Manager", techplay: true, others: false, description: "Personal support" },
            { feature: "Real-Time Analytics", techplay: true, others: "partial", description: "Live dashboard access" },
            { feature: "Custom Integrations", techplay: true, others: false, description: "Tailored solutions" },
            { feature: "24/7 Support", techplay: true, others: "partial", description: "Always available" },
        ]
    },
];

function ComparisonIcon({ value }: { value: boolean | string }) {
    if (value === true) {
        return (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-400" strokeWidth={3} />
            </div>
        );
    }
    if (value === false) {
        return (
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-4 h-4 text-red-400" strokeWidth={3} />
            </div>
        );
    }
    if (value === "partial") {
        return (
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
            </div>
        );
    }
    // It's a percentage or number
    return (
        <div className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <span className="text-xs font-black text-[var(--accent)]">{value}</span>
        </div>
    );
}

export default function WhyChooseTechPlay() {
    return (
        <section className="relative">
            <div className="container mx-auto px-4 space-y-12">
                {/* Top stats cards */}
                <div className="grid md:grid-cols-4 gap-4">
                    {[
                        { icon: Zap, value: "2.3x", label: "Higher Engagement", color: "from-yellow-500 to-orange-500" },
                        { icon: Target, value: "4.2%", label: "Average CTR", color: "from-blue-500 to-cyan-500" },
                        { icon: Shield, value: "99.8%", label: "Traffic Quality", color: "from-green-500 to-emerald-500" },
                        { icon: Clock, value: "3:45", label: "Avg. Session Time", color: "from-purple-500 to-pink-500" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ y: -4 }}
                            className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]
                                     hover:bg-white/[0.04] hover:border-white/[0.1]
                                     transition-all duration-500 group overflow-hidden"
                        >
                            {/* Gradient background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0
                                           group-hover:opacity-[0.05] transition-opacity duration-500`} />

                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-4
                                               flex items-center justify-center shadow-lg
                                               group-hover:scale-110 transition-transform duration-500`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                                <div className="text-xs text-white/50 font-medium">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Comparison tables */}
                <div className="space-y-8">
                    {features.map((section, sectionIndex) => (
                        <motion.div
                            key={section.category}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: sectionIndex * 0.2, duration: 0.6 }}
                            className="relative rounded-2xl overflow-hidden
                                     bg-white/[0.02] border border-white/[0.06]"
                        >
                            {/* Section header */}
                            <div className="flex items-center gap-3 px-8 py-6 bg-white/[0.02] border-b border-white/[0.04]">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                                    <section.icon className="w-5 h-5 text-[var(--accent)]" />
                                </div>
                                <h3 className="text-xl font-black text-white">{section.category}</h3>
                            </div>

                            {/* Comparison table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/[0.04]">
                                            <th className="text-left px-8 py-4 text-sm font-bold text-white/60 uppercase tracking-wider">
                                                Feature
                                            </th>
                                            <th className="text-center px-6 py-4 text-sm font-bold uppercase tracking-wider">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                                                        <span className="text-white text-xs font-black">TP</span>
                                                    </div>
                                                    <span className="bg-gradient-to-r from-[var(--accent)] to-orange-500
                                                                   bg-clip-text text-transparent">
                                                        TechPlay
                                                    </span>
                                                </div>
                                            </th>
                                            <th className="text-center px-6 py-4 text-sm font-bold text-white/40 uppercase tracking-wider">
                                                Others
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.items.map((item, i) => (
                                            <motion.tr
                                                key={item.feature}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.1 * i, duration: 0.4 }}
                                                className="border-b border-white/[0.02] last:border-0
                                                         hover:bg-white/[0.02] transition-colors duration-300"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="font-semibold text-white/80 mb-1">{item.feature}</div>
                                                    <div className="text-xs text-white/40">{item.description}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <ComparisonIcon value={item.techplay} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <ComparisonIcon value={item.others} />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="relative rounded-2xl overflow-hidden p-8 text-center"
                    style={{
                        background: "linear-gradient(135deg, rgba(252, 65, 0, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)"
                    }}
                >
                    <div className="absolute inset-0 border border-white/[0.08] rounded-2xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                                      bg-[var(--accent)]/10 border border-[var(--accent)]/20 mb-4">
                            <Award className="w-4 h-4 text-[var(--accent)]" />
                            <span className="text-[var(--accent)] text-sm font-bold">Premium Partner Tier</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
                            Experience The Difference
                        </h3>
                        <p className="text-white/60 max-w-2xl mx-auto mb-6">
                            Join leading brands that trust TechPlay for their gaming & tech marketing campaigns.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-3 px-8 py-4
                                     bg-gradient-to-r from-[var(--accent)] to-orange-600
                                     text-white font-bold rounded-2xl shadow-lg shadow-[var(--accent)]/25
                                     hover:shadow-xl hover:shadow-[var(--accent)]/40
                                     transition-shadow duration-500"
                        >
                            Get Your Custom Media Plan
                            <Zap className="w-5 h-5" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
