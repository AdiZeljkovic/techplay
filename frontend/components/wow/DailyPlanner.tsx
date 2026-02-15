"use client";

import { motion } from "framer-motion";
import { Calendar, Zap, Target, CheckCircle2 } from "lucide-react";

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

    return (
        <div className="relative">
            <div
                className="p-6 rounded-xl"
                style={{
                    background: 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
                    border: '8px solid',
                    borderImage: 'linear-gradient(135deg, #5D4037, #3E2723) 1',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 0 6px 15px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Calendar className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2
                        className="text-3xl font-bold uppercase tracking-wider mb-2"
                        style={{
                            color: '#FFD700',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,215,0,0.4)',
                            fontFamily: 'serif',
                        }}
                    >
                        📅 Today's Priority List
                    </h2>
                    <p className="text-sm" style={{ color: '#C9B388', fontFamily: 'serif' }}>
                        {today}
                    </p>
                    <div className="mt-2 inline-block px-4 py-1.5 rounded" style={{
                        background: daysUntilLaunch <= 7
                            ? 'linear-gradient(to right, #8B0000, #DC143C)'
                            : 'linear-gradient(to right, #8B6914, #6B5914)',
                        border: '2px solid',
                        borderColor: daysUntilLaunch <= 7 ? '#FF6B6B' : '#C9B388',
                    }}>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FFF' }}>
                            {daysUntilLaunch} days until Midnight launch
                        </p>
                    </div>
                </div>

                {/* Daily Tasks */}
                <div className="space-y-4">
                    {dailyPriority && dailyPriority.length > 0 ? (
                        dailyPriority.map((task, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <div
                                    className="p-4 rounded-lg transition-all hover:scale-102"
                                    style={{
                                        background: 'linear-gradient(to bottom, #f5f5dc 0%, #e8e0c8 100%)',
                                        border: '4px solid #8B7355',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Priority Number Badge */}
                                        <div
                                            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                                            style={{
                                                background: index === 0
                                                    ? 'linear-gradient(135deg, #FFD700, #DAA520)'
                                                    : 'linear-gradient(135deg, #8B7355, #6B5345)',
                                                border: '3px solid',
                                                borderColor: index === 0 ? '#FFA500' : '#5D4037',
                                                color: '#FFF',
                                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                                boxShadow: index === 0
                                                    ? '0 4px 8px rgba(255,215,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.3)'
                                                    : '0 2px 4px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(255,255,255,0.2)',
                                            }}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* Task Content */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-base font-semibold leading-relaxed"
                                                style={{
                                                    color: '#3E2723',
                                                    textShadow: '1px 1px 1px rgba(255,255,255,0.5)',
                                                }}
                                            >
                                                {task}
                                            </p>
                                        </div>

                                        {/* Action Icon */}
                                        <div className="flex-shrink-0">
                                            {index === 0 ? (
                                                <Zap className="w-6 h-6 text-yellow-600 animate-pulse" />
                                            ) : (
                                                <Target className="w-6 h-6 text-[#8B7355]" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Urgency Indicator for First Task */}
                                {index === 0 && daysUntilLaunch <= 7 && (
                                    <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold uppercase" style={{
                                        background: 'linear-gradient(135deg, #DC143C, #8B0000)',
                                        color: '#FFF',
                                        boxShadow: '0 2px 6px rgba(220,20,60,0.5)',
                                    }}>
                                        URGENT
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
                            <p className="text-lg font-semibold" style={{ color: '#3E2723' }}>
                                All caught up!
                            </p>
                            <p className="text-sm" style={{ color: '#8B7355' }}>
                                Great job! Keep checking back for new priorities.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="mt-6 p-4 rounded-lg" style={{
                    background: 'linear-gradient(to right, rgba(139,105,20,0.15), rgba(107,83,69,0.1))',
                    border: '2px solid rgba(139,115,85,0.3)',
                }}>
                    <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <div className="flex-1">
                            <p className="text-xs font-bold mb-1 uppercase" style={{ color: '#8B7355' }}>
                                Profesor Buffy's Tip:
                            </p>
                            <p className="text-sm italic" style={{ color: '#5D4037' }}>
                                {daysUntilLaunch <= 3 && "Focus ONLY on critical limited-time content - you can farm gold and mounts after launch!"}
                                {daysUntilLaunch > 3 && daysUntilLaunch <= 7 && "Prioritize limited-time content this week, then shift to housing prep!"}
                                {daysUntilLaunch > 7 && daysUntilLaunch <= 14 && "Great timing! Balance limited content with housing preparation."}
                                {daysUntilLaunch > 14 && "You have time! Focus on Quel'Thalas lore first, then build your collection."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
