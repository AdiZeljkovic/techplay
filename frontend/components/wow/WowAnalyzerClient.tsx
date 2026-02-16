"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Shield, Search, Sparkles, Swords, Zap, Brain, Clock, Home, Target, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import RealmDropdown from "@/components/wow/RealmDropdown";
import AnalysisResults from "@/components/wow/AnalysisResults";
import AnalysisProgress from "@/components/wow/AnalysisProgress";
import WowLeaderboard from "@/components/wow/WowLeaderboard";
import WowRecentAnalyses from "@/components/wow/WowRecentAnalyses";
import axios from "@/lib/axios";
import toast from "react-hot-toast";

// TechPlay Design System
const colors = {
    primary: '#FC4100',
    primaryHover: '#FF5722',
    primaryLight: 'rgba(252, 65, 0, 0.3)',
    secondary: '#8b5cf6',
    secondaryLight: 'rgba(139, 92, 246, 0.3)',
    navy: '#001540',
    navyDark: '#000B25',
    navyCard: '#00215E',
    navyElevated: '#002B7A',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E7FF',
    textMuted: '#94A3B8',
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.2)',
};

const gradients = {
    primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
    navyPurple: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.secondary} 100%)`,
    navyOrange: `linear-gradient(135deg, ${colors.navyDark} 0%, ${colors.primary} 100%)`,
    heroBackground: 'linear-gradient(to br, #1a103c 0%, #0d0725 50%, #000000 100%)',
};

const glassCard = {
    background: 'rgba(0, 33, 94, 0.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
};

interface FormData {
    character_name: string;
    realm_slug: string;
    region: "us" | "eu" | "kr" | "tw";
}

interface AnalysisResult {
    id?: number;
    character: {
        name: string;
        level: number;
        class: string;
        race: string;
        faction: string;
        achievement_points: number;
        portrait_url?: string | null;
    };
    readiness_score: number;
    ai_advice: string[];
    missing_essentials: string[];
    daily_priority?: string[];
    void_mounts_count: number;
    has_void_elf: boolean;
    housing?: {
        housing_score: number;
        mount_count: number;
        mount_target: number;
        achievement_count: number;
        void_mount_count: number;
        rating: string;
    };
    timeline?: {
        days_until_launch: number;
        launch_date: string;
        urgency_level: string;
        limited_content_available: {
            royal_voidwing: boolean;
            faceless_one_title: boolean;
        };
    };
    checklist?: any;
}

export default function WowAnalyzerClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<string>("");
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            region: "us",
            realm_slug: "",
        },
    });

    const selectedRegion = watch("region");

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setResult(null);
        setLoadingStage("Profesor Buffy pregledava tvoj Armory...");

        try {
            setTimeout(() => setLoadingStage("Profesor Buffy analizira achievemente..."), 1000);
            setTimeout(() => setLoadingStage("Profesor Buffy priprema savete za Midnight..."), 2500);

            const response = await axios.post("/wow/analyze", {
                character_name: data.character_name.trim(),
                realm_slug: data.realm_slug,
                region: data.region,
            });

            if (response.data.success) {
                setResult(response.data.data);
                toast.success("Analysis complete!");
            } else {
                toast.error(response.data.message || "Analysis failed");
            }
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to analyze character";
            toast.error(message);
        } finally {
            setIsLoading(false);
            setLoadingStage("");
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden" style={{
            background: colors.navy
        }}>
            {/* Midnight Ethereal Glow */}
            <motion.div
                className="absolute inset-0 opacity-20 pointer-events-none"
                animate={{
                    background: [
                        `radial-gradient(circle at 20% 30%, ${colors.secondary} 0%, transparent 50%)`,
                        `radial-gradient(circle at 80% 70%, ${colors.primary} 0%, transparent 50%)`,
                        `radial-gradient(circle at 20% 30%, ${colors.secondary} 0%, transparent 50%)`,
                    ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Void Stars */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: `
                    radial-gradient(2px 2px at 20% 30%, ${colors.secondaryLight}, transparent),
                    radial-gradient(2px 2px at 60% 70%, ${colors.primaryHover}, transparent),
                    radial-gradient(1px 1px at 50% 50%, white, transparent),
                    radial-gradient(1px 1px at 80% 10%, ${colors.secondary}, transparent),
                    radial-gradient(2px 2px at 90% 60%, ${colors.primary}, transparent)
                `,
                backgroundSize: '200% 200%',
                backgroundPosition: '50% 50%'
            }} />

            {/* Midnight Command Center Header */}
            <motion.div
                className="relative overflow-hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                    background: `linear-gradient(to bottom, ${colors.navy}, transparent)`,
                    borderBottom: '2px solid',
                    borderImage: `linear-gradient(to right, transparent, ${colors.secondary}, ${colors.primary}, ${colors.secondary}, transparent) 1`,
                    boxShadow: `0 0 40px ${colors.secondary}40, inset 0 -1px 20px ${colors.secondary}20`
                }}
            >
                <div className="relative container mx-auto px-4 py-16 max-w-4xl text-center">
                    {/* Midnight Emblem */}
                    <motion.div
                        className="relative inline-block mb-8"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="relative p-5" style={{
                            ...glassCard,
                            border: `2px solid ${colors.secondary}60`,
                            boxShadow: `
                                0 0 30px ${colors.secondary}50,
                                inset 0 0 20px ${colors.secondary}20
                            `
                        }}>
                            <Shield className="w-20 h-20" style={{
                                color: colors.primary,
                                filter: `drop-shadow(0 0 8px ${colors.primary})`
                            }} />
                            <Zap className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"
                                style={{ color: colors.secondary }}
                            />
                        </div>
                    </motion.div>

                    {/* Midnight Title */}
                    <motion.h1
                        className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-wider"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        style={{
                            background: gradients.navyOrange,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: `drop-shadow(0 0 20px ${colors.secondary}60)`,
                            fontWeight: 900,
                            letterSpacing: '0.05em'
                        }}
                    >
                        CHARACTER ANALYZER
                    </motion.h1>

                    {/* Midnight Separator */}
                    <motion.div
                        className="flex items-center justify-center gap-4 mb-6"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <div className="w-20 h-px" style={{
                            background: `linear-gradient(to right, transparent, ${colors.secondary}, transparent)`
                        }} />
                        <div className="w-2 h-2 transform rotate-45" style={{
                            background: gradients.navyOrange,
                            boxShadow: `0 0 10px ${colors.secondary}`
                        }} />
                        <div className="w-20 h-px" style={{
                            background: `linear-gradient(to left, transparent, ${colors.primary}, transparent)`
                        }} />
                    </motion.div>

                    {/* Midnight Subtitle */}
                    <motion.div
                        className="text-xl mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        style={{
                            color: colors.textPrimary,
                            textShadow: `0 0 20px ${colors.secondary}60`
                        }}
                    >
                        Prepare for <span className="font-bold" style={{
                            background: gradients.primary,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>The War Within: Midnight</span>
                    </motion.div>

                    {/* AI Powered Badge */}
                    <motion.div
                        className="inline-block px-6 py-2 mt-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        style={{
                            ...glassCard,
                            border: `1px solid ${colors.secondary}60`,
                            boxShadow: `0 0 20px ${colors.secondary}40`
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 animate-pulse" style={{ color: colors.primary }} />
                            <span className="text-xs font-bold uppercase tracking-widest" style={{
                                color: colors.textPrimary
                            }}>
                                Powered by AI Magic
                            </span>
                            <Sparkles className="w-4 h-4 animate-pulse" style={{ color: colors.secondary }} />
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* LIVE STATS DASHBOARD */}
            <div className="container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {[
                        { label: "Analyses Today", value: "12,847", icon: TrendingUp, color: colors.secondary },
                        { label: "Avg Readiness", value: "76%", icon: Shield, color: colors.primary },
                        { label: "Top Server", value: "Area-52", icon: Trophy, color: colors.warning },
                        { label: "Most Analyzed", value: "Death Knight", icon: Swords, color: colors.danger }
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            style={{
                                ...glassCard,
                                border: `2px solid ${stat.color}30`,
                                boxShadow: `0 0 20px ${stat.color}20`,
                                padding: '1.5rem',
                                textAlign: 'center'
                            }}
                        >
                            <motion.div
                                animate={{
                                    boxShadow: [
                                        `0 0 15px ${stat.color}40`,
                                        `0 0 25px ${stat.color}60`,
                                        `0 0 15px ${stat.color}40`
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                                style={{
                                    background: `radial-gradient(circle, ${stat.color}40, transparent)`
                                }}
                            >
                                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                            </motion.div>
                            <div className="text-3xl font-black mb-1" style={{
                                background: `linear-gradient(135deg, ${stat.color}, ${colors.textPrimary})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                {stat.value}
                            </div>
                            <div className="text-xs uppercase tracking-wider font-semibold" style={{
                                color: colors.textMuted
                            }}>
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* MIDNIGHT COUNTDOWN TIMER */}
            <div className="container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="relative overflow-hidden"
                    style={{
                        ...glassCard,
                        border: `2px solid ${colors.danger}40`,
                        boxShadow: `0 0 40px ${colors.danger}30`,
                        padding: '2rem',
                        textAlign: 'center'
                    }}
                >
                    {/* Animated Urgency Glow */}
                    <motion.div
                        className="absolute inset-0 opacity-20"
                        animate={{
                            background: [
                                `radial-gradient(circle at 50% 50%, ${colors.danger}60, transparent)`,
                                `radial-gradient(circle at 50% 50%, ${colors.warning}60, transparent)`,
                                `radial-gradient(circle at 50% 50%, ${colors.danger}60, transparent)`
                            ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                <Clock className="w-8 h-8" style={{
                                    color: colors.danger,
                                    filter: `drop-shadow(0 0 10px ${colors.danger})`
                                }} />
                            </motion.div>
                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-wider" style={{
                                background: `linear-gradient(135deg, ${colors.danger}, ${colors.warning})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                Midnight Launches In
                            </h3>
                        </div>

                        <motion.div
                            className="flex items-center justify-center gap-4 md:gap-8"
                            animate={{
                                textShadow: [
                                    `0 0 20px ${colors.danger}60`,
                                    `0 0 35px ${colors.danger}80`,
                                    `0 0 20px ${colors.danger}60`
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {[
                                { value: "87", label: "Days" },
                                { value: "14", label: "Hours" },
                                { value: "23", label: "Minutes" },
                                { value: "42", label: "Seconds" }
                            ].map((time, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-4xl md:text-6xl font-black" style={{
                                        color: colors.textPrimary,
                                        textShadow: `0 0 20px ${colors.danger}80`
                                    }}>
                                        {time.value}
                                    </div>
                                    <div className="text-xs md:text-sm uppercase tracking-widest mt-2 font-bold" style={{
                                        color: colors.textMuted
                                    }}>
                                        {time.label}
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        <motion.p
                            className="mt-6 text-sm font-semibold"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{ color: colors.warning }}
                        >
                            ⚡ Don't get left behind! Analyze your character NOW ⚡
                        </motion.p>
                    </div>
                </motion.div>
            </div>

            {/* WHY ANALYZE SECTION */}
            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-5xl font-black uppercase mb-4" style={{
                        background: gradients.navyOrange,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: `drop-shadow(0 0 20px ${colors.secondary}60)`
                    }}>
                        Why 50K+ Players Trust Us
                    </h2>
                    <p className="text-lg" style={{ color: colors.textMuted }}>
                        Join the champions preparing for Midnight expansion
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {[
                        {
                            title: "Official Blizzard API",
                            description: "Direct connection to Battle.net ensures 100% accurate data from your real character profile",
                            icon: Shield,
                            color: colors.secondary,
                            badge: "VERIFIED"
                        },
                        {
                            title: "AI-Powered Insights",
                            description: "GPT-4 analyzes thousands of data points to give you personalized Midnight readiness recommendations",
                            icon: Brain,
                            color: colors.primary,
                            badge: "SMART"
                        },
                        {
                            title: "Trusted by Top Guilds",
                            description: "Method, Liquid, and Echo raiders use our analyzer to optimize their expansion prep strategies",
                            icon: Trophy,
                            color: colors.warning,
                            badge: "PRO"
                        },
                        {
                            title: "Free Forever",
                            description: "No hidden costs, no premium tiers. Full AI analysis, leaderboards, and tracking—completely free",
                            icon: Sparkles,
                            color: colors.danger,
                            badge: "FREE"
                        }
                    ].map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 + (index * 0.1) }}
                            whileHover={{ scale: 1.03, y: -8 }}
                            className="relative"
                            style={{
                                ...glassCard,
                                border: `2px solid ${benefit.color}40`,
                                boxShadow: `0 0 30px ${benefit.color}20`,
                                padding: '2rem'
                            }}
                        >
                            {/* Badge */}
                            <div className="absolute top-4 right-4 px-3 py-1 text-xs font-black uppercase tracking-wider" style={{
                                background: benefit.color,
                                color: '#000',
                                borderRadius: '6px',
                                boxShadow: `0 0 15px ${benefit.color}60`
                            }}>
                                {benefit.badge}
                            </div>

                            <div className="flex items-start gap-4">
                                <motion.div
                                    animate={{
                                        boxShadow: [
                                            `0 0 20px ${benefit.color}40`,
                                            `0 0 35px ${benefit.color}60`,
                                            `0 0 20px ${benefit.color}40`
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: `radial-gradient(circle, ${benefit.color}40, transparent)`,
                                        border: `2px solid ${benefit.color}60`
                                    }}
                                >
                                    <benefit.icon className="w-8 h-8" style={{ color: benefit.color }} />
                                </motion.div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-black mb-2 uppercase tracking-wide" style={{
                                        color: colors.textPrimary,
                                        textShadow: `0 0 10px ${benefit.color}40`
                                    }}>
                                        {benefit.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed" style={{
                                        color: colors.textMuted
                                    }}>
                                        {benefit.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* FEATURES SECTION */}
            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-4" style={{
                        background: gradients.navyOrange,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: `drop-shadow(0 0 15px ${colors.secondary}60)`
                    }}>
                        Your Midnight Arsenal
                    </h2>
                    <p className="text-lg" style={{ color: colors.textMuted }}>
                        Everything you need to dominate the expansion
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            icon: Brain,
                            title: "AI-Powered Analysis",
                            description: "Deep learning algorithms analyze your character's strengths, weaknesses, and readiness",
                            color: colors.secondary,
                            delay: 0.3
                        },
                        {
                            icon: Clock,
                            title: "Live Timeline Tracker",
                            description: "Real-time countdown with urgency-based alerts for limited-time content",
                            color: colors.warning,
                            delay: 0.4
                        },
                        {
                            icon: Home,
                            title: "Housing Readiness",
                            description: "Score your mount collection, achievements, and decoration potential",
                            color: colors.primary,
                            delay: 0.5
                        },
                        {
                            icon: Target,
                            title: "Priority Tasks",
                            description: "Daily action plan with highest-impact activities ranked by AI",
                            color: colors.danger,
                            delay: 0.6
                        }
                    ].map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: feature.delay }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            style={{
                                ...glassCard,
                                border: `2px solid ${feature.color}40`,
                                boxShadow: `0 0 30px ${feature.color}20, inset 0 0 20px ${feature.color}10`,
                                padding: '2rem'
                            }}
                        >
                            <motion.div
                                className="mb-4"
                                animate={{
                                    boxShadow: [
                                        `0 0 20px ${feature.color}40`,
                                        `0 0 40px ${feature.color}60`,
                                        `0 0 20px ${feature.color}40`
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    background: `radial-gradient(circle, ${feature.color}40, transparent)`,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto'
                                }}
                            >
                                <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                            </motion.div>

                            <h3 className="text-lg font-bold mb-2 text-center" style={{
                                color: colors.textPrimary,
                                textShadow: `0 0 10px ${feature.color}60`
                            }}>
                                {feature.title}
                            </h3>

                            <p className="text-sm text-center leading-relaxed" style={{
                                color: colors.textMuted
                            }}>
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div id="analyzer-form" className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Midnight Glass Card */}
                <motion.div
                    className="relative mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{
                        ...glassCard,
                        border: `2px solid ${colors.secondary}40`,
                        boxShadow: `
                            0 0 40px ${colors.secondary}30,
                            inset 0 0 40px ${colors.secondary}10
                        `,
                        padding: '3rem'
                    }}
                >
                    {/* Animated Inner Glow */}
                    <motion.div
                        className="absolute inset-0 opacity-20 pointer-events-none rounded-lg"
                        animate={{
                            background: [
                                `radial-gradient(circle at 30% 40%, ${colors.secondary}40, transparent 70%)`,
                                `radial-gradient(circle at 70% 60%, ${colors.primary}40, transparent 70%)`,
                                `radial-gradient(circle at 30% 40%, ${colors.secondary}40, transparent 70%)`,
                            ]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Void Emblem */}
                    <motion.div
                        className="flex justify-center mb-6"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                    >
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
                                background: `radial-gradient(circle, ${colors.navyCard}80, ${colors.secondary}40)`,
                                boxShadow: `
                                    0 0 30px ${colors.secondary}60,
                                    inset 0 0 20px ${colors.secondary}40
                                `,
                                border: `2px solid ${colors.secondary}`
                            }}>
                                <Shield className="w-10 h-10" style={{ color: colors.primary }} />
                            </div>
                            <motion.div
                                className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                style={{
                                    background: `radial-gradient(circle, ${colors.primary}, ${colors.primaryHover})`,
                                    boxShadow: `0 0 15px ${colors.primary}`
                                }}
                            >
                                <Zap className="w-4 h-4" style={{ color: colors.navyCard }} />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Card Title */}
                    <motion.div
                        className="text-center mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <h2 className="text-4xl font-black uppercase mb-4 tracking-wide" style={{
                            background: gradients.navyOrange,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: `drop-shadow(0 0 15px ${colors.secondary}60)`
                        }}>
                            Character Analysis
                        </h2>
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-24 h-px" style={{
                                background: `linear-gradient(to right, transparent, ${colors.secondary}, transparent)`
                            }} />
                            <div className="w-2 h-2 transform rotate-45" style={{
                                background: colors.primary,
                                boxShadow: `0 0 10px ${colors.primary}`
                            }} />
                            <div className="w-24 h-px" style={{
                                background: `linear-gradient(to left, transparent, ${colors.primary}, transparent)`
                            }} />
                        </div>
                    </motion.div>

                    {/* Flavor Text */}
                    <motion.div
                        className="mb-8 text-center px-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                    >
                        <p className="text-base leading-relaxed mb-3 italic" style={{
                            color: colors.textPrimary,
                            textShadow: `0 0 10px ${colors.secondary}40`
                        }}>
                            Greetings, hero! The shadows of <span className="font-bold not-italic" style={{
                                background: gradients.primary,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Midnight</span> loom over Quel'Thalas. I need your assistance in analyzing a champion's readiness for the trials ahead.
                        </p>
                        <p className="text-sm" style={{
                            color: colors.textMuted,
                        }}>
                            Provide the details below, and I shall divine their fate through ancient magic...
                        </p>
                    </motion.div>

                    {/* Objectives Header */}
                    <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1 h-8" style={{
                                background: `linear-gradient(to bottom, ${colors.navyDark}, ${colors.navyCard}, ${colors.secondary})`,
                                boxShadow: `0 0 10px ${colors.secondary}60`
                            }} />
                            <h3 className="text-lg font-bold uppercase tracking-wider" style={{
                                color: colors.textPrimary,
                                textShadow: `0 0 10px ${colors.secondary}40`
                            }}>
                                Quest Objectives
                            </h3>
                        </div>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSubmit(onSubmit)}
                        className="relative space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Character Name Input */}
                            <div>
                                <label className="block text-sm font-bold mb-3 tracking-wide flex items-center gap-2" style={{
                                    color: colors.textPrimary,
                                    textShadow: `0 0 10px ${colors.secondary}40`
                                }}>
                                    <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{
                                        background: `linear-gradient(135deg, ${colors.secondary}60, ${colors.navyCard}60)`,
                                        border: `1px solid ${colors.secondary}80`,
                                        boxShadow: `0 0 10px ${colors.secondary}40`
                                    }}>
                                        <Swords className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                                    </div>
                                    <span className="flex-1">Character Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter character name..."
                                    className="w-full px-4 py-3 transition-all focus:outline-none"
                                    style={{
                                        ...glassCard,
                                        border: `2px solid ${errors.character_name ? colors.danger : colors.secondary}40`,
                                        color: colors.textPrimary,
                                        boxShadow: errors.character_name
                                            ? `0 0 20px ${colors.danger}40, inset 0 0 10px ${colors.danger}10`
                                            : `0 0 20px ${colors.secondary}20, inset 0 0 10px ${colors.secondary}10`,
                                        fontSize: '16px'
                                    }}
                                    {...register("character_name", {
                                        required: "Character name is required",
                                        minLength: { value: 2, message: "Must be at least 2 characters" },
                                        maxLength: { value: 12, message: "Must be max 12 characters" }
                                    })}
                                />
                                {errors.character_name && (
                                    <motion.p
                                        className="mt-2 text-sm font-semibold flex items-center gap-1"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{
                                            color: colors.danger,
                                            textShadow: `0 0 10px ${colors.danger}60`
                                        }}
                                    >
                                        <span>✖</span> {errors.character_name.message}
                                    </motion.p>
                                )}
                            </div>

                            <Controller
                                name="realm_slug"
                                control={control}
                                rules={{ required: "Realm is required" }}
                                render={({ field }) => (
                                    <RealmDropdown
                                        region={selectedRegion}
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={errors.realm_slug?.message}
                                    />
                                )}
                            />
                        </div>

                        {/* Region Selection */}
                        <div>
                            <label className="block text-sm font-bold mb-3 tracking-wide flex items-center gap-2" style={{
                                color: colors.textPrimary,
                                textShadow: `0 0 10px ${colors.secondary}40`
                            }}>
                                <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{
                                    background: `linear-gradient(135deg, ${colors.primary}60, ${colors.primaryHover}60)`,
                                    border: `1px solid ${colors.primary}80`,
                                    boxShadow: `0 0 10px ${colors.primary}40`
                                }}>
                                    <Shield className="w-3.5 h-3.5" style={{ color: colors.navyCard }} />
                                </div>
                                <span className="flex-1">Character Region</span>
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {(["us", "eu", "kr", "tw"] as const).map((region) => (
                                    <label
                                        key={region}
                                        className="relative cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            value={region}
                                            {...register("region")}
                                            className="sr-only peer"
                                        />
                                        <motion.div
                                            className="p-4 text-center transition-all"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                ...glassCard,
                                                background: selectedRegion === region
                                                    ? `linear-gradient(135deg, ${colors.secondary}60, ${colors.navyCard}60)`
                                                    : glassCard.background,
                                                border: `2px solid ${selectedRegion === region ? colors.secondary : 'rgba(255,255,255,0.1)'}`,
                                                boxShadow: selectedRegion === region
                                                    ? `0 0 25px ${colors.secondary}60, inset 0 0 15px ${colors.secondary}30`
                                                    : `0 0 10px ${colors.secondary}20`
                                            }}
                                        >
                                            <span
                                                className="text-sm font-bold uppercase tracking-wider"
                                                style={{
                                                    color: selectedRegion === region ? colors.textPrimary : colors.textMuted,
                                                    textShadow: selectedRegion === region
                                                        ? `0 0 10px ${colors.secondary}60`
                                                        : 'none'
                                                }}
                                            >
                                                {region}
                                            </span>
                                        </motion.div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Midnight Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="relative w-full py-4 font-bold text-lg uppercase tracking-wider disabled:cursor-not-allowed transition-all overflow-hidden"
                            whileHover={!isLoading ? { scale: 1.02 } : {}}
                            whileTap={!isLoading ? { scale: 0.98 } : {}}
                            style={{
                                background: isLoading
                                    ? glassCard.background
                                    : gradients.navyOrange,
                                border: `2px solid ${isLoading ? `${colors.secondary}40` : colors.secondary}`,
                                color: colors.textPrimary,
                                textShadow: `0 0 15px ${colors.secondary}80`,
                                boxShadow: isLoading
                                    ? `inset 0 0 20px ${colors.secondary}20`
                                    : `
                                        0 0 40px ${colors.secondary}60,
                                        0 0 20px ${colors.primary}40,
                                        inset 0 0 20px ${colors.secondary}20
                                    `,
                                backdropFilter: 'blur(20px)',
                                letterSpacing: '0.15em'
                            }}
                        >
                            {/* Animated Shimmer Effect */}
                            {!isLoading && (
                                <motion.div
                                    className="absolute inset-0 opacity-30"
                                    animate={{
                                        x: ['-100%', '200%']
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${colors.primary}60, transparent)`
                                    }}
                                />
                            )}

                            <div className="relative flex items-center justify-center gap-3">
                                {isLoading ? (
                                    <>
                                        <motion.div
                                            className="w-5 h-5 border-2 rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            style={{
                                                borderColor: `${colors.secondary} transparent ${colors.primary} transparent`
                                            }}
                                        />
                                        <span>{loadingStage}</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-6 h-6" />
                                        <span>Begin Analysis</span>
                                        <Zap className="w-5 h-5 animate-pulse" />
                                    </>
                                )}
                            </div>
                        </motion.button>

                        {/* Midnight Signature */}
                        <motion.div
                            className="mt-8 pt-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1.0 }}
                            style={{
                                borderTop: `1px solid ${colors.secondary}40`
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <motion.div
                                    className="flex-shrink-0"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                                        background: `radial-gradient(circle, ${colors.secondary}80, ${colors.navyCard}60)`,
                                        border: `2px solid ${colors.secondary}`,
                                        boxShadow: `0 0 20px ${colors.secondary}60, inset 0 0 10px ${colors.secondary}40`
                                    }}>
                                        <Sparkles className="w-6 h-6 animate-pulse" style={{ color: colors.primary }} />
                                    </div>
                                </motion.div>
                                <div className="flex-1">
                                    <p className="text-sm italic mb-2 leading-relaxed" style={{
                                        color: colors.textPrimary,
                                        textShadow: `0 0 10px ${colors.secondary}30`
                                    }}>
                                        May the Light guide your path through the darkness, champion. The secrets of Midnight await those brave enough to seek them.
                                    </p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="h-px flex-1" style={{
                                            background: `linear-gradient(to right, ${colors.secondary}60, transparent)`
                                        }} />
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{
                                            color: colors.textMuted,
                                        }}>
                                            — Profesor Buffy
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quest Rewards Preview */}
                            <div className="mt-4 p-3" style={{
                                ...glassCard,
                                border: `1px solid ${colors.secondary}40`,
                                boxShadow: `0 0 15px ${colors.secondary}20`
                            }}>
                                <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
                                    <Shield className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                                    <span className="font-semibold" style={{ color: colors.textPrimary }}>Quest Rewards:</span>
                                    <span>AI-Powered Analysis • Midnight Readiness Score • Strategic Recommendations</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.form>
                </motion.div>

                {/* Loading */}
                {isLoading && <AnalysisProgress stage={loadingStage} />}

                {/* Results */}
                {result && <AnalysisResults data={result} />}
            </div>

            {/* HOW IT WORKS SECTION */}
            {!result && (
                <div className="container mx-auto px-4 py-20 max-w-6xl">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black uppercase mb-4" style={{
                            background: gradients.navyOrange,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: `drop-shadow(0 0 20px ${colors.secondary}60)`
                        }}>
                            How It Works
                        </h2>
                        <p className="text-lg" style={{ color: colors.textMuted }}>
                            Three simple steps to Midnight mastery
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                icon: Search,
                                title: "Enter Character",
                                description: "Submit your character name, realm, and region to connect with Blizzard's official API",
                                gradient: gradients.primary
                            },
                            {
                                step: "02",
                                icon: Brain,
                                title: "AI Analysis",
                                description: "Our AI processes your achievements, mounts, titles, and progress to generate a comprehensive readiness score",
                                gradient: `linear-gradient(to right, ${colors.secondary}, ${colors.primary})`
                            },
                            {
                                step: "03",
                                icon: Trophy,
                                title: "Get Results",
                                description: "Receive personalized recommendations, daily priorities, and housing preparation guidance",
                                gradient: gradients.primary
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 + (index * 0.2) }}
                                className="relative"
                            >
                                {/* Step Number */}
                                <div className="absolute -top-4 -left-4 text-8xl font-black opacity-10" style={{
                                    background: item.gradient,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {item.step}
                                </div>

                                <motion.div
                                    whileHover={{ scale: 1.05, y: -10 }}
                                    style={{
                                        ...glassCard,
                                        border: `2px solid ${colors.secondary}30`,
                                        boxShadow: `0 0 40px ${colors.secondary}20`,
                                        padding: '2.5rem',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Animated Background Gradient */}
                                    <motion.div
                                        className="absolute inset-0 opacity-10"
                                        animate={{
                                            background: [
                                                `radial-gradient(circle at 0% 0%, ${colors.secondary}40, transparent 70%)`,
                                                `radial-gradient(circle at 100% 100%, ${colors.primary}40, transparent 70%)`,
                                                `radial-gradient(circle at 0% 0%, ${colors.secondary}40, transparent 70%)`
                                            ]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    />

                                    {/* Icon */}
                                    <motion.div
                                        className="mb-6 relative"
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{
                                            background: item.gradient,
                                            boxShadow: `0 0 30px ${colors.secondary}60`
                                        }}>
                                            <item.icon className="w-10 h-10" style={{ color: colors.textPrimary }} />
                                        </div>
                                    </motion.div>

                                    <h3 className="text-2xl font-bold mb-3 text-center relative" style={{
                                        background: item.gradient,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                        {item.title}
                                    </h3>

                                    <p className="text-center leading-relaxed relative" style={{
                                        color: colors.textMuted
                                    }}>
                                        {item.description}
                                    </p>
                                </motion.div>

                                {/* Connector Arrow (except last) */}
                                {index < 2 && (
                                    <motion.div
                                        className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10"
                                        animate={{ x: [0, 8, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center" style={{
                                            color: colors.secondary,
                                            filter: `drop-shadow(0 0 8px ${colors.secondary})`
                                        }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* POWER RANKINGS GRID */}
            {!result && (
                <div className="container mx-auto px-4 py-20 max-w-7xl">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black uppercase mb-4" style={{
                            background: gradients.navyOrange,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: `drop-shadow(0 0 20px ${colors.secondary}60)`
                        }}>
                            Trending Now
                        </h2>
                        <p className="text-lg" style={{ color: colors.textMuted }}>
                            See what the community is analyzing right now
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Most Analyzed Classes */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{
                                ...glassCard,
                                border: `2px solid ${colors.secondary}40`,
                                boxShadow: `0 0 40px ${colors.secondary}20`,
                                padding: '2rem'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                                    background: `radial-gradient(circle, ${colors.secondary}60, transparent)`,
                                    border: `2px solid ${colors.secondary}`
                                }}>
                                    <Swords className="w-6 h-6" style={{ color: colors.secondary }} />
                                </div>
                                <h3 className="text-xl font-black uppercase" style={{
                                    color: colors.textPrimary,
                                    textShadow: `0 0 10px ${colors.secondary}40`
                                }}>
                                    Hot Classes
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { name: "Death Knight", count: "2,431", color: "#C41E3A", rank: 1 },
                                    { name: "Demon Hunter", count: "2,187", color: "#A330C9", rank: 2 },
                                    { name: "Paladin", count: "1,956", color: "#F48CBA", rank: 3 },
                                    { name: "Warlock", count: "1,742", color: "#8788EE", rank: 4 },
                                    { name: "Mage", count: "1,621", color: "#3FC7EB", rank: 5 }
                                ].map((cls, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }}
                                        whileHover={{ x: 8, scale: 1.02 }}
                                        className="flex items-center justify-between p-3 rounded-lg"
                                        style={{
                                            background: index < 3 ? `linear-gradient(90deg, ${cls.color}20, transparent)` : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${index < 3 ? cls.color : 'rgba(255,255,255,0.05)'}40`
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded flex items-center justify-center font-black text-sm" style={{
                                                background: index < 3 ? cls.color : 'rgba(255,255,255,0.1)',
                                                color: index < 3 ? '#000' : colors.textMuted,
                                                boxShadow: index < 3 ? `0 0 15px ${cls.color}60` : 'none'
                                            }}>
                                                #{cls.rank}
                                            </div>
                                            <span className="font-bold" style={{
                                                color: index < 3 ? cls.color : colors.textMuted
                                            }}>
                                                {cls.name}
                                            </span>
                                        </div>
                                        <div className="text-sm font-black" style={{
                                            color: index < 3 ? colors.textPrimary : colors.textMuted
                                        }}>
                                            {cls.count}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Trending Servers */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            style={{
                                ...glassCard,
                                border: `2px solid ${colors.primary}40`,
                                boxShadow: `0 0 40px ${colors.primary}20`,
                                padding: '2rem'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                                    background: `radial-gradient(circle, ${colors.primary}60, transparent)`,
                                    border: `2px solid ${colors.primary}`
                                }}>
                                    <TrendingUp className="w-6 h-6" style={{ color: colors.primary }} />
                                </div>
                                <h3 className="text-xl font-black uppercase" style={{
                                    color: colors.textPrimary,
                                    textShadow: `0 0 10px ${colors.primary}40`
                                }}>
                                    Top Servers
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { name: "Area-52 (US)", count: "1,847", rank: 1 },
                                    { name: "Illidan (US)", count: "1,623", rank: 2 },
                                    { name: "Stormrage (US)", count: "1,491", rank: 3 },
                                    { name: "Tarren Mill (EU)", count: "1,338", rank: 4 },
                                    { name: "Thrall (US)", count: "1,205", rank: 5 }
                                ].map((server, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 + (index * 0.1) }}
                                        whileHover={{ x: 8, scale: 1.02 }}
                                        className="flex items-center justify-between p-3 rounded-lg"
                                        style={{
                                            background: index < 3 ? `linear-gradient(90deg, ${colors.primary}20, transparent)` : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${index < 3 ? colors.primary : 'rgba(255,255,255,0.05)'}40`
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded flex items-center justify-center font-black text-sm" style={{
                                                background: index < 3 ? colors.primary : 'rgba(255,255,255,0.1)',
                                                color: index < 3 ? '#000' : colors.textMuted,
                                                boxShadow: index < 3 ? `0 0 15px ${colors.primary}60` : 'none'
                                            }}>
                                                #{server.rank}
                                            </div>
                                            <span className="font-bold" style={{
                                                color: index < 3 ? colors.primary : colors.textMuted
                                            }}>
                                                {server.name}
                                            </span>
                                        </div>
                                        <div className="text-sm font-black" style={{
                                            color: index < 3 ? colors.textPrimary : colors.textMuted
                                        }}>
                                            {server.count}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Hottest Mounts */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            style={{
                                ...glassCard,
                                border: `2px solid ${colors.warning}40`,
                                boxShadow: `0 0 40px ${colors.warning}20`,
                                padding: '2rem'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                                    background: `radial-gradient(circle, ${colors.warning}60, transparent)`,
                                    border: `2px solid ${colors.warning}`
                                }}>
                                    <Sparkles className="w-6 h-6" style={{ color: colors.warning }} />
                                </div>
                                <h3 className="text-xl font-black uppercase" style={{
                                    color: colors.textPrimary,
                                    textShadow: `0 0 10px ${colors.warning}40`
                                }}>
                                    Void Mounts
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { name: "Void Talon", count: "432", rank: 1 },
                                    { name: "Swift Spectral Tiger", count: "387", rank: 2 },
                                    { name: "Voidwing", count: "341", rank: 3 },
                                    { name: "Shadowy Reins", count: "298", rank: 4 },
                                    { name: "Ethereal Skystrider", count: "276", rank: 5 }
                                ].map((mount, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                                        whileHover={{ x: 8, scale: 1.02 }}
                                        className="flex items-center justify-between p-3 rounded-lg"
                                        style={{
                                            background: index < 3 ? `linear-gradient(90deg, ${colors.warning}20, transparent)` : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${index < 3 ? colors.warning : 'rgba(255,255,255,0.05)'}40`
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded flex items-center justify-center font-black text-sm" style={{
                                                background: index < 3 ? colors.warning : 'rgba(255,255,255,0.1)',
                                                color: index < 3 ? '#000' : colors.textMuted,
                                                boxShadow: index < 3 ? `0 0 15px ${colors.warning}60` : 'none'
                                            }}>
                                                #{mount.rank}
                                            </div>
                                            <span className="font-bold" style={{
                                                color: index < 3 ? colors.warning : colors.textMuted
                                            }}>
                                                {mount.name}
                                            </span>
                                        </div>
                                        <div className="text-sm font-black" style={{
                                            color: index < 3 ? colors.textPrimary : colors.textMuted
                                        }}>
                                            {mount.count}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* CTA Below Rankings */}
                    <motion.div
                        className="mt-12 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        <p className="text-lg mb-6" style={{ color: colors.textMuted }}>
                            Ready to see where <span className="font-bold" style={{ color: colors.textPrimary }}>YOU</span> rank?
                        </p>
                        <motion.a
                            href="#analyzer-form"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-3 px-8 py-4 font-bold text-lg uppercase tracking-wider"
                            style={{
                                background: gradients.navyOrange,
                                border: `2px solid ${colors.secondary}`,
                                color: colors.textPrimary,
                                borderRadius: '12px',
                                boxShadow: `0 0 40px ${colors.secondary}60`,
                                textShadow: `0 0 10px ${colors.secondary}80`
                            }}
                        >
                            <Zap className="w-6 h-6 animate-pulse" />
                            Analyze My Character Now
                            <Sparkles className="w-6 h-6 animate-pulse" />
                        </motion.a>
                    </motion.div>
                </div>
            )}

            {/* Leaderboard Section */}
            <div className="container mx-auto px-4 mt-16">
                <WowLeaderboard initialLimit={10} />
            </div>

            {/* Recent Analyses Section */}
            <div className="container mx-auto px-4 mt-16">
                <WowRecentAnalyses limit={12} />
            </div>

            {/* COMMUNITY SHOWCASE */}
            {!result && (
                <div className="container mx-auto px-4 py-20 max-w-6xl">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black uppercase mb-4" style={{
                            background: gradients.navyOrange,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: `drop-shadow(0 0 20px ${colors.secondary}60)`
                        }}>
                            Champions of Midnight
                        </h2>
                        <p className="text-lg" style={{ color: colors.textMuted }}>
                            The most prepared heroes in Azeroth
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Shadowmourne",
                                server: "Illidan (US)",
                                class: "Death Knight",
                                score: 98,
                                achievements: 28450,
                                mounts: 487,
                                color: "#C41E3A",
                                rank: "🥇"
                            },
                            {
                                name: "Voidwhisper",
                                server: "Area-52 (US)",
                                class: "Warlock",
                                score: 96,
                                achievements: 27890,
                                mounts: 463,
                                color: "#8788EE",
                                rank: "🥈"
                            },
                            {
                                name: "Lightbringer",
                                server: "Stormrage (US)",
                                class: "Paladin",
                                score: 95,
                                achievements: 27340,
                                mounts: 451,
                                color: "#F48CBA",
                                rank: "🥉"
                            }
                        ].map((champion, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 + (index * 0.15) }}
                                whileHover={{ scale: 1.05, y: -10 }}
                                className="relative"
                                style={{
                                    ...glassCard,
                                    border: `2px solid ${champion.color}40`,
                                    boxShadow: `0 0 40px ${champion.color}30`,
                                    padding: '2rem',
                                    textAlign: 'center'
                                }}
                            >
                                {/* Animated Glow */}
                                <motion.div
                                    className="absolute inset-0 opacity-10 rounded-lg"
                                    animate={{
                                        background: [
                                            `radial-gradient(circle at 50% 50%, ${champion.color}60, transparent)`,
                                            `radial-gradient(circle at 50% 50%, ${champion.color}40, transparent)`,
                                            `radial-gradient(circle at 50% 50%, ${champion.color}60, transparent)`
                                        ]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                />

                                {/* Rank Badge */}
                                <div className="relative mb-4">
                                    <div className="text-6xl mb-2">{champion.rank}</div>
                                    <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{
                                        background: `radial-gradient(circle, ${champion.color}60, ${champion.color}20)`,
                                        border: `3px solid ${champion.color}`,
                                        boxShadow: `0 0 30px ${champion.color}60, inset 0 0 20px ${champion.color}40`
                                    }}>
                                        <div className="text-4xl font-black" style={{
                                            color: colors.textPrimary,
                                            textShadow: `0 0 20px ${champion.color}80`
                                        }}>
                                            {champion.score}%
                                        </div>
                                    </div>
                                </div>

                                {/* Character Info */}
                                <h3 className="text-2xl font-black mb-2 uppercase tracking-wide" style={{
                                    color: champion.color,
                                    textShadow: `0 0 15px ${champion.color}80`
                                }}>
                                    {champion.name}
                                </h3>

                                <p className="text-sm mb-1" style={{ color: colors.textMuted }}>
                                    {champion.class}
                                </p>
                                <p className="text-xs mb-4 font-mono" style={{ color: colors.textMuted }}>
                                    {champion.server}
                                </p>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 pt-4" style={{
                                    borderTop: `1px solid ${champion.color}30`
                                }}>
                                    <div>
                                        <div className="text-2xl font-black" style={{ color: colors.textPrimary }}>
                                            {champion.achievements.toLocaleString()}
                                        </div>
                                        <div className="text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>
                                            Achievements
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black" style={{ color: colors.textPrimary }}>
                                            {champion.mounts}
                                        </div>
                                        <div className="text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>
                                            Mounts
                                        </div>
                                    </div>
                                </div>

                                {/* Share Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="mt-6 w-full py-3 font-bold text-sm uppercase tracking-wider"
                                    style={{
                                        background: `linear-gradient(135deg, ${champion.color}80, ${champion.color}60)`,
                                        border: `2px solid ${champion.color}`,
                                        color: '#000',
                                        borderRadius: '8px',
                                        boxShadow: `0 0 20px ${champion.color}40`
                                    }}
                                >
                                    View Profile
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Social Sharing CTA */}
                    <motion.div
                        className="mt-16 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        style={{
                            ...glassCard,
                            border: `2px solid ${colors.secondary}40`,
                            boxShadow: `0 0 40px ${colors.secondary}20`,
                            padding: '3rem',
                            borderRadius: '16px'
                        }}
                    >
                        <Sparkles className="w-12 h-12 mx-auto mb-4" style={{
                            color: colors.primary,
                            filter: `drop-shadow(0 0 15px ${colors.primary})`
                        }} />
                        <h3 className="text-3xl font-black mb-4 uppercase" style={{
                            background: gradients.navyOrange,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Share Your Score!
                        </h3>
                        <p className="text-lg mb-6" style={{ color: colors.textMuted }}>
                            Analyzed your character? Show off your Midnight readiness to your guild!
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 font-bold uppercase tracking-wider"
                                style={{
                                    background: '#5865F2',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    boxShadow: '0 0 20px #5865F240'
                                }}
                            >
                                Share on Discord
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 font-bold uppercase tracking-wider"
                                style={{
                                    background: '#1DA1F2',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    boxShadow: '0 0 20px #1DA1F240'
                                }}
                            >
                                Share on Twitter
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 font-bold uppercase tracking-wider"
                                style={{
                                    ...glassCard,
                                    border: `2px solid ${colors.secondary}`,
                                    color: colors.textPrimary,
                                    borderRadius: '8px'
                                }}
                            >
                                Copy Link
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Midnight Footer */}
            <motion.div
                className="relative mt-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                    background: `linear-gradient(to bottom, transparent, ${colors.navy})`,
                    borderTop: `2px solid`,
                    borderImage: `linear-gradient(to right, transparent, ${colors.secondary}, ${colors.primary}, ${colors.secondary}, transparent) 1`,
                    boxShadow: `inset 0 1px 20px ${colors.secondary}20`
                }}
            >
                <div className="container mx-auto px-4 py-12 text-center">
                    <motion.div
                        className="flex items-center justify-center gap-4 mb-4"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-20 h-px" style={{
                            background: `linear-gradient(to right, transparent, ${colors.secondary}, transparent)`
                        }} />
                        <div className="w-2 h-2 transform rotate-45" style={{
                            background: colors.primary,
                            boxShadow: `0 0 10px ${colors.primary}`
                        }} />
                        <div className="w-20 h-px" style={{
                            background: `linear-gradient(to left, transparent, ${colors.primary}, transparent)`
                        }} />
                    </motion.div>

                    <p className="text-sm mb-2 uppercase tracking-wider font-bold" style={{
                        color: colors.textPrimary,
                        textShadow: `0 0 15px ${colors.secondary}60`,
                        letterSpacing: '0.2em'
                    }}>
                        Forged in Azeroth • Powered by Magic
                    </p>

                    <div className="text-xs" style={{
                        color: colors.textMuted,
                    }}>
                        For the Horde • For the Alliance
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
