"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, Calendar, Zap, Sparkles } from "lucide-react";
import { MidnightTheme, getUrgencyTheme, glassCard } from "@/lib/wow-midnight-theme";

interface TimelineData {
    days_until_launch: number;
    launch_date: string;
    urgency_level: string;
    limited_content_available: {
        royal_voidwing: boolean;
        faceless_one_title: boolean;
    };
}

interface TimelineTrackerProps {
    timeline: TimelineData;
}

export default function TimelineTracker({ timeline }: TimelineTrackerProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: timeline.days_until_launch,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const launchTime = new Date(timeline.launch_date).getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = launchTime - now;

            if (distance < 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [timeline.launch_date]);

    const urgencyTheme = getUrgencyTheme(timeLeft.days);
    const isUrgent = timeLeft.days <= 7;

    return (
        <div className="relative">
            {/* MIDNIGHT COUNTDOWN CONTAINER */}
            <div
                className="relative p-8 rounded-2xl overflow-hidden"
                style={{
                    background: MidnightTheme.backgrounds.void,
                    border: `3px solid ${urgencyTheme.border}`,
                    boxShadow: urgencyTheme.shadow,
                }}
            >
                {/* Animated Void Pulse Background */}
                <motion.div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 30% 50%, ${MidnightTheme.void.primary}, transparent)`,
                            `radial-gradient(circle at 70% 50%, ${urgencyTheme.text}, transparent)`,
                            `radial-gradient(circle at 30% 50%, ${MidnightTheme.void.primary}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Glass Overlay for Premium Look */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: MidnightTheme.gradients.glassOverlay,
                    }}
                />

                <div className="relative z-10 text-center">
                    {/* Header Icon */}
                    <motion.div
                        className="flex items-center justify-center gap-3 mb-6"
                        animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {isUrgent ? (
                            <AlertTriangle className="w-12 h-12" style={{ color: urgencyTheme.text }} />
                        ) : (
                            <Clock className="w-12 h-12" style={{ color: MidnightTheme.void.ethereal }} />
                        )}
                        <Sparkles className="w-8 h-8" style={{ color: MidnightTheme.light.primary }} />
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-3"
                        style={{
                            background: isUrgent
                                ? urgencyTheme.background
                                : MidnightTheme.gradients.voidToLight,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: `0 0 20px ${urgencyTheme.glow}`,
                            fontFamily: 'serif',
                            letterSpacing: '0.15em',
                        }}
                    >
                        {isUrgent ? '⚠️ CRITICAL COUNTDOWN ⚠️' : '🌌 MIDNIGHT APPROACHES 🌌'}
                    </motion.h2>

                    <p className="text-base md:text-lg mb-8" style={{ color: MidnightTheme.text.void, fontFamily: 'serif' }}>
                        {isUrgent ? 'Limited-time content expires soon!' : 'The Void invasion draws near...'}
                    </p>

                    {/* COUNTDOWN TIMER */}
                    <div className="grid grid-cols-4 gap-3 md:gap-6 mb-8 max-w-3xl mx-auto">
                        {[
                            { value: timeLeft.days, label: 'DAYS', gradient: MidnightTheme.gradients.voidToLight },
                            { value: timeLeft.hours, label: 'HOURS', gradient: MidnightTheme.gradients.voidHorizontal },
                            { value: timeLeft.minutes, label: 'MINS', gradient: MidnightTheme.gradients.voidHorizontal },
                            { value: timeLeft.seconds, label: 'SECS', gradient: MidnightTheme.gradients.lightHorizontal },
                        ].map((item, index) => (
                            <motion.div
                                key={item.label}
                                className="relative p-4 md:p-6 rounded-xl"
                                style={{
                                    ...glassCard,
                                    border: `2px solid ${urgencyTheme.border}`,
                                    boxShadow: `0 0 20px ${urgencyTheme.glow}, ${MidnightTheme.shadows.depth}`,
                                }}
                                animate={
                                    item.label === 'SECS'
                                        ? { scale: [1, 1.05, 1] }
                                        : {}
                                }
                                transition={{ duration: 1, repeat: Infinity }}
                                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                            >
                                {/* Inner Glow */}
                                <div
                                    className="absolute inset-0 rounded-xl opacity-30"
                                    style={{
                                        background: `radial-gradient(circle at center, ${urgencyTheme.text}, transparent)`,
                                    }}
                                />

                                <div className="relative z-10">
                                    <div
                                        className="text-4xl md:text-5xl font-bold mb-2"
                                        style={{
                                            background: item.gradient,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            fontFamily: 'monospace',
                                            filter: `drop-shadow(0 0 10px ${urgencyTheme.glow})`,
                                        }}
                                    >
                                        {String(item.value).padStart(2, '0')}
                                    </div>
                                    <div
                                        className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: MidnightTheme.text.muted }}
                                    >
                                        {item.label}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Urgency Message */}
                    <motion.p
                        className="text-base md:text-xl font-bold mb-6"
                        style={{ color: urgencyTheme.text, fontFamily: 'serif' }}
                        animate={isUrgent ? { opacity: [1, 0.7, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        {timeLeft.days <= 3 && "🔥 FINAL DAYS - Complete limited content NOW! 🔥"}
                        {timeLeft.days > 3 && timeLeft.days <= 7 && "⏰ Less than a week - Prioritize critical tasks!"}
                        {timeLeft.days > 7 && timeLeft.days <= 14 && "📅 Two weeks remaining - Stay focused on preparation!"}
                        {timeLeft.days > 14 && "✨ Plenty of time - Build your readiness systematically!"}
                    </motion.p>

                    {/* LIMITED-TIME CONTENT ALERTS */}
                    <div
                        className="p-6 rounded-xl"
                        style={{
                            ...glassCard,
                            border: `2px solid ${MidnightTheme.urgency.critical}`,
                            background: `${MidnightTheme.backgrounds.glassLight}`,
                        }}
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Zap className="w-6 h-6" style={{ color: MidnightTheme.urgency.high }} />
                            <h3
                                className="text-lg md:text-xl font-bold uppercase tracking-wide"
                                style={{ color: MidnightTheme.light.primary }}
                            >
                                ⚡ Limited-Time Rewards
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Royal Voidwing */}
                            <motion.div
                                className="p-4 rounded-lg"
                                style={{
                                    background: timeline.limited_content_available.royal_voidwing
                                        ? `linear-gradient(135deg, rgba(147, 112, 219, 0.2), rgba(107, 70, 193, 0.1))`
                                        : `linear-gradient(135deg, rgba(139, 0, 0, 0.3), rgba(220, 20, 60, 0.2))`,
                                    border: timeline.limited_content_available.royal_voidwing
                                        ? `2px solid ${MidnightTheme.void.primary}`
                                        : `2px solid ${MidnightTheme.urgency.dark}`,
                                }}
                                whileHover={{ scale: 1.03 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {timeline.limited_content_available.royal_voidwing ? (
                                        <span className="text-2xl">✅</span>
                                    ) : (
                                        <span className="text-2xl">❌</span>
                                    )}
                                    <span className="font-bold" style={{ color: MidnightTheme.void.ethereal }}>
                                        Royal Voidwing Mount
                                    </span>
                                </div>
                                <p className="text-xs" style={{ color: MidnightTheme.text.muted }}>
                                    {timeline.limited_content_available.royal_voidwing
                                        ? 'Still available! Complete now!'
                                        : 'No longer obtainable 😢'}
                                </p>
                            </motion.div>

                            {/* Faceless One Title */}
                            <motion.div
                                className="p-4 rounded-lg"
                                style={{
                                    background: timeline.limited_content_available.faceless_one_title
                                        ? `linear-gradient(135deg, rgba(147, 112, 219, 0.2), rgba(107, 70, 193, 0.1))`
                                        : `linear-gradient(135deg, rgba(139, 0, 0, 0.3), rgba(220, 20, 60, 0.2))`,
                                    border: timeline.limited_content_available.faceless_one_title
                                        ? `2px solid ${MidnightTheme.void.primary}`
                                        : `2px solid ${MidnightTheme.urgency.dark}`,
                                }}
                                whileHover={{ scale: 1.03 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {timeline.limited_content_available.faceless_one_title ? (
                                        <span className="text-2xl">✅</span>
                                    ) : (
                                        <span className="text-2xl">❌</span>
                                    )}
                                    <span className="font-bold" style={{ color: MidnightTheme.void.ethereal }}>
                                        "Faceless One" Title
                                    </span>
                                </div>
                                <p className="text-xs" style={{ color: MidnightTheme.text.muted }}>
                                    {timeline.limited_content_available.faceless_one_title
                                        ? 'Still available! Complete now!'
                                        : 'No longer obtainable 😢'}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
