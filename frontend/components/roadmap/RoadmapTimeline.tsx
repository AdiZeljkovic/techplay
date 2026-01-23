"use client";

import { motion } from "framer-motion";
import { QUARTERS } from "@/lib/roadmapData";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default function RoadmapTimeline() {
    // Current quarter (for demo, Q1 is in progress)
    const currentQuarter = 0;

    return (
        <section className="container mx-auto px-4 py-16">
            <div className="relative max-w-6xl mx-auto">
                {/* Progress line - desktop only */}
                <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-[var(--border)]" />
                <div
                    className="hidden md:block absolute top-8 left-0 h-1 bg-[var(--accent)] transition-all duration-1000"
                    style={{ width: `${(currentQuarter / (QUARTERS.length - 1)) * 100}%` }}
                />

                {/* Quarter markers */}
                <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
                    {QUARTERS.map((quarter, index) => {
                        const isCompleted = index < currentQuarter;
                        const isCurrent = index === currentQuarter;
                        const isPending = index > currentQuarter;

                        return (
                            <motion.div
                                key={quarter.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15, duration: 0.5 }}
                                className="flex flex-col items-center text-center"
                            >
                                {/* Circle indicator */}
                                <div
                                    className={`
                                        w-16 h-16 rounded-full flex items-center justify-center mb-4 z-10
                                        border-4 transition-all duration-300
                                        ${isCurrent ? 'bg-[var(--accent)] border-[var(--accent)] scale-110' : ''}
                                        ${isCompleted ? 'bg-[var(--success)] border-[var(--success)]' : ''}
                                        ${isPending ? 'bg-[var(--bg-card)] border-[var(--border)]' : ''}
                                    `}
                                >
                                    {isCompleted && <CheckCircle2 className="w-7 h-7 text-white" />}
                                    {isCurrent && <Clock className="w-7 h-7 text-white animate-pulse" />}
                                    {isPending && <Circle className="w-7 h-7 text-[var(--text-muted)]" />}
                                </div>

                                {/* Label */}
                                <h3 className={`
                                    text-xl font-bold mb-1 transition-colors duration-300
                                    ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}
                                `}>
                                    {quarter.label}
                                </h3>
                                <p className="text-sm text-[var(--text-muted)] mb-2">
                                    {quarter.months}
                                </p>
                                <p className={`
                                    text-xs font-semibold uppercase tracking-wider
                                    ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}
                                `}>
                                    {quarter.description}
                                </p>

                                {/* Status badge */}
                                {isCurrent && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="mt-3 px-3 py-1 bg-[var(--accent)]/20 border border-[var(--accent)] rounded-full"
                                    >
                                        <span className="text-xs font-bold text-[var(--accent)]">IN PROGRESS</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
