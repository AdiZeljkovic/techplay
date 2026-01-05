"use client";

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
}

export default function PageHero({
    title,
    description = "",
    icon: MainIcon,
    backgroundImage = "/hero-bg-default.jpg",
    categories,
    selectedCategory,
    onSelectCategory,
    basePath
}: PageHeroProps) {
    return (
        <div className="relative w-full h-[400px] mb-8 bg-[#000B25] overflow-hidden flex flex-col items-center justify-center text-center">

            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a103c] via-[#0d0725] to-[#000000]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(60,20,100,0.4)_0%,transparent_70%)] opacity-70" />
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }}
                />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 container mx-auto px-4 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center gap-4"
                >
                    {/* Floating Icon */}
                    {MainIcon && (
                        <div className="mb-2 relative">
                            <div className="absolute inset-0 blur-xl bg-[var(--accent)]/50 rounded-full" />
                            <MainIcon className="w-12 h-12 text-[var(--accent)] relative z-10" />
                        </div>
                    )}

                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-xl">
                        {title.split(' ').map((word, i) => (
                            <span key={i} className={i === 1 ? "text-[var(--accent)]" : ""}>{word} </span>
                        ))}
                    </h1>

                    <p className="text-lg md:text-xl text-white/60 max-w-2xl font-medium tracking-wide">
                        {description}
                    </p>
                </motion.div>
            </div>

            {/* Floating Navigation Pill - only show if categories exist */}
            {categories && categories.length > 0 && (
                <div className="absolute bottom-10 z-20 w-full px-4 flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="bg-[#0f1221]/90 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl flex flex-wrap justify-center gap-1 max-w-[90vw] overflow-x-auto scrollbar-hide"
                    >
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            const buttonClass = cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                                isSelected
                                    ? "bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] scale-105"
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                            );

                            if (basePath) {
                                return (
                                    <Link
                                        key={cat.id}
                                        href={cat.slug === 'all' ? basePath : `${basePath}/${cat.slug}`}
                                        className={buttonClass}
                                    >
                                        <cat.icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-[var(--accent)]")} />
                                        {cat.label}
                                    </Link>
                                );
                            }

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                                    className={buttonClass}
                                >
                                    <cat.icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-[var(--accent)]")} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
