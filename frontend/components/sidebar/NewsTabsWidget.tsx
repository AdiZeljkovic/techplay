"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const LATEST_NEWS = [
    { id: 1, title: "NVIDIA RTX 5090 Leaked Specs Reveal Massive Power Draw", category: "Hardware", time: "2h ago" },
    { id: 2, title: "GTA VI Trailer Breaks Another YouTube Record", category: "Gaming", time: "4h ago" },
    { id: 3, title: "Steam Deck OLED vs ROG Ally: The Ultimate Comparison", category: "Hardware", time: "6h ago" },
    { id: 4, title: "Why Baldur's Gate 3 is Still the RPG to Beat in 2025", category: "Opinion", time: "12h ago" },
    { id: 5, title: "Microsoft Announces New Game Pass Tier", category: "News", time: "1d ago" }
];

const POPULAR_NEWS = [
    { id: 10, title: "Best Gaming Monitors for PS5 Pro in 2025", category: "Guides", views: "125k" },
    { id: 11, title: "The State of Esports: How Saudi Arabia Changed the Game", category: "Esports", views: "98k" },
    { id: 12, title: "Top 10 Hidden Gems on Steam You Missed", category: "Lists", views: "85k" },
    { id: 13, title: "Final Fantasy VII Rebirth: Full Walkthrough", category: "Guides", views: "72k" },
    { id: 14, title: "Cyberpunk 2077 Orion: Everything We Know", category: "News", views: "65k" }
];

export default function NewsTabsWidget() {
    const [activeTab, setActiveTab] = useState<"latest" | "popular">("latest");

    return (
        <div className="bg-[#00215E] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            {/* Header Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab("latest")}
                    className={cn(
                        "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all relative",
                        activeTab === "latest" ? "text-white" : "text-white/40 hover:text-white/70"
                    )}
                >
                    Latest
                    {activeTab === "latest" && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("popular")}
                    className={cn(
                        "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all relative",
                        activeTab === "popular" ? "text-white" : "text-white/40 hover:text-white/70"
                    )}
                >
                    Popular
                    {activeTab === "popular" && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
                    )}
                </button>
            </div>

            {/* Content List */}
            <div className="p-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-1"
                    >
                        {(activeTab === "latest" ? LATEST_NEWS : POPULAR_NEWS).map((item, idx) => (
                            <Link
                                key={item.id}
                                href={`/news/${item.id}`}
                                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-white/10 flex items-center justify-center text-[var(--accent)] font-bold text-xs shadow-inner">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[9px] font-bold text-[var(--accent)] uppercase">{item.category}</span>
                                        <span className="text-[9px] text-white/30">•</span>
                                        <span className="text-[9px] text-white/40 flex items-center gap-1">
                                            {activeTab === "latest" ? (
                                                <><Clock className="w-2.5 h-2.5" /> {item.time}</>
                                            ) : (
                                                <><TrendingUp className="w-2.5 h-2.5" /> {item.views}</>
                                            )}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-medium text-white/90 leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                        {item.title}
                                    </h4>
                                </div>
                            </Link>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <Link href="/news" className="block py-3 text-center text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest border-t border-white/5">
                View All News
            </Link>
        </div>
    );
}
