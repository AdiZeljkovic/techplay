"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Shield, Search, Sparkles, Swords, Zap } from "lucide-react";
import { motion } from "framer-motion";
import RealmDropdown from "@/components/wow/RealmDropdown";
import AnalysisResults from "@/components/wow/AnalysisResults";
import AnalysisProgress from "@/components/wow/AnalysisProgress";
import WowLeaderboard from "@/components/wow/WowLeaderboard";
import WowRecentAnalyses from "@/components/wow/WowRecentAnalyses";
import { MidnightTheme, glassCard } from "@/lib/wow-midnight-theme";
import axios from "@/lib/axios";
import toast from "react-hot-toast";

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
            background: MidnightTheme.backgrounds.void
        }}>
            {/* Midnight Ethereal Glow */}
            <motion.div
                className="absolute inset-0 opacity-20 pointer-events-none"
                animate={{
                    background: [
                        `radial-gradient(circle at 20% 30%, ${MidnightTheme.void.primary} 0%, transparent 50%)`,
                        `radial-gradient(circle at 80% 70%, ${MidnightTheme.light.primary} 0%, transparent 50%)`,
                        `radial-gradient(circle at 20% 30%, ${MidnightTheme.void.primary} 0%, transparent 50%)`,
                    ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Void Stars */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: `
                    radial-gradient(2px 2px at 20% 30%, ${MidnightTheme.void.ethereal}, transparent),
                    radial-gradient(2px 2px at 60% 70%, ${MidnightTheme.light.warm}, transparent),
                    radial-gradient(1px 1px at 50% 50%, white, transparent),
                    radial-gradient(1px 1px at 80% 10%, ${MidnightTheme.void.primary}, transparent),
                    radial-gradient(2px 2px at 90% 60%, ${MidnightTheme.light.primary}, transparent)
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
                    background: `linear-gradient(to bottom, ${MidnightTheme.backgrounds.void}, transparent)`,
                    borderBottom: '2px solid',
                    borderImage: `linear-gradient(to right, transparent, ${MidnightTheme.void.primary}, ${MidnightTheme.light.primary}, ${MidnightTheme.void.primary}, transparent) 1`,
                    boxShadow: `0 0 40px ${MidnightTheme.void.primary}40, inset 0 -1px 20px ${MidnightTheme.void.primary}20`
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
                            border: `2px solid ${MidnightTheme.void.primary}60`,
                            boxShadow: `
                                0 0 30px ${MidnightTheme.void.primary}50,
                                inset 0 0 20px ${MidnightTheme.void.primary}20
                            `
                        }}>
                            <Shield className="w-20 h-20" style={{
                                color: MidnightTheme.light.primary,
                                filter: `drop-shadow(0 0 8px ${MidnightTheme.light.primary})`
                            }} />
                            <Zap className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"
                                style={{ color: MidnightTheme.void.primary }}
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
                            background: MidnightTheme.gradients.voidToLight,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: `drop-shadow(0 0 20px ${MidnightTheme.void.primary}60)`,
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
                            background: `linear-gradient(to right, transparent, ${MidnightTheme.void.primary}, transparent)`
                        }} />
                        <div className="w-2 h-2 transform rotate-45" style={{
                            background: MidnightTheme.gradients.voidToLight,
                            boxShadow: `0 0 10px ${MidnightTheme.void.primary}`
                        }} />
                        <div className="w-20 h-px" style={{
                            background: `linear-gradient(to left, transparent, ${MidnightTheme.light.primary}, transparent)`
                        }} />
                    </motion.div>

                    {/* Midnight Subtitle */}
                    <motion.div
                        className="text-xl mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        style={{
                            color: MidnightTheme.text.bright,
                            textShadow: `0 0 20px ${MidnightTheme.void.primary}60`
                        }}
                    >
                        Prepare for <span className="font-bold" style={{
                            background: MidnightTheme.gradients.voidHorizontal,
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
                            border: `1px solid ${MidnightTheme.void.primary}60`,
                            boxShadow: `0 0 20px ${MidnightTheme.void.primary}40`
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 animate-pulse" style={{ color: MidnightTheme.light.primary }} />
                            <span className="text-xs font-bold uppercase tracking-widest" style={{
                                color: MidnightTheme.text.bright
                            }}>
                                Powered by AI Magic
                            </span>
                            <Sparkles className="w-4 h-4 animate-pulse" style={{ color: MidnightTheme.void.primary }} />
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Midnight Glass Card */}
                <motion.div
                    className="relative mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{
                        ...glassCard,
                        border: `2px solid ${MidnightTheme.void.primary}40`,
                        boxShadow: `
                            0 0 40px ${MidnightTheme.void.primary}30,
                            inset 0 0 40px ${MidnightTheme.void.primary}10
                        `,
                        padding: '3rem'
                    }}
                >
                    {/* Animated Inner Glow */}
                    <motion.div
                        className="absolute inset-0 opacity-20 pointer-events-none rounded-lg"
                        animate={{
                            background: [
                                `radial-gradient(circle at 30% 40%, ${MidnightTheme.void.primary}40, transparent 70%)`,
                                `radial-gradient(circle at 70% 60%, ${MidnightTheme.light.primary}40, transparent 70%)`,
                                `radial-gradient(circle at 30% 40%, ${MidnightTheme.void.primary}40, transparent 70%)`,
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
                                background: `radial-gradient(circle, ${MidnightTheme.void.deep}80, ${MidnightTheme.void.primary}40)`,
                                boxShadow: `
                                    0 0 30px ${MidnightTheme.void.primary}60,
                                    inset 0 0 20px ${MidnightTheme.void.primary}40
                                `,
                                border: `2px solid ${MidnightTheme.void.primary}`
                            }}>
                                <Shield className="w-10 h-10" style={{ color: MidnightTheme.light.primary }} />
                            </div>
                            <motion.div
                                className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                style={{
                                    background: `radial-gradient(circle, ${MidnightTheme.light.primary}, ${MidnightTheme.light.warm})`,
                                    boxShadow: `0 0 15px ${MidnightTheme.light.primary}`
                                }}
                            >
                                <Zap className="w-4 h-4" style={{ color: MidnightTheme.void.deep }} />
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
                            background: MidnightTheme.gradients.voidToLight,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: `drop-shadow(0 0 15px ${MidnightTheme.void.primary}60)`
                        }}>
                            Character Analysis
                        </h2>
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-24 h-px" style={{
                                background: `linear-gradient(to right, transparent, ${MidnightTheme.void.primary}, transparent)`
                            }} />
                            <div className="w-2 h-2 transform rotate-45" style={{
                                background: MidnightTheme.light.primary,
                                boxShadow: `0 0 10px ${MidnightTheme.light.primary}`
                            }} />
                            <div className="w-24 h-px" style={{
                                background: `linear-gradient(to left, transparent, ${MidnightTheme.light.primary}, transparent)`
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
                            color: MidnightTheme.text.bright,
                            textShadow: `0 0 10px ${MidnightTheme.void.primary}40`
                        }}>
                            Greetings, hero! The shadows of <span className="font-bold not-italic" style={{
                                background: MidnightTheme.gradients.voidHorizontal,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Midnight</span> loom over Quel'Thalas. I need your assistance in analyzing a champion's readiness for the trials ahead.
                        </p>
                        <p className="text-sm" style={{
                            color: MidnightTheme.text.muted,
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
                                background: `linear-gradient(to bottom, ${MidnightTheme.void.dark}, ${MidnightTheme.void.deep}, ${MidnightTheme.void.primary})`,
                                boxShadow: `0 0 10px ${MidnightTheme.void.primary}60`
                            }} />
                            <h3 className="text-lg font-bold uppercase tracking-wider" style={{
                                color: MidnightTheme.text.bright,
                                textShadow: `0 0 10px ${MidnightTheme.void.primary}40`
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
                                    color: MidnightTheme.text.bright,
                                    textShadow: `0 0 10px ${MidnightTheme.void.primary}40`
                                }}>
                                    <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{
                                        background: `linear-gradient(135deg, ${MidnightTheme.void.primary}60, ${MidnightTheme.void.deep}60)`,
                                        border: `1px solid ${MidnightTheme.void.primary}80`,
                                        boxShadow: `0 0 10px ${MidnightTheme.void.primary}40`
                                    }}>
                                        <Swords className="w-3.5 h-3.5" style={{ color: MidnightTheme.light.primary }} />
                                    </div>
                                    <span className="flex-1">Character Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter character name..."
                                    className="w-full px-4 py-3 transition-all focus:outline-none"
                                    style={{
                                        ...glassCard,
                                        border: `2px solid ${errors.character_name ? MidnightTheme.urgency.critical : MidnightTheme.void.primary}40`,
                                        color: MidnightTheme.text.bright,
                                        boxShadow: errors.character_name
                                            ? `0 0 20px ${MidnightTheme.urgency.critical}40, inset 0 0 10px ${MidnightTheme.urgency.critical}10`
                                            : `0 0 20px ${MidnightTheme.void.primary}20, inset 0 0 10px ${MidnightTheme.void.primary}10`,
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
                                            color: MidnightTheme.urgency.critical,
                                            textShadow: `0 0 10px ${MidnightTheme.urgency.critical}60`
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
                                color: MidnightTheme.text.bright,
                                textShadow: `0 0 10px ${MidnightTheme.void.primary}40`
                            }}>
                                <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{
                                    background: `linear-gradient(135deg, ${MidnightTheme.light.primary}60, ${MidnightTheme.light.warm}60)`,
                                    border: `1px solid ${MidnightTheme.light.primary}80`,
                                    boxShadow: `0 0 10px ${MidnightTheme.light.primary}40`
                                }}>
                                    <Shield className="w-3.5 h-3.5" style={{ color: MidnightTheme.void.deep }} />
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
                                                    ? `linear-gradient(135deg, ${MidnightTheme.void.primary}60, ${MidnightTheme.void.deep}60)`
                                                    : glassCard.background,
                                                border: `2px solid ${selectedRegion === region ? MidnightTheme.void.primary : 'rgba(255,255,255,0.1)'}`,
                                                boxShadow: selectedRegion === region
                                                    ? `0 0 25px ${MidnightTheme.void.primary}60, inset 0 0 15px ${MidnightTheme.void.primary}30`
                                                    : `0 0 10px ${MidnightTheme.void.primary}20`
                                            }}
                                        >
                                            <span
                                                className="text-sm font-bold uppercase tracking-wider"
                                                style={{
                                                    color: selectedRegion === region ? MidnightTheme.text.bright : MidnightTheme.text.muted,
                                                    textShadow: selectedRegion === region
                                                        ? `0 0 10px ${MidnightTheme.void.primary}60`
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
                                    ? MidnightTheme.backgrounds.glass
                                    : MidnightTheme.gradients.voidToLight,
                                border: `2px solid ${isLoading ? `${MidnightTheme.void.primary}40` : MidnightTheme.void.primary}`,
                                color: MidnightTheme.text.bright,
                                textShadow: `0 0 15px ${MidnightTheme.void.primary}80`,
                                boxShadow: isLoading
                                    ? `inset 0 0 20px ${MidnightTheme.void.primary}20`
                                    : `
                                        0 0 40px ${MidnightTheme.void.primary}60,
                                        0 0 20px ${MidnightTheme.light.primary}40,
                                        inset 0 0 20px ${MidnightTheme.void.primary}20
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
                                        background: `linear-gradient(90deg, transparent, ${MidnightTheme.light.primary}60, transparent)`
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
                                                borderColor: `${MidnightTheme.void.primary} transparent ${MidnightTheme.light.primary} transparent`
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
                                borderTop: `1px solid ${MidnightTheme.void.primary}40`
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <motion.div
                                    className="flex-shrink-0"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                                        background: `radial-gradient(circle, ${MidnightTheme.void.primary}80, ${MidnightTheme.void.deep}60)`,
                                        border: `2px solid ${MidnightTheme.void.primary}`,
                                        boxShadow: `0 0 20px ${MidnightTheme.void.primary}60, inset 0 0 10px ${MidnightTheme.void.primary}40`
                                    }}>
                                        <Sparkles className="w-6 h-6 animate-pulse" style={{ color: MidnightTheme.light.primary }} />
                                    </div>
                                </motion.div>
                                <div className="flex-1">
                                    <p className="text-sm italic mb-2 leading-relaxed" style={{
                                        color: MidnightTheme.text.bright,
                                        textShadow: `0 0 10px ${MidnightTheme.void.primary}30`
                                    }}>
                                        May the Light guide your path through the darkness, champion. The secrets of Midnight await those brave enough to seek them.
                                    </p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="h-px flex-1" style={{
                                            background: `linear-gradient(to right, ${MidnightTheme.void.primary}60, transparent)`
                                        }} />
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{
                                            color: MidnightTheme.text.muted,
                                        }}>
                                            — Profesor Buffy
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quest Rewards Preview */}
                            <div className="mt-4 p-3" style={{
                                ...glassCard,
                                border: `1px solid ${MidnightTheme.void.primary}40`,
                                boxShadow: `0 0 15px ${MidnightTheme.void.primary}20`
                            }}>
                                <div className="flex items-center gap-2 text-xs" style={{ color: MidnightTheme.text.muted }}>
                                    <Shield className="w-3.5 h-3.5" style={{ color: MidnightTheme.light.primary }} />
                                    <span className="font-semibold" style={{ color: MidnightTheme.text.bright }}>Quest Rewards:</span>
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

            {/* Leaderboard Section */}
            <div className="container mx-auto px-4 mt-16">
                <WowLeaderboard initialLimit={10} />
            </div>

            {/* Recent Analyses Section */}
            <div className="container mx-auto px-4 mt-16">
                <WowRecentAnalyses limit={12} />
            </div>

            {/* Midnight Footer */}
            <motion.div
                className="relative mt-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                    background: `linear-gradient(to bottom, transparent, ${MidnightTheme.backgrounds.void})`,
                    borderTop: `2px solid`,
                    borderImage: `linear-gradient(to right, transparent, ${MidnightTheme.void.primary}, ${MidnightTheme.light.primary}, ${MidnightTheme.void.primary}, transparent) 1`,
                    boxShadow: `inset 0 1px 20px ${MidnightTheme.void.primary}20`
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
                            background: `linear-gradient(to right, transparent, ${MidnightTheme.void.primary}, transparent)`
                        }} />
                        <div className="w-2 h-2 transform rotate-45" style={{
                            background: MidnightTheme.light.primary,
                            boxShadow: `0 0 10px ${MidnightTheme.light.primary}`
                        }} />
                        <div className="w-20 h-px" style={{
                            background: `linear-gradient(to left, transparent, ${MidnightTheme.light.primary}, transparent)`
                        }} />
                    </motion.div>

                    <p className="text-sm mb-2 uppercase tracking-wider font-bold" style={{
                        color: MidnightTheme.text.bright,
                        textShadow: `0 0 15px ${MidnightTheme.void.primary}60`,
                        letterSpacing: '0.2em'
                    }}>
                        Forged in Azeroth • Powered by Magic
                    </p>

                    <div className="text-xs" style={{
                        color: MidnightTheme.text.muted,
                    }}>
                        For the Horde • For the Alliance
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
