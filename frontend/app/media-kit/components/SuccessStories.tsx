"use client";

import { motion } from "framer-motion";
import { TrendingUp, Eye, Users, Target, ArrowUpRight } from "lucide-react";

const caseStudies = [
    {
        brand: "HyperX Gaming",
        category: "Gaming Peripherals",
        objective: "Launch new wireless headset lineup",
        color: "from-red-500 to-pink-500",
        metrics: [
            { icon: Eye, label: "Impressions", value: "2.4M", change: "+340%" },
            { icon: Users, label: "Engagement", value: "85K", change: "+215%" },
            { icon: TrendingUp, label: "CTR", value: "4.8%", change: "+190%" },
        ],
        testimonial: "TechPlay delivered exceptional results. The engagement quality was outstanding.",
        author: "Sarah Chen, Marketing Director",
        duration: "30 days",
        adFormats: ["Billboard", "Sponsored Review", "Native"],
    },
    {
        brand: "Nvidia GeForce",
        category: "Graphics Cards",
        objective: "RTX 40 Series awareness campaign",
        color: "from-green-500 to-emerald-500",
        metrics: [
            { icon: Eye, label: "Impressions", value: "3.8M", change: "+425%" },
            { icon: Users, label: "Clicks", value: "124K", change: "+310%" },
            { icon: Target, label: "Conv. Rate", value: "6.2%", change: "+280%" },
        ],
        testimonial: "The tech-savvy TechPlay audience delivered quality leads and real conversions.",
        author: "Marcus Rodriguez, Brand Manager",
        duration: "45 days",
        adFormats: ["Takeover", "Video", "Sponsored Content"],
    },
    {
        brand: "Logitech G",
        category: "Gaming Gear",
        objective: "Increase brand awareness in Balkans",
        color: "from-blue-500 to-cyan-500",
        metrics: [
            { icon: Eye, label: "Reach", value: "1.9M", change: "+280%" },
            { icon: Users, label: "Engagement", value: "92K", change: "+245%" },
            { icon: TrendingUp, label: "Brand Lift", value: "+67%", change: "+67%" },
        ],
        testimonial: "Perfect platform for reaching engaged gamers in the region.",
        author: "Ana Marković, Regional Manager",
        duration: "60 days",
        adFormats: ["Display", "Native", "Social"],
    },
];

export default function SuccessStories() {
    return (
        <section className="relative">
            <div className="container mx-auto px-4">
                <div className="space-y-8">
                    {caseStudies.map((study, index) => (
                        <motion.div
                            key={study.brand}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, delay: index * 0.2 }}
                            className="group"
                        >
                            <div className="relative rounded-3xl overflow-hidden
                                          bg-white/[0.02] border border-white/[0.06]
                                          hover:bg-white/[0.04] hover:border-white/[0.1]
                                          transition-all duration-700">
                                {/* Gradient accent */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${study.color}
                                               opacity-60 group-hover:opacity-100 group-hover:h-1.5
                                               transition-all duration-500`} />

                                <div className="p-8 md:p-10">
                                    <div className="grid lg:grid-cols-5 gap-8">
                                        {/* Left — Brand info */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Brand header */}
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${study.color}
                                                                   flex items-center justify-center shadow-lg
                                                                   group-hover:scale-110 transition-transform duration-500`}>
                                                        <span className="text-white text-xl font-black">
                                                            {study.brand.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-white">{study.brand}</h3>
                                                        <p className="text-sm text-white/40 font-medium">{study.category}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-white/30">
                                                    <Target className="w-3 h-3" />
                                                    <span className="font-medium">{study.duration} Campaign</span>
                                                </div>
                                            </div>

                                            {/* Objective */}
                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                <div className="text-xs text-[var(--accent)] font-bold uppercase tracking-wider mb-2">
                                                    Objective
                                                </div>
                                                <p className="text-sm text-white/70 leading-relaxed">
                                                    {study.objective}
                                                </p>
                                            </div>

                                            {/* Ad formats */}
                                            <div>
                                                <div className="text-xs text-white/40 font-medium uppercase tracking-wider mb-3">
                                                    Ad Formats Used
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {study.adFormats.map((format) => (
                                                        <span key={format}
                                                              className="px-3 py-1.5 rounded-lg bg-white/[0.04]
                                                                       border border-white/[0.06] text-xs text-white/60 font-semibold
                                                                       hover:bg-white/[0.08] hover:border-white/[0.12]
                                                                       transition-all duration-300">
                                                            {format}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right — Results */}
                                        <div className="lg:col-span-3 space-y-6">
                                            {/* Metrics grid */}
                                            <div>
                                                <div className="text-xs text-white/40 font-medium uppercase tracking-wider mb-4">
                                                    Campaign Results
                                                </div>
                                                <div className="grid sm:grid-cols-3 gap-4">
                                                    {study.metrics.map((metric, i) => (
                                                        <motion.div
                                                            key={metric.label}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            whileInView={{ opacity: 1, y: 0 }}
                                                            viewport={{ once: true }}
                                                            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                                            className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]
                                                                     hover:bg-white/[0.05] hover:border-white/[0.1]
                                                                     transition-all duration-500 group/metric"
                                                        >
                                                            {/* Icon */}
                                                            <div className="w-10 h-10 rounded-xl bg-white/[0.04] mb-4
                                                                          flex items-center justify-center
                                                                          group-hover/metric:bg-white/[0.08]
                                                                          transition-colors duration-500">
                                                                <metric.icon className="w-4 h-4 text-white/50" />
                                                            </div>

                                                            {/* Value */}
                                                            <div className="text-3xl font-black text-white mb-1">
                                                                {metric.value}
                                                            </div>

                                                            {/* Label */}
                                                            <div className="text-xs text-white/40 font-medium mb-3">
                                                                {metric.label}
                                                            </div>

                                                            {/* Change indicator */}
                                                            <div className="flex items-center gap-1.5">
                                                                <ArrowUpRight className="w-3 h-3 text-green-400" />
                                                                <span className="text-xs font-bold text-green-400">
                                                                    {metric.change}
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Testimonial */}
                                            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01]
                                                          border border-white/[0.06]">
                                                {/* Quote mark */}
                                                <div className={`absolute top-4 left-4 text-6xl font-black
                                                               bg-gradient-to-br ${study.color} bg-clip-text text-transparent
                                                               opacity-20 leading-none`}>
                                                    "
                                                </div>

                                                <div className="relative z-10">
                                                    <p className="text-white/80 leading-relaxed mb-4 italic">
                                                        "{study.testimonial}"
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${study.color}`} />
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{study.author}</div>
                                                            <div className="text-xs text-white/40">{study.brand}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA at bottom */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="mt-12 text-center"
                >
                    <p className="text-white/50 text-sm mb-4">
                        Ready to achieve similar results?
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 px-8 py-4
                                 bg-white/[0.04] border border-white/[0.1]
                                 text-white font-bold rounded-2xl
                                 hover:bg-white/[0.08] hover:border-white/[0.15]
                                 transition-all duration-500"
                    >
                        View Your Custom Proposal
                        <ArrowUpRight className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}
