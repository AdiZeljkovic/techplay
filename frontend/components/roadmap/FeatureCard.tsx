"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { RoadmapFeature } from "@/lib/roadmapData";
import { CheckCircle2, Clock, Circle, Sparkles } from "lucide-react";
import { useState } from "react";

interface FeatureCardProps {
    feature: RoadmapFeature;
    index: number;
}

export default function FeatureCard({ feature, index }: FeatureCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const Icon = (LucideIcons as any)[feature.icon] || LucideIcons.Box;

    // 3D tilt effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    };

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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className="relative group h-full"
        >
            {/* Simple glow on hover */}
            <div
                className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500"
                style={{
                    backgroundColor: feature.color + '20'
                }}
            />

            {/* Glassmorphism card */}
            <motion.div
                style={{ transformStyle: "preserve-3d" }}
                className="relative h-full backdrop-blur-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col overflow-hidden group-hover:border-[var(--accent)]/30 transition-all duration-500"
            >

                {/* Sparkle effect for in_progress */}
                {feature.status === 'in_progress' && isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, 180, 360] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-8 right-8"
                    >
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    </motion.div>
                )}

                {/* Status badge */}
                <div className="absolute top-4 right-4 z-10">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md"
                        style={{
                            backgroundColor: status.bgColor,
                            borderColor: status.color + '40',
                            boxShadow: `0 0 20px ${status.color}20`
                        }}
                    >
                        <motion.div
                            animate={feature.status === 'in_progress' ? { rotate: 360 } : {}}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <StatusIcon className="w-3 h-3" style={{ color: status.color }} />
                        </motion.div>
                        <span className="text-xs font-bold tracking-wide" style={{ color: status.color }}>
                            {status.label.toUpperCase()}
                        </span>
                    </motion.div>
                </div>

                {/* Icon with enhanced effects */}
                <div className="relative mb-6 mt-2">
                    {/* Icon glow */}
                    <motion.div
                        animate={{
                            opacity: isHovered ? 0.6 : 0.3,
                            scale: isHovered ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 rounded-xl blur-xl"
                        style={{ backgroundColor: feature.color }}
                    />

                    {/* Icon container */}
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{
                            backgroundColor: feature.color + '20',
                            boxShadow: `0 8px 32px ${feature.color}30`
                        }}
                    >
                        <Icon className="w-8 h-8" style={{ color: feature.color }} />
                    </motion.div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 pr-20 leading-tight group-hover:text-[var(--accent)] transition-colors duration-300">
                    {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
                    {feature.description}
                </p>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-5" />

                {/* Details list */}
                <div className="mt-auto">
                    <ul className="space-y-3">
                        {feature.details.map((detail, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 + i * 0.05 }}
                                whileHover={{ x: 5 }}
                                className="flex items-start gap-3 text-xs text-[var(--text-muted)] group/item cursor-default"
                            >
                                <CheckCircle2
                                    className="w-4 h-4 mt-0.5 flex-shrink-0 transition-all duration-200 group-hover/item:scale-125"
                                    style={{ color: feature.color }}
                                />
                                <span className="leading-relaxed group-hover/item:text-[var(--text-primary)] transition-colors duration-200">
                                    {detail}
                                </span>
                            </motion.li>
                        ))}
                    </ul>
                </div>

                {/* Bottom accent */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                    className="absolute bottom-0 left-0 w-16 h-1 origin-left"
                    style={{
                        backgroundColor: feature.color
                    }}
                />
            </motion.div>
        </motion.div>
    );
}
