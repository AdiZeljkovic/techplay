"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
    {
        quote: "TechPlay delivered exceptional ROI. The audience engagement was phenomenal, and we saw a 340% increase in qualified leads. Best tech advertising platform we've worked with.",
        author: "Sarah Chen",
        role: "Marketing Director",
        company: "HyperX Gaming",
        avatar: "SC",
        rating: 5,
        color: "from-red-500 to-pink-500",
        metrics: [
            { label: "ROI", value: "+340%" },
            { label: "CTR", value: "4.8%" },
        ]
    },
    {
        quote: "The quality of TechPlay's audience is unmatched. We achieved our campaign goals in half the expected time. Their team provided excellent support throughout.",
        author: "Marcus Rodriguez",
        role: "Brand Manager",
        company: "Nvidia GeForce",
        avatar: "MR",
        rating: 5,
        color: "from-green-500 to-emerald-500",
        metrics: [
            { label: "Reach", value: "3.8M" },
            { label: "Conv.", value: "6.2%" },
        ]
    },
    {
        quote: "Perfect platform for reaching engaged gamers in the Balkans region. The analytics dashboard is comprehensive and the reporting is transparent. Highly recommended.",
        author: "Ana Marković",
        role: "Regional Manager",
        company: "Logitech G",
        avatar: "AM",
        rating: 5,
        color: "from-blue-500 to-cyan-500",
        metrics: [
            { label: "Engagement", value: "92K" },
            { label: "Brand Lift", value: "+67%" },
        ]
    },
];

export default function Testimonials() {
    return (
        <section className="relative">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.author}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            whileHover={{ y: -8 }}
                            className="relative group"
                        >
                            <div className="relative h-full p-8 rounded-2xl
                                          bg-white/[0.02] border border-white/[0.06]
                                          hover:bg-white/[0.04] hover:border-white/[0.1]
                                          transition-all duration-700 overflow-hidden">
                                {/* Gradient background on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.color}
                                               opacity-0 group-hover:opacity-[0.05]
                                               transition-opacity duration-700`} />

                                {/* Quote icon */}
                                <div className="relative z-10 mb-6">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${testimonial.color}
                                                   flex items-center justify-center shadow-lg
                                                   group-hover:scale-110 transition-transform duration-500`}>
                                        <Quote className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="relative z-10 flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>

                                {/* Quote text */}
                                <div className="relative z-10 mb-6">
                                    <p className="text-white/70 leading-relaxed text-sm">
                                        "{testimonial.quote}"
                                    </p>
                                </div>

                                {/* Metrics */}
                                <div className="relative z-10 flex gap-3 mb-6">
                                    {testimonial.metrics.map((metric) => (
                                        <div key={metric.label}
                                             className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                            <div className="text-xs text-white/40 mb-0.5">{metric.label}</div>
                                            <div className="text-sm font-black text-[var(--accent)]">{metric.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Author */}
                                <div className="relative z-10 flex items-center gap-4 pt-6 border-t border-white/[0.06]">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color}
                                                   flex items-center justify-center shadow-lg flex-shrink-0`}>
                                        <span className="text-white text-sm font-black">{testimonial.avatar}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{testimonial.author}</div>
                                        <div className="text-xs text-white/50">{testimonial.role}</div>
                                        <div className="text-xs text-white/40">{testimonial.company}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
