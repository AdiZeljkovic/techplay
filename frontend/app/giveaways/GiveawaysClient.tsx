"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { Gift, Clock, Users, Trophy, Filter, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import PageHero from "@/components/ui/PageHero";

interface Giveaway {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    featured_image: string | null;
    prize: {
        name: string;
        value: number | null;
        image: string | null;
    };
    timing: {
        starts_at: string;
        ends_at: string;
        is_active: boolean;
        has_ended: boolean;
        time_remaining: number | null;
    };
    stats: {
        total_entries: number;
    };
    winner: {
        id: number;
        username: string;
        avatar: string | null;
    } | null;
    status: string;
}

export default function GiveawaysClient() {
    const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "ended">("active");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchGiveaways = async () => {
            setLoading(true);
            try {
                const res = await axios.get("/giveaways", {
                    params: {
                        status: filter,
                        page: currentPage,
                    },
                });
                setGiveaways(res.data.data);
                setTotalPages(res.data.meta.last_page);
            } catch (error) {
                console.error("Failed to fetch giveaways:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGiveaways();
    }, [filter, currentPage]);

    const formatTimeRemaining = (seconds: number | null) => {
        if (!seconds) return null;
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h`;
        return "< 1h";
    };

    return (
        <div className="min-h-screen">
            <PageHero
                title="Giveaways"
                description="Win amazing gaming prizes"
                icon={Gift}
            />

            <div className="container-page py-16">
                {/* Filters */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-[var(--text-secondary)]" />
                        <span className="text-[var(--text-secondary)] font-medium">Filter:</span>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { value: "active", label: "Active" },
                            { value: "all", label: "All" },
                            { value: "ended", label: "Ended" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setFilter(option.value as any);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                    filter === option.value
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
                    </div>
                ) : giveaways.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-20">
                        <Gift className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            No giveaways found
                        </h2>
                        <p className="text-[var(--text-secondary)]">
                            Check back later for new giveaways!
                        </p>
                    </div>
                ) : (
                    /* Giveaway Grid */
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {giveaways.map((giveaway, index) => (
                                <motion.div
                                    key={giveaway.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link href={`/giveaway/${giveaway.slug}`}>
                                        <div className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)]/50 transition-all hover:shadow-xl hover:shadow-[var(--accent)]/10">
                                            {/* Prize Image */}
                                            <div className="relative h-48 bg-gradient-to-br from-[var(--accent)]/10 to-transparent overflow-hidden">
                                                {giveaway.prize.image ? (
                                                    <Image
                                                        src={giveaway.prize.image}
                                                        alt={giveaway.prize.name}
                                                        fill
                                                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Gift className="w-20 h-20 text-[var(--text-muted)]" />
                                                    </div>
                                                )}

                                                {/* Status Badge */}
                                                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                                                    {giveaway.winner ? (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/90 backdrop-blur-md text-white rounded-full text-xs font-bold">
                                                            <Trophy className="w-3 h-3" />
                                                            Winner!
                                                        </div>
                                                    ) : giveaway.timing.is_active ? (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/90 backdrop-blur-md text-white rounded-full text-xs font-bold">
                                                            <Clock className="w-3 h-3" />
                                                            Active
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/90 backdrop-blur-md text-white rounded-full text-xs font-bold">
                                                            Ended
                                                        </div>
                                                    )}

                                                    {/* Ending Soon badge */}
                                                    {giveaway.timing.is_active && giveaway.timing.time_remaining !== null && giveaway.timing.time_remaining < 86400 && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 backdrop-blur-md text-white rounded-full text-xs font-bold animate-pulse">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Ending Soon!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                {/* Title */}
                                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                                    {giveaway.title}
                                                </h3>

                                                {/* Prize */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-sm font-semibold text-[var(--text-secondary)]">
                                                        {giveaway.prize.name}
                                                    </span>
                                                    {giveaway.prize.value && (
                                                        <span className="text-lg font-black text-[var(--accent)]">
                                                            €{giveaway.prize.value}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                                                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                                        <Users className="w-4 h-4" />
                                                        <span className="text-sm">
                                                            {giveaway.stats.total_entries} entries
                                                        </span>
                                                    </div>

                                                    {giveaway.winner && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
                                                                {giveaway.winner.username[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-sm text-[var(--text-secondary)]">
                                                                @{giveaway.winner.username}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Countdown bar for active giveaways */}
                                                {giveaway.timing.is_active && giveaway.timing.time_remaining && (
                                                    <div className={`flex items-center justify-center gap-2 mt-3 py-2 rounded-lg text-xs font-bold ${
                                                        giveaway.timing.time_remaining < 86400
                                                            ? "bg-red-500/10 text-red-400"
                                                            : "bg-[var(--accent)]/10 text-[var(--accent)]"
                                                    }`}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatTimeRemaining(giveaway.timing.time_remaining)} remaining
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="px-4 py-2 text-[var(--text-secondary)]">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
