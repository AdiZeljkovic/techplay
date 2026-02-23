"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Users, Eye, TrendingUp, Activity } from "lucide-react";

export default function RealtimeStats() {
    const [stats, setStats] = useState({
        online: 0,
        viewing: 0,
        trending: 0
    });

    // Simulate real-time counter updates
    useEffect(() => {
        // Initial random values
        const baseOnline = 4500 + Math.floor(Math.random() * 1000);
        const baseViewing = 850 + Math.floor(Math.random() * 200);
        const baseTrending = 12 + Math.floor(Math.random() * 8);

        setStats({
            online: baseOnline,
            viewing: baseViewing,
            trending: baseTrending
        });

        // Update every 3 seconds with small variations
        const interval = setInterval(() => {
            setStats(prev => ({
                online: Math.max(3000, prev.online + Math.floor(Math.random() * 40) - 20),
                viewing: Math.max(600, prev.viewing + Math.floor(Math.random() * 20) - 10),
                trending: Math.max(5, prev.trending + Math.floor(Math.random() * 3) - 1)
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const metrics = [
        {
            icon: Users,
            label: "Visitors Online",
            value: stats.online.toLocaleString(),
            color: "from-blue-500 to-cyan-500",
            pulseColor: "bg-blue-400"
        },
        {
            icon: Eye,
            label: "Currently Viewing",
            value: stats.viewing.toLocaleString(),
            color: "from-purple-500 to-pink-500",
            pulseColor: "bg-purple-400"
        },
        {
            icon: TrendingUp,
            label: "Trending Articles",
            value: stats.trending,
            color: "from-green-500 to-emerald-500",
            pulseColor: "bg-green-400"
        }
    ];

    return (
        <div className="relative">
            {/* Label */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <div className="relative flex items-center">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute w-3 h-3 rounded-full bg-green-400 blur-sm"
                    />
                    <div className="relative w-2 h-2 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">
                    Live Statistics
                </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.map((metric, i) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="relative group"
                    >
                        <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]
                                      hover:bg-white/[0.04] hover:border-white/[0.1]
                                      transition-all duration-500 overflow-hidden">
                            {/* Gradient background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${metric.color}
                                           opacity-0 group-hover:opacity-[0.05]
                                           transition-opacity duration-500`} />

                            {/* Pulse indicator */}
                            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 0, 0.3]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.3
                                    }}
                                    className={`w-2 h-2 rounded-full ${metric.pulseColor} blur-[2px]`}
                                />
                                <div className={`w-1.5 h-1.5 rounded-full ${metric.pulseColor}`} />
                            </div>

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color}
                                               flex items-center justify-center shadow-lg mb-4
                                               group-hover:scale-110 transition-transform duration-500`}>
                                    <metric.icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Value with animation */}
                                <motion.div
                                    key={metric.value}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-3xl font-black text-white mb-1"
                                >
                                    {metric.value}
                                </motion.div>

                                {/* Label */}
                                <div className="text-xs text-white/50 font-medium">
                                    {metric.label}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Update timestamp */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-4"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                              bg-white/[0.02] border border-white/[0.04]">
                    <Activity className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-white/40 font-medium">
                        Updates every 3 seconds
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
