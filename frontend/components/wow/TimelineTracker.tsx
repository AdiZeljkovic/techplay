"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, Calendar, Zap } from "lucide-react";

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

    const getUrgencyColor = () => {
        if (timeLeft.days <= 3) return { bg: '#8B0000', border: '#DC143C', glow: 'rgba(220,20,60,0.6)' };
        if (timeLeft.days <= 7) return { bg: '#FF6B00', border: '#FF8C00', glow: 'rgba(255,140,0,0.6)' };
        if (timeLeft.days <= 14) return { bg: '#FFA500', border: '#FFD700', glow: 'rgba(255,215,0,0.6)' };
        return { bg: '#8B6914', border: '#C9B388', glow: 'rgba(201,179,136,0.6)' };
    };

    const urgencyColors = getUrgencyColor();

    return (
        <div className="relative">
            {/* WoW Quest Header with Urgency */}
            <div
                className="relative mb-6 p-6 rounded-xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
                    border: '10px solid',
                    borderImage: 'linear-gradient(135deg, #5D4037, #3E2723) 1',
                    boxShadow: `inset 0 0 40px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.6), 0 0 30px ${urgencyColors.glow}`,
                }}
            >
                {/* Animated Urgency Pulse */}
                {timeLeft.days <= 7 && (
                    <motion.div
                        className="absolute inset-0 opacity-20"
                        animate={{
                            background: [
                                `radial-gradient(circle at 50% 50%, ${urgencyColors.bg}, transparent)`,
                                `radial-gradient(circle at 50% 50%, transparent, ${urgencyColors.bg})`,
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}

                <div className="relative text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        {timeLeft.days <= 7 ? (
                            <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
                        ) : (
                            <Clock className="w-10 h-10 text-yellow-600" />
                        )}
                    </div>

                    <h2
                        className="text-4xl font-bold uppercase tracking-wider mb-3"
                        style={{
                            color: timeLeft.days <= 7 ? '#FF6B6B' : '#FFD700',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.5)',
                            fontFamily: 'serif',
                        }}
                    >
                        {timeLeft.days <= 7 ? '⚠️ URGENT ⚠️' : 'Midnight Launch Countdown'}
                    </h2>

                    {/* Live Countdown Timer */}
                    <div className="grid grid-cols-4 gap-4 mb-6 max-w-2xl mx-auto">
                        {[
                            { value: timeLeft.days, label: 'DAYS' },
                            { value: timeLeft.hours, label: 'HOURS' },
                            { value: timeLeft.minutes, label: 'MINS' },
                            { value: timeLeft.seconds, label: 'SECS' },
                        ].map((item, index) => (
                            <motion.div
                                key={item.label}
                                className="relative p-4 rounded-lg"
                                style={{
                                    background: 'linear-gradient(to bottom, #2a1810, #1a0f08)',
                                    border: '4px solid',
                                    borderColor: urgencyColors.border,
                                    boxShadow: `inset 1px 1px 3px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.6), 0 0 15px ${urgencyColors.glow}`,
                                }}
                                animate={
                                    item.label === 'SECS'
                                        ? { scale: [1, 1.05, 1] }
                                        : {}
                                }
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <div
                                    className="text-4xl font-bold mb-1"
                                    style={{
                                        color: urgencyColors.border,
                                        textShadow: `2px 2px 4px rgba(0,0,0,0.8), 0 0 10px ${urgencyColors.glow}`,
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {String(item.value).padStart(2, '0')}
                                </div>
                                <div
                                    className="text-xs font-bold uppercase tracking-widest"
                                    style={{ color: '#8B7355' }}
                                >
                                    {item.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-lg italic mb-4" style={{ color: '#C9B388', fontFamily: 'serif' }}>
                        {timeLeft.days <= 3 && "🔥 FINAL DAYS - Complete limited-time content NOW! 🔥"}
                        {timeLeft.days > 3 && timeLeft.days <= 7 && "⏰ Less than a week - Prioritize critical tasks!"}
                        {timeLeft.days > 7 && timeLeft.days <= 14 && "📅 Two weeks remaining - Stay focused!"}
                        {timeLeft.days > 14 && "✨ Plenty of time - Build your preparation plan!"}
                    </p>

                    {/* Limited Content Availability */}
                    <div className="mt-6 p-4 rounded-lg" style={{
                        background: 'linear-gradient(to right, rgba(139,0,0,0.2), rgba(220,20,60,0.1))',
                        border: '2px solid rgba(220,20,60,0.5)',
                    }}>
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Zap className="w-5 h-5 text-red-400" />
                            <h3 className="text-lg font-bold uppercase tracking-wide" style={{ color: '#FF6B6B' }}>
                                Limited-Time Content
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-lg ${timeline.limited_content_available.royal_voidwing ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {timeline.limited_content_available.royal_voidwing ? (
                                        <span className="text-green-400 text-xl">✅</span>
                                    ) : (
                                        <span className="text-red-400 text-xl">❌</span>
                                    )}
                                    <span className="text-sm font-bold" style={{ color: '#C9B388' }}>Royal Voidwing</span>
                                </div>
                                <p className="text-xs" style={{ color: '#8B7355' }}>
                                    {timeline.limited_content_available.royal_voidwing ? 'Still available!' : 'No longer obtainable'}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${timeline.limited_content_available.faceless_one_title ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {timeline.limited_content_available.faceless_one_title ? (
                                        <span className="text-green-400 text-xl">✅</span>
                                    ) : (
                                        <span className="text-red-400 text-xl">❌</span>
                                    )}
                                    <span className="text-sm font-bold" style={{ color: '#C9B388' }}>Faceless One Title</span>
                                </div>
                                <p className="text-xs" style={{ color: '#8B7355' }}>
                                    {timeline.limited_content_available.faceless_one_title ? 'Still available!' : 'No longer obtainable'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
