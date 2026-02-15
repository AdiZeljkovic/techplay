"use client";

import { motion } from "framer-motion";
import { Home, Package, Users, Sparkles } from "lucide-react";
import { MidnightTheme, QualityColors, glassCard } from "@/lib/wow-midnight-theme";

interface HousingData {
    housing_score: number;
    mount_count: number;
    mount_target: number;
    achievement_count: number;
    void_mount_count: number;
    rating: string;
}

interface HousingReadinessProps {
    housing: HousingData;
}

export default function HousingReadiness({ housing }: HousingReadinessProps) {
    const getRatingColor = (score: number) => {
        if (score >= 90) return QualityColors.legendary;
        if (score >= 75) return QualityColors.epic;
        if (score >= 60) return QualityColors.rare;
        if (score >= 40) return QualityColors.uncommon;
        return QualityColors.common;
    };

    const colors = getRatingColor(housing.housing_score);

    const collectibles = [
        {
            icon: Package,
            label: 'Mount Collection',
            current: housing.mount_count,
            target: housing.mount_target,
            color: QualityColors.uncommon.primary,
            glow: QualityColors.uncommon.glow,
            description: 'Stable display potential',
        },
        {
            icon: Sparkles,
            label: 'Void Mounts',
            current: housing.void_mount_count,
            target: 10,
            color: MidnightTheme.void.primary,
            glow: MidnightTheme.void.glow,
            description: 'Midnight themed',
        },
        {
            icon: Users,
            label: 'Achievements',
            current: housing.achievement_count,
            target: 500,
            color: MidnightTheme.light.primary,
            glow: MidnightTheme.light.glow,
            description: 'Trophy unlocks',
        },
    ];

    return (
        <div className="relative">
            {/* HOUSING HEADER */}
            <div
                className="relative mb-6 p-8 rounded-2xl overflow-hidden"
                style={{
                    background: MidnightTheme.backgrounds.void,
                    border: `3px solid ${colors.primary}`,
                    boxShadow: `0 0 40px ${colors.glow}, ${MidnightTheme.shadows.depth}`,
                }}
            >
                {/* Animated Quality Glow */}
                <motion.div
                    className="absolute inset-0 opacity-25 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 50% 50%, ${colors.primary}, transparent)`,
                            `radial-gradient(circle at 30% 70%, ${colors.primary}, transparent)`,
                            `radial-gradient(circle at 70% 30%, ${colors.primary}, transparent)`,
                            `radial-gradient(circle at 50% 50%, ${colors.primary}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Glass Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: MidnightTheme.gradients.glassOverlay }}
                />

                <div className="relative z-10 text-center">
                    <motion.div
                        className="flex items-center justify-center gap-3 mb-6"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", duration: 0.8 }}
                    >
                        <Home className="w-12 h-12" style={{ color: colors.primary, filter: `drop-shadow(0 0 10px ${colors.glow})` }} />
                        <Sparkles className="w-10 h-10" style={{ color: MidnightTheme.void.ethereal }} />
                    </motion.div>

                    <h2
                        className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-6"
                        style={{
                            color: colors.primary,
                            textShadow: `0 0 25px ${colors.glow}, 2px 2px 6px rgba(0,0,0,0.9)`,
                            fontFamily: 'serif',
                            letterSpacing: '0.12em',
                        }}
                    >
                        🏠 HOUSING READINESS
                    </h2>

                    {/* SCORE CIRCLE */}
                    <div className="relative inline-flex items-center justify-center w-56 h-56 mb-6">
                        {/* Background Circle */}
                        <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                            <circle
                                cx="112"
                                cy="112"
                                r="100"
                                stroke={MidnightTheme.backgrounds.glassLight}
                                strokeWidth="14"
                                fill="none"
                            />
                            <motion.circle
                                cx="112"
                                cy="112"
                                r="100"
                                stroke={colors.primary}
                                strokeWidth="14"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 100}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 100 * (1 - housing.housing_score / 100) }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                style={{
                                    filter: `drop-shadow(0 0 12px ${colors.primary})`,
                                }}
                            />
                        </svg>

                        {/* Inner Radial Glow */}
                        <motion.div
                            className="absolute inset-0 rounded-full opacity-40"
                            style={{
                                background: `radial-gradient(circle, ${colors.glow}, transparent)`,
                            }}
                            animate={{ opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />

                        {/* Score Text */}
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7, duration: 0.6, type: "spring" }}
                                className="text-6xl font-bold"
                                style={{
                                    color: colors.primary,
                                    textShadow: `0 0 20px ${colors.glow}`,
                                }}
                            >
                                {housing.housing_score}%
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="text-sm mt-2 font-bold uppercase tracking-wider"
                                style={{
                                    color: colors.primary,
                                    textShadow: `0 0 10px ${colors.glow}`,
                                }}
                            >
                                {housing.rating}
                            </motion.span>
                        </div>
                    </div>

                    <p className="text-base italic" style={{ color: MidnightTheme.text.void, fontFamily: 'serif' }}>
                        Your home decoration potential for Player Housing
                    </p>
                </div>
            </div>

            {/* COLLECTION BREAKDOWN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {collectibles.map((item, index) => {
                    const Icon = item.icon;
                    const percentage = Math.min(100, Math.round((item.current / item.target) * 100));

                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15 + 0.4, type: "spring" }}
                            className="p-5 rounded-xl"
                            style={{
                                ...glassCard,
                                border: `2px solid ${item.color}`,
                                boxShadow: `0 0 20px ${item.glow}, ${MidnightTheme.shadows.depth}`,
                            }}
                            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                        >
                            {/* Inner Glow */}
                            <div
                                className="absolute inset-0 rounded-xl opacity-15 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle at top left, ${item.color}, transparent)`,
                                }}
                            />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <motion.div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{
                                            background: `linear-gradient(135deg, ${item.color}, ${item.color}DD)`,
                                            boxShadow: `0 0 15px ${item.glow}, inset 0 2px 4px rgba(255,255,255,0.2)`,
                                        }}
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </motion.div>

                                    <div className="flex-1 min-w-0">
                                        <h3
                                            className="text-sm font-bold uppercase tracking-wide truncate"
                                            style={{
                                                color: MidnightTheme.text.bright,
                                                textShadow: `0 0 8px ${item.glow}`,
                                            }}
                                        >
                                            {item.label}
                                        </h3>
                                        <p className="text-xs" style={{ color: MidnightTheme.text.muted }}>
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Stats */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold" style={{ color: MidnightTheme.text.bright }}>
                                            {item.current.toLocaleString()} / {item.target.toLocaleString()}
                                        </span>
                                        <span
                                            className="text-sm font-bold"
                                            style={{
                                                color: item.color,
                                                textShadow: `0 0 8px ${item.glow}`,
                                            }}
                                        >
                                            {percentage}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div
                                        className="h-3 rounded-full overflow-hidden"
                                        style={{
                                            background: MidnightTheme.backgrounds.glassLight,
                                            border: `1px solid ${MidnightTheme.borders.glass}`,
                                        }}
                                    >
                                        <motion.div
                                            className="h-full"
                                            style={{
                                                background: `linear-gradient(to right, ${item.color}, ${item.color}CC)`,
                                                boxShadow: `0 0 10px ${item.glow}`,
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1.5, delay: index * 0.15 + 0.6, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* HOUSING PRO TIPS */}
            <motion.div
                className="mt-6 p-5 rounded-xl"
                style={{
                    ...glassCard,
                    border: `2px solid ${MidnightTheme.void.ethereal}`,
                    background: MidnightTheme.backgrounds.glassLight,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: MidnightTheme.void.ethereal }}>
                    <Sparkles className="w-5 h-5" />
                    Housing Pro Tips:
                </p>
                <ul className="text-sm space-y-2" style={{ color: MidnightTheme.text.bright }}>
                    <li className="flex items-start gap-2">
                        <span style={{ color: MidnightTheme.light.primary }}>•</span>
                        <span>Raid achievements unlock unique trophies and banners</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span style={{ color: MidnightTheme.light.primary }}>•</span>
                        <span>Mounts can be displayed in your stable - collect rare ones!</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span style={{ color: MidnightTheme.light.primary }}>•</span>
                        <span>Complete transmog sets unlock mannequin displays</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span style={{ color: MidnightTheme.light.primary }}>•</span>
                        <span>Pet collection adds life to your home - they roam freely!</span>
                    </li>
                </ul>
            </motion.div>
        </div>
    );
}
