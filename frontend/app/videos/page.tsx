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
            {/* Privee Hero Section - Premium Cinematic Design */}
            <section className="relative min-h-[85vh] flex items-center overflow-hidden">
                {/* Multi-layer Background */}
                <div className="absolute inset-0">
                    {/* Base gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900" />

                    {/* Animated orbs */}
                    <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/25 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-pink-500/15 rounded-full blur-[180px]" />

                    {/* Grid overlay for depth */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />

                    {/* Top vignette */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
                </div>

                <div className="container mx-auto px-4 relative z-10 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">

                        {/* Left: Text Content - takes 7 columns */}
                        <div className="lg:col-span-7 text-center lg:text-left space-y-8">
                            {/* Privee Logo with glow */}
                            <div className="inline-block">
                                <img
                                    src="/privee-logo.png"
                                    alt="Privee"
                                    className="h-14 md:h-20 mx-auto lg:mx-0 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                                />
                            </div>

                            {/* Premium Gradient Title */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
                                <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(217,70,239,0.3)]">
                                    Join Privee and start
                                </span>
                                <span className="block bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 bg-clip-text text-transparent mt-2">
                                    your cinematic journey!
                                </span>
                            </h1>

                            {/* Description with better typography */}
                            <p className="text-base md:text-lg lg:text-xl text-gray-300/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Your epic gaming moments and real-life adventures deserve more than just a standard upload—they deserve
                                <span className="text-white font-semibold"> the big screen treatment</span>.
                                Privee allows you to seamlessly blend your best clips and photos into immersive, movie-like narratives with
                                <span className="text-fuchsia-300 font-medium"> professional cinematic quality</span>.
                                Take total control of your content and share your journey with a global community of storytellers.
                            </p>

                            {/* Premium CTA Box */}
                            <div className="relative group inline-block">
                                {/* Glow behind */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />

                                <div className="relative bg-gradient-to-r from-purple-900/80 via-fuchsia-900/80 to-pink-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-5 shadow-2xl">
                                    <p className="text-base md:text-lg font-medium text-white flex items-center gap-3 flex-wrap justify-center lg:justify-start">
                                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </span>
                                        <span>
                                            <span className="text-fuchsia-300 font-bold">Register now</span> to claim your free Ultimate account—
                                            <br className="hidden md:block" />
                                            unlock Privee and turn your highlights into a masterpiece!
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Hero Image - takes 5 columns */}
                        <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative">
                            {/* Decorative ring behind image */}
                            <div className="absolute w-[450px] h-[450px] rounded-full border border-purple-500/20 animate-[spin_30s_linear_infinite]" />
                            <div className="absolute w-[500px] h-[500px] rounded-full border border-fuchsia-500/10 animate-[spin_40s_linear_infinite_reverse]" />

                            {/* Glow behind image */}
                            <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-purple-600/30 via-fuchsia-600/20 to-pink-600/30 rounded-full blur-3xl" />

                            {/* The Image */}
                            <img
                                src="/privee-hero.png"
                                alt="Privee cinematic experience"
                                className="relative z-10 max-h-[550px] w-auto object-contain drop-shadow-[0_0_60px_rgba(168,85,247,0.3)] hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom fade into content */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
            </section>

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
