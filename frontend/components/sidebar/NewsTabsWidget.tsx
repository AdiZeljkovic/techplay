"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function NewsTabsWidget() {
    const [activeTab, setActiveTab] = useState<"latest" | "popular">("latest");
    const [latestNews, setLatestNews] = useState<any[]>([]);
    const [popularNews, setPopularNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (apiUrl && apiUrl.includes('localhost')) {
                    apiUrl = apiUrl.replace('localhost', '127.0.0.1');
                }

                const res = await fetch(`${apiUrl}/home`);
                const json = await res.json();

                if (json.data) {
                    setLatestNews(json.data.latest_global || []);
                    setPopularNews(json.data.popular_global || []);
                }
            } catch (error) {
                console.error("Failed to fetch widget data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const currentData = activeTab === "latest" ? latestNews : popularNews;

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
                    {loading ? (
                        <div className="p-4 text-center text-white/40 text-xs">Loading...</div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-1"
                        >
                            {currentData.length === 0 && (
                                <div className="p-4 text-center text-white/40 text-xs">No articles found.</div>
                            )}
                            {currentData.map((item, idx) => (
                                <Link
                                    key={item.id}
                                    href={`/${item.category?.type === 'reviews' ? 'reviews' : (item.category?.type === 'tech' ? 'tech' : (item.category?.type === 'guides' ? 'guides' : 'news'))}/${item.slug}`}
                                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-white/10 flex items-center justify-center text-[var(--accent)] font-bold text-xs shadow-inner">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[9px] font-bold text-[var(--accent)] uppercase">{item.category?.name || 'News'}</span>
                                            <span className="text-[9px] text-white/30">•</span>
                                            <span className="text-[9px] text-white/40 flex items-center gap-1">
                                                {activeTab === "latest" ? (
                                                    <><Clock className="w-2.5 h-2.5" /> {item.published_at ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true }) : ''}</>
                                                ) : (
                                                    <><TrendingUp className="w-2.5 h-2.5" /> {item.views || 0}</>
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
                    )}
                </AnimatePresence>
            </div>

            <Link href="/news" className="block py-3 text-center text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest border-t border-white/5">
                View All News
            </Link>
        </div>
    );
}
