"use client";

import { motion } from "framer-motion";
import { Check, X, AlertCircle, BookOpen, Home, Swords, Target } from "lucide-react";
import { MidnightTheme, glassCard, QualityColors } from "@/lib/wow-midnight-theme";

interface ChecklistItem {
    name: string;
    completed: boolean;
    priority: string;
    deadline?: string;
    source?: string;
    why_important?: string;
    progress?: string;
}

interface ChecklistCategory {
    label: string;
    items: ChecklistItem[];
}

interface ChecklistData {
    critical_limited: ChecklistCategory;
    lore_mastery: ChecklistCategory;
    housing_prep: ChecklistCategory;
}

interface PreparationChecklistProps {
    checklist: ChecklistData;
}

export default function PreparationChecklist({ checklist }: PreparationChecklistProps) {
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'critical_limited': return AlertCircle;
            case 'lore_mastery': return BookOpen;
            case 'housing_prep': return Home;
            default: return Target;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'critical_limited':
                return {
                    gradient: MidnightTheme.gradients.urgencyPulse,
                    border: MidnightTheme.urgency.critical,
                    glow: MidnightTheme.urgency.glow,
                    primary: MidnightTheme.urgency.critical,
                    secondary: MidnightTheme.urgency.dark,
                    text: MidnightTheme.urgency.high,
                };
            case 'lore_mastery':
                return {
                    gradient: MidnightTheme.gradients.voidHorizontal,
                    border: MidnightTheme.void.primary,
                    glow: MidnightTheme.void.glow,
                    primary: MidnightTheme.void.primary,
                    secondary: MidnightTheme.void.deep,
                    text: MidnightTheme.void.ethereal,
                };
            case 'housing_prep':
                return {
                    gradient: MidnightTheme.gradients.lightHorizontal,
                    border: MidnightTheme.light.primary,
                    glow: MidnightTheme.light.glow,
                    primary: MidnightTheme.light.primary,
                    secondary: MidnightTheme.light.warm,
                    text: MidnightTheme.light.bright,
                };
            default:
                return {
                    gradient: MidnightTheme.gradients.voidToLight,
                    border: MidnightTheme.void.ethereal,
                    glow: MidnightTheme.void.glow,
                    primary: MidnightTheme.void.primary,
                    secondary: MidnightTheme.light.primary,
                    text: MidnightTheme.text.light,
                };
        }
    };

    const calculateCategoryCompletion = (items: ChecklistItem[]) => {
        if (items.length === 0) return 0;
        const completed = items.filter(item => item.completed).length;
        return Math.round((completed / items.length) * 100);
    };

    const categories = [
        { key: 'critical_limited', data: checklist.critical_limited },
        { key: 'lore_mastery', data: checklist.lore_mastery },
        { key: 'housing_prep', data: checklist.housing_prep },
    ];

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative p-8 rounded-2xl overflow-hidden"
                style={{
                    background: MidnightTheme.backgrounds.void,
                    border: `3px solid ${MidnightTheme.void.primary}`,
                    boxShadow: MidnightTheme.shadows.voidGlow,
                }}
            >
                {/* Animated Void Background */}
                <motion.div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    animate={{
                        background: [
                            `radial-gradient(circle at 20% 50%, ${MidnightTheme.void.primary}, transparent)`,
                            `radial-gradient(circle at 80% 50%, ${MidnightTheme.light.primary}, transparent)`,
                            `radial-gradient(circle at 20% 50%, ${MidnightTheme.void.primary}, transparent)`,
                        ],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Glass Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: MidnightTheme.gradients.glassOverlay,
                    }}
                />

                <div className="relative z-10 text-center">
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-4xl font-bold uppercase tracking-wider mb-2"
                        style={{
                            background: MidnightTheme.gradients.voidToLight,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: `drop-shadow(0 0 12px ${MidnightTheme.void.glow})`,
                        }}
                    >
                        Midnight Preparation Checklist
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-sm uppercase tracking-wide"
                        style={{ color: MidnightTheme.text.void }}
                    >
                        Track your readiness across all critical areas
                    </motion.p>
                </div>
            </motion.div>

            {/* Category Cards */}
            {categories.map((category, catIndex) => {
                const Icon = getCategoryIcon(category.key);
                const colors = getCategoryColor(category.key);
                const completion = calculateCategoryCompletion(category.data.items);

                return (
                    <motion.div
                        key={category.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + catIndex * 0.15 }}
                        className="relative"
                    >
                        <div
                            className="p-6 rounded-2xl overflow-hidden relative"
                            style={{
                                ...glassCard,
                                border: `2px solid ${colors.border}`,
                                boxShadow: `0 0 30px ${colors.glow}, ${MidnightTheme.shadows.depth}`,
                            }}
                        >
                            {/* Animated Category Glow Background */}
                            <motion.div
                                className="absolute inset-0 opacity-10 pointer-events-none"
                                animate={{
                                    background: [
                                        `radial-gradient(circle at 0% 50%, ${colors.primary}, transparent)`,
                                        `radial-gradient(circle at 100% 50%, ${colors.secondary}, transparent)`,
                                        `radial-gradient(circle at 0% 50%, ${colors.primary}, transparent)`,
                                    ],
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                            {/* Category Header */}
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <motion.div
                                    className="flex items-center gap-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + catIndex * 0.15 }}
                                >
                                    <motion.div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center relative"
                                        style={{
                                            background: colors.gradient,
                                            boxShadow: `0 0 20px ${colors.glow}, ${MidnightTheme.shadows.depth}`,
                                        }}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        transition={{ type: "spring", stiffness: 400 }}
                                    >
                                        <Icon className="w-7 h-7" style={{ color: MidnightTheme.text.bright }} />
                                    </motion.div>
                                    <div>
                                        <h3
                                            className="text-2xl font-bold uppercase tracking-wide mb-1"
                                            style={{
                                                color: MidnightTheme.text.bright,
                                                textShadow: `0 0 10px ${colors.glow}`,
                                            }}
                                        >
                                            {category.data.label}
                                        </h3>
                                        <p className="text-xs uppercase tracking-wider" style={{ color: MidnightTheme.text.muted }}>
                                            {category.data.items.length} item{category.data.items.length !== 1 && 's'}
                                        </p>
                                    </div>
                                </motion.div>
                                <motion.div
                                    className="text-right"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 + catIndex * 0.15 }}
                                >
                                    <motion.div
                                        className="text-4xl font-bold"
                                        style={{
                                            color: completion === 100 ? MidnightTheme.light.primary : colors.text,
                                            textShadow: `0 0 15px ${completion === 100 ? MidnightTheme.light.glow : colors.glow}`,
                                        }}
                                        animate={completion === 100 ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {completion}%
                                    </motion.div>
                                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: MidnightTheme.text.muted }}>
                                        Complete
                                    </p>
                                </motion.div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative z-10 mb-6">
                                <div
                                    className="h-4 rounded-full overflow-hidden relative"
                                    style={{
                                        background: MidnightTheme.backgrounds.voidDark,
                                        border: `1px solid ${colors.border}`,
                                        boxShadow: `inset 0 2px 8px rgba(0, 0, 0, 0.6)`,
                                    }}
                                >
                                    <motion.div
                                        className="h-full relative"
                                        style={{
                                            background: colors.gradient,
                                            boxShadow: `0 0 20px ${colors.glow}`,
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completion}%` }}
                                        transition={{ delay: 0.5 + catIndex * 0.15, duration: 1.5, ease: "easeOut" }}
                                    >
                                        {/* Animated Shimmer */}
                                        <motion.div
                                            className="absolute inset-0"
                                            style={{
                                                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                                            }}
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        />
                                    </motion.div>
                                </div>
                            </div>

                            {/* Checklist Items */}
                            <div className="space-y-3 relative z-10">
                                {category.data.items.length === 0 ? (
                                    <p className="text-center py-8 text-sm uppercase tracking-wide" style={{ color: MidnightTheme.text.muted }}>
                                        No items in this category
                                    </p>
                                ) : (
                                    category.data.items.map((item, itemIndex) => (
                                        <motion.div
                                            key={itemIndex}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + catIndex * 0.15 + itemIndex * 0.08 }}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            className="group relative"
                                        >
                                            <div
                                                className="flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden"
                                                style={{
                                                    background: item.completed
                                                        ? `linear-gradient(135deg, ${MidnightTheme.backgrounds.glass}, ${MidnightTheme.backgrounds.glassLight})`
                                                        : MidnightTheme.backgrounds.glass,
                                                    backdropFilter: 'blur(10px)',
                                                    WebkitBackdropFilter: 'blur(10px)',
                                                    border: `1px solid ${item.completed ? MidnightTheme.light.primary : colors.border}`,
                                                    boxShadow: item.completed
                                                        ? `0 0 20px ${MidnightTheme.light.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                                                        : `0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                                                }}
                                            >
                                                {/* Hover Glow Effect */}
                                                <motion.div
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-30 pointer-events-none transition-opacity"
                                                    style={{
                                                        background: `radial-gradient(circle at center, ${colors.primary}, transparent)`,
                                                    }}
                                                />

                                                {/* Checkbox */}
                                                <motion.div
                                                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center relative"
                                                    style={{
                                                        background: item.completed
                                                            ? MidnightTheme.gradients.lightHorizontal
                                                            : MidnightTheme.gradients.voidHorizontal,
                                                        border: `2px solid ${item.completed ? MidnightTheme.light.primary : MidnightTheme.void.primary}`,
                                                        boxShadow: item.completed
                                                            ? `0 0 15px ${MidnightTheme.light.glow}`
                                                            : `inset 0 2px 4px rgba(0, 0, 0, 0.4)`,
                                                    }}
                                                    animate={item.completed ? { scale: [1, 1.1, 1] } : {}}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    whileHover={{ rotate: 360 }}
                                                >
                                                    {item.completed ? (
                                                        <Check className="w-5 h-5" style={{ color: MidnightTheme.text.bright }} />
                                                    ) : (
                                                        <X className="w-5 h-5" style={{ color: MidnightTheme.text.muted }} />
                                                    )}
                                                </motion.div>

                                                {/* Item Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <h4
                                                            className={`text-base font-bold ${item.completed ? 'line-through' : ''}`}
                                                            style={{
                                                                color: item.completed ? MidnightTheme.text.muted : MidnightTheme.text.bright,
                                                                textShadow: item.completed
                                                                    ? 'none'
                                                                    : `0 0 8px ${colors.glow}`,
                                                            }}
                                                        >
                                                            {item.name}
                                                        </h4>
                                                        {item.progress && (
                                                            <motion.span
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wide"
                                                                style={{
                                                                    background: colors.gradient,
                                                                    color: MidnightTheme.text.bright,
                                                                    whiteSpace: 'nowrap',
                                                                    boxShadow: `0 0 10px ${colors.glow}`,
                                                                }}
                                                            >
                                                                {item.progress}
                                                            </motion.span>
                                                        )}
                                                    </div>
                                                    {item.why_important && (
                                                        <p className="text-sm mb-2 italic leading-relaxed" style={{ color: MidnightTheme.text.void }}>
                                                            {item.why_important}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-3 text-xs">
                                                        {item.source && (
                                                            <span
                                                                className="flex items-center gap-1"
                                                                style={{ color: MidnightTheme.text.muted }}
                                                            >
                                                                <span style={{ color: colors.text }}>📍</span> {item.source}
                                                            </span>
                                                        )}
                                                        {item.deadline && (
                                                            <span
                                                                className="flex items-center gap-1 font-bold"
                                                                style={{
                                                                    color: MidnightTheme.urgency.high,
                                                                    textShadow: `0 0 8px ${MidnightTheme.urgency.glow}`,
                                                                }}
                                                            >
                                                                <span>⏰</span> Deadline: {item.deadline}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
