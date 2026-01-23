"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { RoadmapFeature } from "@/lib/roadmapData";
import { CheckCircle2, Clock, Circle } from "lucide-react";

interface FeatureCardProps {
    feature: RoadmapFeature;
    index: number;
}

export default function FeatureCard({ feature, index }: FeatureCardProps) {
    const Icon = (LucideIcons as any)[feature.icon] || LucideIcons.Box;

    const statusConfig = {
        completed: {
            icon: CheckCircle2,
            label: 'Completed',
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.1)'
        },
        in_progress: {
            icon: Clock,
            label: 'In Progress',
            color: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.1)'
        },
        planned: {
            icon: Circle,
            label: 'Planned',
            color: '#6B7280',
            bgColor: 'rgba(107, 114, 128, 0.1)'
        }
    };

    const status = statusConfig[feature.status];
    const StatusIcon = status.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -8 }}
            className="relative group h-full"
        >
            {/* Hover glow effect */}
            <motion.div
                className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                style={{
                    background: `linear-gradient(135deg, ${feature.color}60, ${feature.color}20)`
                }}
            />

            {/* Card container */}
            <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 h-full flex flex-col transition-all duration-300 group-hover:border-[var(--border-hover)]">
                {/* Status badge */}
                <div className="absolute top-4 right-4 z-10">
                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-sm"
                        style={{
                            backgroundColor: status.bgColor,
                            borderColor: status.color + '40'
                        }}
                    >
                        <StatusIcon className="w-3 h-3" style={{ color: status.color }} />
                        <span className="text-xs font-medium" style={{ color: status.color }}>
                            {status.label}
                        </span>
                    </div>
                </div>

                {/* Icon with background */}
                <div className="relative mb-4">
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{ backgroundColor: feature.color + '20' }}
                    >
                        <Icon className="w-7 h-7 transition-transform duration-300" style={{ color: feature.color }} />
                    </div>

                    {/* Subtle glow behind icon */}
                    <div
                        className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                        style={{ backgroundColor: feature.color }}
                    />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 pr-20 leading-tight">
                    {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                    {feature.description}
                </p>

                {/* Details list */}
                <div className="mt-auto pt-4 border-t border-[var(--border)]">
                    <ul className="space-y-2.5">
                        {feature.details.map((detail, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 + i * 0.05 }}
                                className="flex items-start gap-2.5 text-xs text-[var(--text-muted)] group/item"
                            >
                                <CheckCircle2
                                    className="w-4 h-4 mt-0.5 flex-shrink-0 transition-all duration-200 group-hover/item:scale-110"
                                    style={{ color: feature.color }}
                                />
                                <span className="leading-relaxed group-hover/item:text-[var(--text-secondary)] transition-colors duration-200">
                                    {detail}
                                </span>
                            </motion.li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}
