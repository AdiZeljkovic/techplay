"use client";

import { useState, useEffect, useRef } from "react";
import {
    Play, Sparkles, Video, Film, Loader2,
    ChevronLeft, ChevronRight
} from "lucide-react";

// API Constants
const API_BASE = "https://38wzs9wt1a.execute-api.eu-central-1.amazonaws.com";
const USER_ID = "e9eaa260-4aed-421c-8f87-c4d6bfe7bc79";

// Types
interface Movie {
    id: string;
    title: string;
    status: string;
    lastUploadedVisual?: {
        thumbnailPathSafe: string;
        title: string;
        viewCount: number;
    };
}

interface Visual {
    id: string;
    title: string;
    viewCount: number;
    reactionCount: number;
    commentCount: number;
    createdAt: string;
    media: {
        path: string;
        baseMediaPath?: string;
        thumbnailImagePath: string;
        thumbnailPath: string;
    };
}

export default function VideosPage() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [visuals, setVisuals] = useState<Visual[]>([]);
    const [currentVisualIndex, setCurrentVisualIndex] = useState(0);
    const [isLoadingMovies, setIsLoadingMovies] = useState(true);
    const [isLoadingVisuals, setIsLoadingVisuals] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Fetch movies on mount
    useEffect(() => {
        fetchMovies();
    }, []);

    // Fetch visuals when movie is selected
    useEffect(() => {
        if (selectedMovie) {
            fetchVisuals(selectedMovie.id);
        }
    }, [selectedMovie]);

    // Setup HLS when video changes
    useEffect(() => {
        if (visuals.length > 0 && videoRef.current) {
            const currentVisual = visuals[currentVisualIndex];
            const videoUrl = currentVisual?.media?.path;
            const fallbackUrl = currentVisual?.media?.baseMediaPath;

            if (videoUrl && videoUrl.includes('.m3u8')) {
                // For HLS streams, try hls.js first
                loadHlsVideo(videoUrl, fallbackUrl);
            } else if (videoUrl) {
                videoRef.current.src = videoUrl;
            } else if (fallbackUrl) {
                videoRef.current.src = fallbackUrl;
            }
        }
    }, [visuals, currentVisualIndex]);

    const loadHlsVideo = async (url: string, fallbackUrl?: string) => {
        if (!videoRef.current) return;

        // Check for native HLS support first (Safari)
        if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = url;
            videoRef.current.addEventListener('loadedmetadata', () => {
                videoRef.current?.play().catch(() => { });
            });
            return;
        }

        // Try dynamic import of hls.js
        try {
            const Hls = (await import('hls.js')).default;

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoRef.current);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoRef.current?.play().catch(() => { });
                });
                return;
            }
        } catch (error) {
            console.warn('HLS.js not available, using fallback');
        }

        // Fallback to MP4 if available
        if (fallbackUrl && videoRef.current) {
            videoRef.current.src = fallbackUrl;
        }
    };

    const fetchMovies = async () => {
        try {
            setIsLoadingMovies(true);
            setError(null);
            const response = await fetch(
                `${API_BASE}/users/get-public-movies-by-user-id?userId=${USER_ID}`
            );
            const data = await response.json();

            // Filter movies that have visuals
            const validMovies = (data.data?.movies?.items || []).filter(
                (movie: Movie) => movie.lastUploadedVisual !== null
            );

            setMovies(validMovies);

            // Auto-select first movie
            if (validMovies.length > 0) {
                setSelectedMovie(validMovies[0]);
            }
        } catch (err) {
            setError("Failed to load movies");
            console.error(err);
        } finally {
            setIsLoadingMovies(false);
        }
    };

    const fetchVisuals = async (movieId: string) => {
        try {
            setIsLoadingVisuals(true);
            setError(null);
            const response = await fetch(`${API_BASE}/visuals/public/${movieId}`);
            const data = await response.json();

            setVisuals(data.data?.visuals?.items || []);
            setCurrentVisualIndex(0);
        } catch (err) {
            setError("Failed to load videos");
            console.error(err);
        } finally {
            setIsLoadingVisuals(false);
        }
    };

    const handleMovieClick = (movie: Movie) => {
        setSelectedMovie(movie);
        setCurrentVisualIndex(0);
    };

    const handlePrevVideo = () => {
        setCurrentVisualIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextVideo = () => {
        setCurrentVisualIndex(prev => Math.min(visuals.length - 1, prev + 1));
    };

    const currentVisual = visuals[currentVisualIndex];

    return (
        <div className="min-h-screen bg-slate-950">
            {/* ═══════════════════════════════════════════════════════════════════
                HERO SECTION - Immersive Cinematic Experience
            ════════════════════════════════════════════════════════════════════ */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden">
                {/* Layered Background System */}
                <div className="absolute inset-0">
                    {/* Deep space gradient */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0f0a1e_50%,#030014_100%)]" />

                    {/* Floating orbs with staggered animations */}
                    <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-fuchsia-600/15 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
                    <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[1000px] h-[400px] bg-violet-500/10 rounded-full blur-[200px]" />
                    <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                    {/* Animated grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-purple-400/60 rounded-full animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${2 + Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Cinematic vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 relative z-10 py-16">
                    {/* Logo with enhanced glow - CENTERED PAGE WIDE */}
                    <div className="flex justify-center mb-12 relative">
                        <div className="relative group cursor-default">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 blur-3xl opacity-20 scale-150 group-hover:opacity-40 transition-opacity duration-700" />
                            <img
                                src="/privee-logo.png"
                                alt="Privee"
                                className="relative h-20 md:h-28 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

                        {/* Left Content - 7 cols */}
                        <div className="lg:col-span-7 text-center lg:text-left">

                            {/* Premium Title with layered effects */}
                            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tighter mb-8">
                                <span className="block relative">
                                    <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent blur-2xl opacity-50">
                                        Join Privee
                                    </span>
                                    <span className="relative bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                                        Join Privee
                                    </span>
                                </span>
                                <span className="block text-white/90 mt-2">and start your</span>
                                <span className="block relative mt-2">
                                    <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                                        cinematic journey!
                                    </span>
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-lg md:text-xl text-gray-300/80 leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-10">
                                Your epic gaming moments and real-life adventures deserve
                                <span className="text-white font-semibold"> the big screen treatment</span>.
                                Blend your best clips into immersive narratives with
                                <span className="text-fuchsia-300 font-medium"> professional cinematic quality</span>.
                            </p>

                            {/* CTA Box with Store Badges */}
                            <div className="relative group inline-block">
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-700" />
                                <div className="relative bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-2xl px-6 py-5 shadow-2xl">
                                    <div className="flex flex-col lg:flex-row items-center gap-6">
                                        {/* Left: CTA Text */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/40 shrink-0">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-white">
                                                    <span className="text-fuchsia-300">Register now</span> for your free Ultimate account
                                                </p>
                                                <p className="text-gray-400 text-sm">Turn your highlights into a masterpiece!</p>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="hidden lg:block w-px h-12 bg-white/20" />

                                        {/* Right: Store Badges */}
                                        <div className="flex items-center gap-3">
                                            <a href="https://apps.apple.com/app/privee" target="_blank" rel="noopener noreferrer"
                                                className="transition-transform hover:scale-105">
                                                <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-11" />
                                            </a>
                                            <a href="https://play.google.com/store/apps/details?id=com.privee" target="_blank" rel="noopener noreferrer"
                                                className="transition-transform hover:scale-105">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-11" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right - Hero Image with orbital design */}
                        <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative h-[600px]">
                            {/* Orbital rings */}
                            <div className="absolute w-[480px] h-[480px] rounded-full border border-purple-500/30 animate-[spin_25s_linear_infinite]" />
                            <div className="absolute w-[380px] h-[380px] rounded-full border border-fuchsia-500/20 animate-[spin_35s_linear_infinite_reverse]" />
                            <div className="absolute w-[280px] h-[280px] rounded-full border-2 border-dashed border-pink-500/10 animate-[spin_45s_linear_infinite]" />

                            {/* Orbital dots */}
                            <div className="absolute w-[480px] h-[480px] animate-[spin_25s_linear_infinite]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
                            </div>
                            <div className="absolute w-[380px] h-[380px] animate-[spin_35s_linear_infinite_reverse]">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-fuchsia-400 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.8)]" />
                            </div>

                            {/* Central glow */}
                            <div className="absolute w-[350px] h-[350px] bg-gradient-to-br from-purple-600/40 via-fuchsia-600/30 to-pink-600/40 rounded-full blur-3xl" />

                            {/* Hero image */}
                            <img
                                src="/privee-hero.png"
                                alt="Privee"
                                className="relative z-10 max-h-[520px] w-auto object-contain drop-shadow-[0_0_80px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform duration-1000"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom transition */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                CATEGORY FILTER - Dynamic Movie Buttons
            ════════════════════════════════════════════════════════════════════ */}
            <section className="relative z-30 -mt-12">
                <div className="container mx-auto px-4">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-purple-600/20 rounded-2xl blur-2xl" />

                        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-purple-500/10">
                            {isLoadingMovies ? (
                                <div className="flex items-center justify-center py-4 gap-3">
                                    <Loader2 className="w-5 h-5 text-fuchsia-400 animate-spin" />
                                    <span className="text-gray-400">Loading categories...</span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {movies.map((movie) => {
                                        const isActive = selectedMovie?.id === movie.id;
                                        return (
                                            <button
                                                key={movie.id}
                                                onClick={() => handleMovieClick(movie)}
                                                className={`
                                                    relative flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-500
                                                    ${isActive
                                                        ? 'text-white'
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-xl shadow-lg shadow-fuchsia-500/30" />
                                                )}
                                                <Film className={`relative w-4 h-4 ${isActive ? 'text-white' : 'text-fuchsia-400'}`} />
                                                <span className="relative">{movie.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                VIDEO PLAYER SECTION
            ════════════════════════════════════════════════════════════════════ */}
            <section className="relative py-20">
                <div className="container mx-auto px-4">
                    {isLoadingVisuals ? (
                        <div className="relative rounded-3xl overflow-hidden bg-slate-900/50 border border-white/5 h-[500px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 text-fuchsia-400 animate-spin" />
                                <span className="text-gray-400">Loading videos...</span>
                            </div>
                        </div>
                    ) : visuals.length > 0 && currentVisual ? (
                        <div className="relative">
                            {/* Background glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-pink-600/20 rounded-[2rem] blur-2xl opacity-50" />

                            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                                    {/* Main Video Player */}
                                    <div className="lg:col-span-2">
                                        <div className="relative aspect-[9/16] max-h-[70vh] mx-auto bg-black rounded-2xl overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                className="w-full h-full object-contain"
                                                controls
                                                playsInline
                                                poster={currentVisual.media?.thumbnailImagePath}
                                            />

                                            {/* Video Navigation */}
                                            {visuals.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={handlePrevVideo}
                                                        disabled={currentVisualIndex === 0}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronLeft className="w-6 h-6" />
                                                    </button>
                                                    <button
                                                        onClick={handleNextVideo}
                                                        disabled={currentVisualIndex === visuals.length - 1}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronRight className="w-6 h-6" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Video Info */}
                                        <div className="mt-4">
                                            <h2 className="text-2xl font-bold text-white mb-2">{currentVisual.title}</h2>
                                        </div>
                                    </div>

                                    {/* Video Playlist */}
                                    <div className="lg:col-span-1">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Video className="w-5 h-5 text-fuchsia-400" />
                                            {selectedMovie?.title} ({visuals.length} videos)
                                        </h3>
                                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {visuals.map((visual, index) => (
                                                <button
                                                    key={visual.id}
                                                    onClick={() => setCurrentVisualIndex(index)}
                                                    className={`
                                                        w-full flex gap-3 p-3 rounded-xl transition-all duration-300
                                                        ${index === currentVisualIndex
                                                            ? 'bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 border border-fuchsia-500/50'
                                                            : 'bg-slate-800/30 hover:bg-slate-800/60 border border-transparent'
                                                        }
                                                    `}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0">
                                                        <img
                                                            src={visual.media?.thumbnailImagePath || visual.media?.thumbnailPath}
                                                            alt={visual.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {index === currentVisualIndex && (
                                                            <div className="absolute inset-0 bg-fuchsia-500/30 flex items-center justify-center">
                                                                <Play className="w-6 h-6 text-white" fill="white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Info */}
                                                    <div className="flex-1 text-left">
                                                        <p className={`text-sm font-medium line-clamp-2 ${index === currentVisualIndex ? 'text-white' : 'text-gray-300'}`}>
                                                            {visual.title}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : !isLoadingMovies && movies.length > 0 ? (
                        /* Empty State - No videos in selected category */
                        <div className="relative text-center py-32 rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-white/10" />
                            <div className="absolute inset-0">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/20 flex items-center justify-center">
                                    <Video className="w-12 h-12 text-fuchsia-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">No videos in this category</h3>
                                <p className="text-gray-400 text-lg max-w-md mx-auto">
                                    Select a different category above to view videos.
                                </p>
                            </div>
                        </div>
                    ) : !isLoadingMovies ? (
                        /* Empty State - No movies at all */
                        <div className="relative text-center py-32 rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-white/10" />
                            <div className="absolute inset-0">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/20 flex items-center justify-center">
                                    <Video className="w-12 h-12 text-fuchsia-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">No videos yet</h3>
                                <p className="text-gray-400 text-lg max-w-md mx-auto">
                                    The Privee community is just getting started. Check back soon for amazing cinematic content!
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </section>

            {/* Custom scrollbar styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(168, 85, 247, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(168, 85, 247, 0.7);
                }
            `}</style>
        </div>
    );
}
