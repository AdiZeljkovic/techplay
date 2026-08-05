"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface CategoryItem {
    id: string; // The backend ID/Slug used for filtering
    label: string;
    icon: LucideIcon;
    slug?: string; // The URL slug (optional, defaults to id if not provided)
}

interface PageHeroProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    backgroundImage?: string;
    categories?: CategoryItem[];
    selectedCategory?: string; // The ID currently selected
    onSelectCategory?: (id: string) => void;
    basePath?: string; // If provided, uses Links instead of buttons
    categoryBase?: string; // Optional override for category links (e.g. /news/category)
}

export default function PageHero({
    title,
    description = "",
    icon: MainIcon,
    backgroundImage,
    categories,
    selectedCategory,
    onSelectCategory,
    basePath,
    categoryBase
}: PageHeroProps) {
    return (
        <div className="relative w-full mb-10 overflow-hidden bg-zinc-50 dark:bg-[#05070A] border-b border-zinc-200 dark:border-[#161B22] transition-colors duration-300">

            {/* Background decorations */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-tp-accent/5 dark:bg-tp-accent/10 blur-[120px] rounded-full" />
                <div
                    className="absolute inset-0 opacity-[0.15] dark:opacity-[0.04]"
                    style={{ backgroundImage: 'radial-gradient(1px 1px at 50% 50%, rgba(120,120,130,0.8) 1px, transparent 0)', backgroundSize: '32px 32px' }}
                />
                <div className="absolute top-0 left-[25%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 dark:via-tp-accent/40 to-transparent" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 container-page pt-14 pb-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    {/* Icon box */}
                    {MainIcon && (
                        <div className="w-[52px] h-[52px] rounded-xl bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(220, 20, 60,0.15)]">
                            <MainIcon className="w-6 h-6 text-tp-accent" strokeWidth={1.75} />
                        </div>
                    )}

                    <h1 className="font-display text-[36px] md:text-[52px] font-black text-zinc-900 dark:text-white uppercase leading-[0.95] tracking-tight mb-4">
                        {title.split(' ').map((word, i) => (
                            <span key={i} className={i === 1 ? "text-tp-accent" : ""}>{word} </span>
                        ))}
                    </h1>

                    {description && (
                        <p className="text-[15px] md:text-[16px] text-zinc-600 dark:text-[#A1A1AA] max-w-2xl leading-relaxed">
                            {description}
                        </p>
                    )}
                </motion.div>

                {/* Category Pills */}
                {categories && categories.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="mt-9 max-w-full"
                    >
                        <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl sm:rounded-full p-1.5 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex overflow-x-auto scrollbar-hide gap-1 max-w-[95vw] sm:max-w-[90vw]">
                            {categories.map((cat) => {
                                const isSelected = selectedCategory === cat.id;
                                const buttonClass = cn(
                                    "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                                    isSelected
                                        ? "bg-tp-accent text-white shadow-[0_0_15px_rgba(220, 20, 60,0.35)]"
                                        : "text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                                );

                                if (basePath) {
                                    return (
                                        <Link
                                            key={cat.id}
                                            href={cat.slug === 'all' ? basePath : `${categoryBase || basePath}/${cat.slug}`}
                                            className={buttonClass}
                                        >
                                            <cat.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isSelected ? "text-white" : "text-tp-accent")} />
                                            <span className="hidden xs:inline sm:inline">{cat.label}</span>
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                                        className={buttonClass}
                                    >
                                        <cat.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isSelected ? "text-white" : "text-tp-accent")} />
                                        <span className="hidden xs:inline sm:inline">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
