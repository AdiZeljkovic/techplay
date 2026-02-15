"use client";

import { motion } from "framer-motion";
import { Calendar, Zap, Target, CheckCircle2, Sparkles } from "lucide-react";
import { MidnightTheme, getUrgencyTheme, glassCard } from "@/lib/wow-midnight-theme";

interface DailyPlannerProps {
    dailyPriority: string[];
    daysUntilLaunch: number;
}

export default function DailyPlanner({ dailyPriority, daysUntilLaunch }: DailyPlannerProps) {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const urgencyTheme = getUrgencyTheme(daysUntilLaunch);
    const isUrgent = daysUntilLaunch <= 7;

    return (
        <div className="relative">
            <div
                className="p-8 rounded-2xl overflow-hidden"
                style={{
                    background: MidnightTheme.backgrounds.void,
                    border: `3px solid ${MidnightTheme.void.primary}`,
                    boxShadow: MidnightTheme.shadows.voidGlow,
                }}
            >
                {/* Animated Background Glow */}
                <motion.div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 20% 80%, ${MidnightTheme.void.primary}, transparent)`,
                            `radial-gradient(circle at 80% 20%, ${MidnightTheme.light.primary}, transparent)`,
                            `radial-gradient(circle at 20% 80%, ${MidnightTheme.void.primary}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Glass Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: MidnightTheme.gradients.glassOverlay }}
                />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            className="flex items-center justify-center gap-3 mb-4"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Calendar className="w-10 h-10" style={{ color: MidnightTheme.light.primary }} />
                            <Sparkles className="w-8 h-8" style={{ color: MidnightTheme.void.ethereal }} />
                        </motion.div>

                        <h2
                            className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-3"
                            style={{
                                background: MidnightTheme.gradients.voidToLight,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: `0 0 20px ${MidnightTheme.void.glow}`,
                                fontFamily: 'serif',
                                letterSpacing: '0.12em',
                            }}
                        >
                            📅 TODAY'S PRIORITY MISSIONS
                        </h2>

                        <p className="text-sm mb-4" style={{ color: MidnightTheme.text.void, fontFamily: 'serif' }}>
                            {today}
                        </p>

                        <motion.div
                            className="inline-block px-5 py-2 rounded-lg"
                            style={{
                                background: isUrgent ? urgencyTheme.background : MidnightTheme.gradients.voidHorizontal,
                                border: `2px solid ${urgencyTheme.border}`,
                                boxShadow: `0 0 15px ${urgencyTheme.glow}`,
                            }}
                            animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#FFF' }}>
                                {daysUntilLaunch} days until Midnight launch
                            </p>
                        </motion.div>
                    </div>

                    {/* Daily Tasks */}
                    <div className="space-y-5">
                        {dailyPriority && dailyPriority.length > 0 ? (
                            dailyPriority.map((task, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.15, type: "spring" }}
                                    className="relative group"
                                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                >
                                    <div
                                        className="p-5 rounded-xl transition-all"
                                        style={{
                                            ...glassCard,
                                            border: index === 0
                                                ? `2px solid ${MidnightTheme.light.primary}`
                                                : `2px solid ${MidnightTheme.void.primary}`,
                                            boxShadow: index === 0
                                                ? `0 0 25px ${MidnightTheme.light.glow}, ${MidnightTheme.shadows.depth}`
                                                : `0 0 20px ${MidnightTheme.void.glow}, ${MidnightTheme.shadows.depth}`,
                                        }}
                                    >
                                        {/* Inner Radial Glow */}
                                        <div
                                            className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
                                            style={{
                                                background: index === 0
                                                    ? `radial-gradient(circle at top left, ${MidnightTheme.light.primary}, transparent)`
                                                    : `radial-gradient(circle at top left, ${MidnightTheme.void.primary}, transparent)`,
                                            }}
                                        />

                                        <div className="relative z-10 flex items-start gap-4">
                                            {/* Priority Badge */}
                                            <motion.div
                                                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
                                                style={{
                                                    background: index === 0
                                                        ? MidnightTheme.gradients.lightHorizontal
                                                        : MidnightTheme.gradients.voidHorizontal,
                                                    border: `3px solid ${index === 0 ? MidnightTheme.light.bright : MidnightTheme.void.ethereal}`,
                                                    color: index === 0 ? '#000' : '#FFF',
                                                    textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                                                    boxShadow: index === 0
                                                        ? `0 0 20px ${MidnightTheme.light.glow}, inset 0 2px 4px rgba(255,255,255,0.3)`
                                                        : `0 0 15px ${MidnightTheme.void.glow}, inset 0 2px 4px rgba(255,255,255,0.1)`,
                                                }}
                                                animate={index === 0 ? { rotate: [0, 5, -5, 0] } : {}}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                {index + 1}
                                            </motion.div>

                                            {/* Task Content */}
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="text-base md:text-lg font-semibold leading-relaxed"
                                                    style={{
                                                        color: index === 0 ? MidnightTheme.light.bright : MidnightTheme.text.bright,
                                                        textShadow: `0 0 10px ${index === 0 ? MidnightTheme.light.glow : MidnightTheme.void.glow}`,
                                                    }}
                                                >
                                                    {task}
                                                </p>
                                            </div>

                                            {/* Action Icon */}
                                            <motion.div
                                                className="flex-shrink-0"
                                                animate={index === 0 ? { scale: [1, 1.2, 1] } : {}}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                {index === 0 ? (
                                                    <Zap className="w-7 h-7" style={{ color: MidnightTheme.light.primary, filter: `drop-shadow(0 0 8px ${MidnightTheme.light.glow})` }} />
                                                ) : (
                                                    <Target className="w-7 h-7" style={{ color: MidnightTheme.void.ethereal }} />
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Urgency Badge (First Task Only) */}
                                    {index === 0 && isUrgent && (
                                        <motion.div
                                            className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase"
                                            style={{
                                                background: MidnightTheme.gradients.urgencyPulse,
                                                border: `2px solid ${MidnightTheme.urgency.critical}`,
                                                color: '#FFF',
                                                boxShadow: `0 0 20px ${MidnightTheme.urgency.glow}`,
                                            }}
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            URGENT
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                className="text-center py-12 rounded-xl"
                                style={{
                                    ...glassCard,
                                    border: `2px solid ${MidnightTheme.void.primary}`,
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: MidnightTheme.void.ethereal }} />
                                <p className="text-xl font-semibold mb-2" style={{ color: MidnightTheme.light.primary }}>
                                    All Caught Up!
                                </p>
                                <p className="text-sm" style={{ color: MidnightTheme.text.muted }}>
                                    Great work! Check back tomorrow for new priorities.
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Profesor Buffy's Tip */}
                    <motion.div
                        className="mt-8 p-5 rounded-xl"
                        style={{
                            ...glassCard,
                            border: `2px solid ${MidnightTheme.void.ethereal}`,
                            background: `${MidnightTheme.backgrounds.glassLight}`,
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">💡</span>
                            <div className="flex-1">
                                <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: MidnightTheme.void.ethereal }}>
                                    Profesor Buffy's Insight:
                                </p>
                                <p className="text-sm italic leading-relaxed" style={{ color: MidnightTheme.text.bright }}>
                                    {daysUntilLaunch <= 3 && "Focus ONLY on critical limited-time content - you can farm gold and mounts after launch!"}
                                    {daysUntilLaunch > 3 && daysUntilLaunch <= 7 && "Prioritize limited-time content this week, then shift to housing prep!"}
                                    {daysUntilLaunch > 7 && daysUntilLaunch <= 14 && "Great timing! Balance limited content with housing preparation."}
                                    {daysUntilLaunch > 14 && "You have time! Focus on Quel'Thalas lore first, then build your collection."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
