"use client";

import { motion } from "framer-motion";
import { Home, Package, Users, Sparkles } from "lucide-react";

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
        if (score >= 90) return { primary: '#FF8000', glow: 'rgba(255,128,0,0.6)' }; // Legendary
        if (score >= 75) return { primary: '#A335EE', glow: 'rgba(163,53,238,0.6)' }; // Epic
        if (score >= 60) return { primary: '#0070DD', glow: 'rgba(0,112,221,0.6)' }; // Rare
        if (score >= 40) return { primary: '#1EFF00', glow: 'rgba(30,255,0,0.6)' }; // Uncommon
        return { primary: '#FFFFFF', glow: 'rgba(255,255,255,0.6)' }; // Common
    };

    const colors = getRatingColor(housing.housing_score);

    const collectibles = [
        {
            icon: Package,
            label: 'Mount Collection',
            current: housing.mount_count,
            target: housing.mount_target,
            color: '#32CD32',
            description: 'Stable display potential',
        },
        {
            icon: Sparkles,
            label: 'Void Mounts',
            current: housing.void_mount_count,
            target: 10,
            color: '#9370DB',
            description: 'Midnight themed',
        },
        {
            icon: Users,
            label: 'Achievements',
            current: housing.achievement_count,
            target: 500,
            color: '#FFD700',
            description: 'Trophy unlocks',
        },
    ];

    return (
        <div className="relative">
            {/* Housing Header */}
            <div
                className="relative mb-6 p-6 rounded-xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
                    border: '8px solid',
                    borderImage: 'linear-gradient(135deg, #5D4037, #3E2723) 1',
                    boxShadow: `inset 0 0 30px rgba(0,0,0,0.6), 0 6px 15px rgba(0,0,0,0.5), 0 0 25px ${colors.glow}`,
                }}
            >
                {/* Animated Glow */}
                <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                        background: [
                            `radial-gradient(circle at 50% 50%, ${colors.primary}, transparent)`,
                            `radial-gradient(circle at 30% 70%, ${colors.primary}, transparent)`,
                            `radial-gradient(circle at 70% 30%, ${colors.primary}, transparent)`,
                            `radial-gradient(circle at 50% 50%, ${colors.primary}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                />

                <div className="relative text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Home className="w-10 h-10" style={{ color: colors.primary }} />
                    </div>

                    <h2
                        className="text-3xl font-bold uppercase tracking-wider mb-2"
                        style={{
                            color: colors.primary,
                            textShadow: `2px 2px 4px rgba(0,0,0,0.8), 0 0 10px ${colors.glow}`,
                            fontFamily: 'serif',
                        }}
                    >
                        🏠 Housing Readiness
                    </h2>

                    {/* Score Circle */}
                    <div className="relative inline-flex items-center justify-center w-48 h-48 mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke="#3E2723"
                                strokeWidth="12"
                                fill="none"
                            />
                            <motion.circle
                                cx="96"
                                cy="96"
                                r="88"
                                stroke={colors.primary}
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 88}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - housing.housing_score / 100) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                style={{
                                    filter: `drop-shadow(0 0 8px ${colors.primary})`
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="text-5xl font-bold"
                                style={{ color: colors.primary }}
                            >
                                {housing.housing_score}%
                            </motion.span>
                            <span
                                className="text-sm mt-1 font-bold uppercase tracking-wider"
                                style={{ color: colors.primary }}
                            >
                                {housing.rating}
                            </span>
                        </div>
                    </div>

                    <p className="text-base italic" style={{ color: '#C9B388', fontFamily: 'serif' }}>
                        Your home decoration potential for Player Housing
                    </p>
                </div>
            </div>

            {/* Collection Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {collectibles.map((item, index) => {
                    const Icon = item.icon;
                    const percentage = Math.min(100, Math.round((item.current / item.target) * 100));

                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            className="p-4 rounded-lg"
                            style={{
                                background: 'linear-gradient(to bottom, #f5f5dc 0%, #e8e0c8 100%)',
                                border: '4px solid',
                                borderColor: item.color,
                                boxShadow: `0 4px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 15px ${item.color}40`,
                            }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${item.color}, ${item.color}DD)`,
                                        boxShadow: `0 2px 6px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.2)`,
                                    }}
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className="text-sm font-bold uppercase tracking-wide truncate"
                                        style={{ color: '#3E2723', textShadow: '1px 1px 1px rgba(255,255,255,0.5)' }}
                                    >
                                        {item.label}
                                    </h3>
                                    <p className="text-xs" style={{ color: '#8B7355' }}>
                                        {item.description}
                                    </p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold" style={{ color: '#5D4037' }}>
                                        {item.current} / {item.target}
                                    </span>
                                    <span className="text-xs font-bold" style={{ color: item.color }}>
                                        {percentage}%
                                    </span>
                                </div>
                                <div
                                    className="h-2 rounded-full overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(to right, #3E2723, #2a1810)',
                                        border: '1px solid #8B7355',
                                    }}
                                >
                                    <motion.div
                                        className="h-full"
                                        style={{
                                            background: `linear-gradient(to right, ${item.color}, ${item.color}CC)`,
                                            boxShadow: `0 0 8px ${item.color}`,
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 + 0.5, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Housing Tips */}
            <div
                className="mt-6 p-4 rounded-lg"
                style={{
                    background: 'linear-gradient(to right, rgba(139,105,20,0.1), rgba(107,83,69,0.1))',
                    border: '2px solid rgba(201,179,136,0.4)',
                }}
            >
                <p className="text-sm font-semibold mb-2" style={{ color: '#5D4037' }}>
                    💡 Housing Pro Tips:
                </p>
                <ul className="text-xs space-y-1" style={{ color: '#8B7355' }}>
                    <li>• Raid achievements unlock unique trophies and banners</li>
                    <li>• Mounts can be displayed in your stable - collect rare ones!</li>
                    <li>• Complete transmog sets unlock mannequin displays</li>
                    <li>• Pet collection adds life to your home - they roam freely!</li>
                </ul>
            </div>
        </div>
    );
}
