"use client";

import Link from "next/link";

import useSWR from "swr";
import axios from "@/lib/axios";
import { useState } from "react";
import { Play, Clock, Video, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PageHero from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { useRealTimeVideos } from "@/hooks";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface VideoItem {
    id: number;
    title: string;
    slug: string;
    youtube_url: string;
    youtube_id: string;
    thumbnail_url?: string;
    published_at: string;
}

interface VideoResponse {
    data: VideoItem[];
    current_page: number;
    last_page: number;
    total: number;
    next_page_url: string | null;
}

export default function VideosPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isValidating } = useSWR<VideoResponse>(
        `/videos?page=${page}`,
        fetcher
    );

    // Real-time hook
    const { videos: realtimeVideos, newCount } = useRealTimeVideos([]);

    // Combine real-time with fetched
    const fetchedVideos = data?.data || [];
    const displayVideos = page === 1
        ? [...realtimeVideos.filter(rt => !fetchedVideos.some(f => f.id === rt.id)), ...fetchedVideos]
        : fetchedVideos;

    const getThumbnail = (video: VideoItem) => {
        if (video.thumbnail_url) return video.thumbnail_url;
        return `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Hero Section */}
            <PageHero
                title="Video Gallery"
                description="Watch our latest gaming videos, reviews, trailers, and tutorials."
                icon={Video}
            />

            {/* Videos Grid */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        Latest Videos
                    </h2>
                    <span className="text-sm text-[var(--text-muted)] font-mono">
                        {data?.total || 0} VIDEOS
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-video bg-[var(--bg-card)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : displayVideos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {displayVideos.map((video: any) => (
                                <Link
                                    key={video.id}
                                    href={`/videos/${video.slug}`}
                                    className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)] transition-all cursor-pointer block"
                                >
                                    <div className="relative aspect-video bg-black">
                                        <img
                                            src={getThumbnail(video)}
                                            alt={video.title}
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-[var(--accent)]/80 backdrop-blur-sm flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:scale-110 transition-all shadow-lg shadow-black/30">
                                                <Play className="w-7 h-7 text-white ml-1" fill="white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                            {video.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-[var(--text-muted)]">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-center gap-2 mb-12">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || isValidating}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>

                            <div className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)]">
                                Page <span className="font-bold text-white">{data?.current_page}</span> of {data?.last_page}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!data?.next_page_url || isValidating}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-24 bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-3xl">
                        <Video className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">No videos yet</h3>
                        <p className="text-[var(--text-secondary)]">Check back soon for new content!</p>
                    </div>
                )}
            </div>

            {/* Modal removed in favor of /videos/[slug] */}
        </div>
    );
}
