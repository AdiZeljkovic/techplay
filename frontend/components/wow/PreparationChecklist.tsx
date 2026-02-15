"use client";

import { motion } from "framer-motion";
import { Check, X, AlertCircle, BookOpen, Home, Swords, Target } from "lucide-react";

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
            case 'critical_limited': return { primary: '#DC143C', secondary: '#8B0000', glow: 'rgba(220,20,60,0.4)' };
            case 'lore_mastery': return { primary: '#9370DB', secondary: '#4B0082', glow: 'rgba(147,112,219,0.4)' };
            case 'housing_prep': return { primary: '#32CD32', secondary: '#228B22', glow: 'rgba(50,205,50,0.4)' };
            default: return { primary: '#FFD700', secondary: '#DAA520', glow: 'rgba(255,215,0,0.4)' };
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
            <div className="relative p-6 rounded-xl" style={{
                background: 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
                border: '8px solid',
                borderImage: 'linear-gradient(135deg, #5D4037, #3E2723) 1',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 0 6px 15px rgba(0,0,0,0.5)',
            }}>
                <h2
                    className="text-3xl font-bold uppercase tracking-wider text-center mb-2"
                    style={{
                        color: '#FFD700',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,215,0,0.4)',
                        fontFamily: 'serif',
                    }}
                >
                    📋 Midnight Preparation Checklist
                </h2>
                <p className="text-center text-sm italic mb-4" style={{ color: '#C9B388', fontFamily: 'serif' }}>
                    Track your readiness across all critical areas
                </p>
            </div>

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
                        transition={{ delay: catIndex * 0.1 }}
                        className="relative"
                    >
                        <div
                            className="p-6 rounded-xl"
                            style={{
                                background: 'linear-gradient(to bottom, #f5f5dc 0%, #e8e0c8 100%)',
                                border: '6px solid',
                                borderColor: colors.primary,
                                boxShadow: `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 20px ${colors.glow}`,
                            }}
                        >
                            {/* Category Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{
                                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                            boxShadow: `0 4px 8px rgba(0,0,0,0.4), inset 1px 1px 3px rgba(255,255,255,0.2), 0 0 15px ${colors.glow}`,
                                        }}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3
                                            className="text-xl font-bold uppercase tracking-wide"
                                            style={{ color: '#3E2723', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}
                                        >
                                            {category.data.label}
                                        </h3>
                                        <p className="text-xs" style={{ color: '#8B7355' }}>
                                            {category.data.items.length} item{category.data.items.length !== 1 && 's'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div
                                        className="text-3xl font-bold"
                                        style={{ color: completion === 100 ? '#228B22' : colors.primary }}
                                    >
                                        {completion}%
                                    </div>
                                    <p className="text-xs font-bold uppercase" style={{ color: '#8B7355' }}>Complete</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div
                                className="h-3 rounded-full mb-4 overflow-hidden"
                                style={{
                                    background: 'linear-gradient(to right, #3E2723, #2a1810)',
                                    border: '2px solid #8B7355',
                                }}
                            >
                                <motion.div
                                    className="h-full"
                                    style={{
                                        background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
                                        boxShadow: `0 0 10px ${colors.glow}`,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completion}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>

                            {/* Checklist Items */}
                            <div className="space-y-3">
                                {category.data.items.length === 0 ? (
                                    <p className="text-center py-4 text-sm italic" style={{ color: '#8B7355' }}>
                                        No items in this category
                                    </p>
                                ) : (
                                    category.data.items.map((item, itemIndex) => (
                                        <motion.div
                                            key={itemIndex}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: catIndex * 0.1 + itemIndex * 0.05 }}
                                            className="flex items-start gap-3 p-3 rounded-lg transition-all"
                                            style={{
                                                background: item.completed
                                                    ? 'linear-gradient(to right, rgba(34,139,34,0.15), rgba(50,205,50,0.1))'
                                                    : 'linear-gradient(to right, rgba(139,115,85,0.1), rgba(107,83,69,0.05))',
                                                border: '2px solid',
                                                borderColor: item.completed ? '#228B22' : '#C9B388',
                                            }}
                                        >
                                            {/* Checkbox */}
                                            <div
                                                className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
                                                style={{
                                                    background: item.completed
                                                        ? `linear-gradient(135deg, #32CD32, #228B22)`
                                                        : 'linear-gradient(135deg, #8B7355, #6B5345)',
                                                    border: '2px solid',
                                                    borderColor: item.completed ? '#FFD700' : '#5D4037',
                                                    boxShadow: item.completed
                                                        ? '0 0 10px rgba(50,205,50,0.5)'
                                                        : 'inset 1px 1px 2px rgba(0,0,0,0.4)',
                                                }}
                                            >
                                                {item.completed ? (
                                                    <Check className="w-4 h-4 text-white font-bold" />
                                                ) : (
                                                    <X className="w-4 h-4 text-[#C9B388]" />
                                                )}
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4
                                                        className={`text-sm font-bold ${item.completed ? 'line-through' : ''}`}
                                                        style={{
                                                            color: item.completed ? '#228B22' : '#3E2723',
                                                            textShadow: '1px 1px 1px rgba(255,255,255,0.3)',
                                                        }}
                                                    >
                                                        {item.name}
                                                    </h4>
                                                    {item.progress && (
                                                        <span
                                                            className="text-xs font-bold px-2 py-1 rounded"
                                                            style={{
                                                                background: 'linear-gradient(135deg, #6B5914, #5D4037)',
                                                                color: '#FFD700',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {item.progress}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.why_important && (
                                                    <p className="text-xs mb-1 italic" style={{ color: '#5D4037' }}>
                                                        {item.why_important}
                                                    </p>
                                                )}
                                                {item.source && (
                                                    <p className="text-xs" style={{ color: '#8B7355' }}>
                                                        📍 {item.source}
                                                    </p>
                                                )}
                                                {item.deadline && (
                                                    <p className="text-xs font-bold" style={{ color: '#DC143C' }}>
                                                        ⏰ Deadline: {item.deadline}
                                                    </p>
                                                )}
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
