"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { decodeHtml } from "@/lib/decode";
import { Article } from "@/types";

interface NewsTabsWidgetProps {
    latestNews: Article[];
    popularNews: Article[];
}

export default function NewsTabsWidget({ latestNews, popularNews }: NewsTabsWidgetProps) {
    const [activeTab, setActiveTab] = useState<"latest" | "popular">("latest");

    const currentData = activeTab === "latest" ? latestNews : popularNews;

    return (
        <div className="bg-[#00215E] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            {/* Header Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab("latest")}
                    className={cn(
                        "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all relative",
                        activeTab === "latest" ? "text-white" : "text-white/60 hover:text-white/80"
                    )}
                >
                    Latest
                    <span className={cn(
                        "absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] transition-opacity duration-200",
                        activeTab === "latest" ? "opacity-100" : "opacity-0"
                    )} />
                </button>
                <button
                    onClick={() => setActiveTab("popular")}
                    className={cn(
                        "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all relative",
                        activeTab === "popular" ? "text-white" : "text-white/60 hover:text-white/80"
                    )}
                >
                    Popular
                    <span className={cn(
                        "absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] transition-opacity duration-200",
                        activeTab === "popular" ? "opacity-100" : "opacity-0"
                    )} />
                </button>
            </div>

            {/* Content List */}
            <div className="p-2">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-1"
                    >
                        {currentData.length === 0 && (
                            <div className="p-4 text-center text-white/60 text-xs">No articles found.</div>
                        )}
                        {currentData.map((item, idx) => (
                            <Link
                                key={item.id}
                                href={`/${item.category?.type === 'reviews' ? 'reviews' : (item.category?.type === 'tech' ? 'hardware' : (item.category?.type === 'guides' ? 'guides' : 'news'))}/${item.slug}`}
                                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-white/10 flex items-center justify-center text-[var(--accent)] font-bold text-xs shadow-inner">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[9px] font-bold text-[var(--accent)] uppercase">{decodeHtml(item.category?.name) || 'News'}</span>
                                        <span className="text-[9px] text-white/60">•</span>
                                        <span className="text-[9px] text-white/60 flex items-center gap-1" suppressHydrationWarning>
                                            {activeTab === "latest" ? (
                                                <><Clock className="w-2.5 h-2.5" /> {item.published_at ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true }) : ''}</>
                                            ) : (
                                                <><TrendingUp className="w-2.5 h-2.5" /> {(item as any).views || 0}</>
                                            )}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-medium text-white/90 leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                        {decodeHtml(item.title)}
                                    </h4>
                                </div>
                            </Link>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <Link href="/news" className="block py-3 text-center text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest border-t border-white/5">
                View All News
            </Link>
        </div>
    );
}
