"use client";

import { motion } from "framer-motion";
import { QUARTERS } from "@/lib/roadmapData";
import { CheckCircle2, Circle, Clock, Calendar } from "lucide-react";

export default function RoadmapTimeline() {
    // Current quarter (for demo, Q1 is in progress)
    const currentQuarter = 0;

    return (
        <section className="container mx-auto px-4 py-20 max-w-5xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full mb-4">
                    <Calendar className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">2026 Journey</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
                    Our Quarterly Roadmap
                </h2>
            </motion.div>

            <div className="relative">
                {/* Vertical connecting line */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-[var(--border)] transform md:-translate-x-1/2" />

                {/* Progress line */}
                <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${((currentQuarter + 1) / QUARTERS.length) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute left-8 md:left-1/2 top-0 w-0.5 bg-gradient-to-b from-[var(--accent)] to-[var(--accent)]/20 transform md:-translate-x-1/2"
                />

                {/* Quarter items */}
                <div className="space-y-16">
                    {QUARTERS.map((quarter, index) => {
                        const isCompleted = index < currentQuarter;
                        const isCurrent = index === currentQuarter;
                        const isPending = index > currentQuarter;
                        const isLeft = index % 2 === 0;

                        return (
                            <motion.div
                                key={quarter.id}
                                initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ delay: index * 0.2, duration: 0.6 }}
                                className={`relative flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row gap-8`}
                            >
                                {/* Timeline node */}
                                <div className="flex-shrink-0 relative z-10">
                                    {/* Glow effect */}
                                    {isCurrent && (
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.5, 0, 0.5],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="absolute inset-0 rounded-full bg-[var(--accent)]"
                                        />
                                    )}

                                    {/* Circle */}
                                    <div
                                        className={`
                                            relative w-16 h-16 rounded-full flex items-center justify-center
                                            border-4 transition-all duration-300
                                            ${isCurrent ? 'bg-[var(--accent)] border-[var(--accent)] shadow-lg shadow-[var(--accent)]/50' : ''}
                                            ${isCompleted ? 'bg-green-500 border-green-500' : ''}
                                            ${isPending ? 'bg-[var(--bg-card)] border-[var(--border)]' : ''}
                                        `}
                                    >
                                        {isCompleted && <CheckCircle2 className="w-7 h-7 text-white" />}
                                        {isCurrent && (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Clock className="w-7 h-7 text-white" />
                                            </motion.div>
                                        )}
                                        {isPending && <Circle className="w-7 h-7 text-[var(--text-muted)]" />}
                                    </div>
                                </div>

                                {/* Content card */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'} text-left`}
                                >
                                    <div className="relative group">
                                        {/* Glow on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${isCurrent ? 'from-[var(--accent)]/20' : 'from-[var(--accent)]/10'} to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                        <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/30 transition-all duration-300">
                                            {/* Status badge */}
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 ${isCurrent ? 'bg-[var(--accent)]/20 border border-[var(--accent)]' : isCompleted ? 'bg-green-500/20 border border-green-500' : 'bg-[var(--bg-elevated)] border border-[var(--border)]'}`}>
                                                <span className={`text-xs font-bold ${isCurrent ? 'text-[var(--accent)]' : isCompleted ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                                                    {isCurrent ? 'IN PROGRESS' : isCompleted ? 'COMPLETED' : 'PLANNED'}
                                                </span>
                                            </div>

                                            <h3 className={`text-2xl font-bold mb-2 ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                                                {quarter.label}
                                            </h3>
                                            <p className="text-sm text-[var(--text-muted)] mb-3">
                                                {quarter.months}
                                            </p>
                                            <p className="text-lg font-semibold text-[var(--text-secondary)]">
                                                {quarter.description}
                                            </p>

                                            {/* Progress bar for current quarter */}
                                            {isCurrent && (
                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs text-[var(--text-muted)]">Progress</span>
                                                        <span className="text-xs font-bold text-[var(--accent)]">25%</span>
                                                    </div>
                                                    <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: "25%" }}
                                                            viewport={{ once: true }}
                                                            transition={{ duration: 1, delay: 0.5 }}
                                                            className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/60 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Spacer for desktop alternating layout */}
                                <div className="hidden md:block flex-1" />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
