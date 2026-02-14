"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Shield, Search, Sparkles, Swords } from "lucide-react";
import RealmDropdown from "@/components/wow/RealmDropdown";
import AnalysisResults from "@/components/wow/AnalysisResults";
import AnalysisProgress from "@/components/wow/AnalysisProgress";
import axios from "@/lib/axios";
import toast from "react-hot-toast";

interface FormData {
    character_name: string;
    realm_slug: string;
    region: "us" | "eu" | "kr" | "tw";
}

interface AnalysisResult {
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
    void_mounts_count: number;
    has_void_elf: boolean;
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
            background: 'radial-gradient(ellipse at top, #1a0f1a 0%, #0a0604 50%, #000000 100%)'
        }}>
            {/* Animated Void Stars Background */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                <div className="absolute top-20 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-40 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-60 right-1/4 w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
                <div className="absolute bottom-40 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />
            </div>

            {/* Epic WoW-Style Hero Header */}
            <div className="relative border-b-4 overflow-hidden"
                style={{
                    background: 'linear-gradient(to bottom, rgba(42,31,21,0.95) 0%, rgba(26,18,8,0.98) 100%)',
                    borderImage: 'linear-gradient(to right, #8B7355, #D4AF37, #8B7355) 1',
                    boxShadow: 'inset 0 -30px 60px rgba(0,0,0,0.7), 0 10px 50px rgba(0,0,0,0.5)'
                }}>

                {/* Top Ornamental Border */}
                <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-60 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 opacity-30" />
                </div>

                {/* Void Energy Swirls */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }} />
                </div>

                <div className="relative container mx-auto px-4 py-16 max-w-5xl text-center">
                    {/* Epic Shield Emblem */}
                    <div className="relative inline-block mb-6">
                        {/* Outer Glow Ring */}
                        <div className="absolute inset-0 -m-8">
                            <div className="w-full h-full rounded-full animate-pulse"
                                style={{
                                    background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
                                    filter: 'blur(20px)'
                                }} />
                        </div>

                        {/* Rotating Background Ring */}
                        <div className="absolute inset-0 -m-6 animate-spin" style={{ animationDuration: '20s' }}>
                            <div className="w-full h-full rounded-full border-2 border-yellow-600/20" />
                        </div>

                        {/* Main Shield */}
                        <Shield
                            className="w-28 h-28 text-yellow-500 mx-auto relative z-10 animate-pulse"
                            style={{
                                filter: 'drop-shadow(0 0 30px rgba(234, 179, 8, 0.8)) drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))',
                                animationDuration: '3s'
                            }}
                        />

                        {/* Crossed Swords Overlay */}
                        <Swords className="w-10 h-10 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                            style={{
                                filter: 'drop-shadow(0 0 10px rgba(251, 146, 60, 0.8))'
                            }} />

                        {/* Sparkles */}
                        <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <Sparkles className="w-5 h-5 text-yellow-300 absolute -bottom-1 -left-2 animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Epic Title */}
                    <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-wide"
                        style={{
                            color: '#FFD700',
                            textShadow: `
                                0 0 40px rgba(255, 215, 0, 0.8),
                                0 0 20px rgba(255, 215, 0, 0.6),
                                3px 3px 0 rgba(139, 115, 85, 0.8),
                                5px 5px 10px rgba(0,0,0,0.9)
                            `,
                            fontFamily: 'serif',
                            letterSpacing: '0.05em'
                        }}>
                        Character Analyzer
                    </h1>

                    {/* Decorative Divider */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="h-px w-24 bg-gradient-to-r from-transparent to-yellow-600" />
                        <div className="w-2 h-2 rotate-45 bg-yellow-500 shadow-lg shadow-yellow-500/50" />
                        <div className="h-px w-24 bg-gradient-to-l from-transparent to-yellow-600" />
                    </div>

                    {/* Subtitle with Midnight Theme */}
                    <div className="text-2xl mb-3 font-serif" style={{ color: '#C0A080' }}>
                        Discover your readiness for{' '}
                        <span className="text-purple-400 font-bold"
                            style={{
                                textShadow: '0 0 15px rgba(168, 85, 247, 0.8), 0 0 5px rgba(168, 85, 247, 0.5)'
                            }}>
                            The War Within: Midnight
                        </span>
                    </div>

                    {/* Lore Flavor Text */}
                    <div className="text-sm italic mb-4" style={{ color: '#8B7355' }}>
                        "The void calls... Are you prepared to face the darkness of Quel'Thalas?"
                    </div>

                    {/* Profesor Buffy Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{
                            background: 'linear-gradient(to right, rgba(139, 115, 85, 0.2), rgba(212, 175, 55, 0.2), rgba(139, 115, 85, 0.2))',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)'
                        }}>
                        <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                        <span className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                            Powered by Profesor Buffy's AI Magic
                        </span>
                        <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>
                </div>

                {/* Bottom Decorative Border */}
                <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-transparent via-[#8B7355] to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#8B7355] via-[#D4AF37] to-[#8B7355] opacity-40" />
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                {/* Epic Quest Parchment Form */}
                <div
                    className="relative rounded-xl p-10 mb-8 overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #2a1f15 0%, #1a1208 50%, #2a1f15 100%)',
                        border: '3px solid transparent',
                        backgroundClip: 'padding-box',
                        boxShadow: `
                            0 0 60px rgba(0,0,0,0.9),
                            inset 0 0 40px rgba(139,115,85,0.15),
                            inset 0 2px 0 rgba(212,175,55,0.1)
                        `
                    }}
                >
                    {/* Outer Border Glow */}
                    <div className="absolute inset-0 rounded-xl -z-10" style={{
                        background: 'linear-gradient(135deg, #8B7355, #D4AF37, #8B7355)',
                        filter: 'blur(1px)'
                    }} />

                    {/* Ornate Corner Decorations */}
                    <div className="absolute top-0 left-0 w-20 h-20">
                        <div className="absolute top-0 left-0 w-full h-full border-l-4 border-t-4 border-yellow-600/60 rounded-tl-lg" />
                        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-500/40" />
                        <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-500/60 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="absolute top-0 right-0 w-20 h-20">
                        <div className="absolute top-0 right-0 w-full h-full border-r-4 border-t-4 border-yellow-600/60 rounded-tr-lg" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-500/40" />
                        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500/60 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                    </div>
                    <div className="absolute bottom-0 left-0 w-20 h-20">
                        <div className="absolute bottom-0 left-0 w-full h-full border-l-4 border-b-4 border-yellow-600/60 rounded-bl-lg" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-500/40" />
                        <div className="absolute bottom-1 left-1 w-2 h-2 bg-yellow-500/60 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '2s' }} />
                    </div>
                    <div className="absolute bottom-0 right-0 w-20 h-20">
                        <div className="absolute bottom-0 right-0 w-full h-full border-r-4 border-b-4 border-yellow-600/60 rounded-br-lg" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-500/40" />
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-500/60 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
                    </div>

                    {/* Inner Ambient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/8 via-transparent via-50% to-purple-900/8 pointer-events-none rounded-xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)] pointer-events-none rounded-xl" />

                    {/* Quest Title Header */}
                    <div className="text-center mb-8 relative">
                        <div className="inline-block">
                            <h2 className="text-2xl font-bold mb-2" style={{
                                color: '#FFD700',
                                textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 2px 2px 4px rgba(0,0,0,0.8)',
                                fontFamily: 'serif'
                            }}>
                                Begin Your Analysis
                            </h2>
                            <div className="h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* WoW-Themed Character Name Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#FFD700' }}>
                                    <Swords className="w-4 h-4 inline mr-1" />
                                    Character Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Thrall"
                                    className="w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none"
                                    style={{
                                        background: 'linear-gradient(to bottom, #1a1208, #0f0804)',
                                        borderColor: errors.character_name ? '#DC2626' : '#8B7355',
                                        color: '#FBBF24',
                                        boxShadow: errors.character_name
                                            ? '0 0 10px rgba(220,38,38,0.3)'
                                            : '0 0 15px rgba(139,115,85,0.2)',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#D4AF37';
                                        e.target.style.boxShadow = '0 0 20px rgba(212,175,55,0.4)';
                                    }}
                                    {...register("character_name", {
                                        required: "Character name is required",
                                        minLength: { value: 2, message: "Must be at least 2 characters" },
                                        maxLength: { value: 12, message: "Must be max 12 characters" },
                                        onBlur: (e) => {
                                            e.target.style.borderColor = errors.character_name ? '#DC2626' : '#8B7355';
                                            e.target.style.boxShadow = errors.character_name
                                                ? '0 0 10px rgba(220,38,38,0.3)'
                                                : '0 0 15px rgba(139,115,85,0.2)';
                                        }
                                    })}
                                />
                                {errors.character_name && (
                                    <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                                        <span>✖</span> {errors.character_name.message}
                                    </p>
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

                        {/* WoW-Themed Region Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-3" style={{ color: '#FFD700' }}>
                                <Shield className="w-4 h-4 inline mr-1" />
                                Region
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {(["us", "eu", "kr", "tw"] as const).map((region) => (
                                    <label
                                        key={region}
                                        className="relative cursor-pointer group"
                                    >
                                        <input
                                            type="radio"
                                            value={region}
                                            {...register("region")}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className="p-3 rounded-lg border-2 text-center transition-all peer-checked:scale-105"
                                            style={{
                                                background: selectedRegion === region
                                                    ? 'linear-gradient(to bottom, #3a2820, #2a1810)'
                                                    : 'linear-gradient(to bottom, #1a1208, #0f0804)',
                                                borderColor: selectedRegion === region ? '#D4AF37' : '#8B7355',
                                                boxShadow: selectedRegion === region
                                                    ? '0 0 20px rgba(212,175,55,0.4), inset 0 0 15px rgba(212,175,55,0.1)'
                                                    : '0 0 10px rgba(139,115,85,0.2)',
                                            }}
                                        >
                                            <span
                                                className="text-sm font-bold uppercase"
                                                style={{
                                                    color: selectedRegion === region ? '#FFD700' : '#8B7355'
                                                }}
                                            >
                                                {region}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Legendary Epic Button */}
                        <div className="relative">
                            {/* Button Outer Glow */}
                            <div className="absolute inset-0 rounded-xl animate-pulse" style={{
                                background: 'radial-gradient(ellipse, rgba(255, 128, 0, 0.3) 0%, transparent 70%)',
                                filter: 'blur(20px)',
                                animationDuration: '2s'
                            }} />

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full py-5 rounded-xl font-bold text-xl transition-all overflow-hidden group disabled:cursor-not-allowed"
                                style={{
                                    background: isLoading
                                        ? 'linear-gradient(135deg, #4a3820 0%, #3a2810 100%)'
                                        : 'linear-gradient(135deg, #8B6914 0%, #D4AF37 50%, #8B6914 100%)',
                                    border: '3px solid',
                                    borderImage: isLoading
                                        ? 'linear-gradient(135deg, #6B5345, #4a3820) 1'
                                        : 'linear-gradient(135deg, #D4AF37, #FFD700, #D4AF37) 1',
                                    color: '#FFF',
                                    textShadow: '0 0 10px rgba(0,0,0,0.8), 3px 3px 6px rgba(0,0,0,0.9)',
                                    boxShadow: isLoading
                                        ? '0 0 20px rgba(139,115,85,0.2), inset 0 2px 0 rgba(255,255,255,0.1)'
                                        : '0 0 40px rgba(255, 128, 0, 0.4), 0 0 20px rgba(212,175,55,0.5), inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.3)',
                                }}
                            >
                                {/* Animated Border Shine */}
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                                        backgroundSize: '200% 200%',
                                        animation: 'shimmer 2s infinite'
                                    }} />

                                {/* Button Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                {/* Epic Particles on Hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="absolute top-2 left-4 w-4 h-4 text-yellow-300 animate-pulse" />
                                    <Sparkles className="absolute top-3 right-6 w-3 h-3 text-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                    <Sparkles className="absolute bottom-2 left-1/4 w-3 h-3 text-orange-300 animate-pulse" style={{ animationDelay: '1s' }} />
                                    <Sparkles className="absolute bottom-3 right-1/3 w-4 h-4 text-yellow-300 animate-pulse" style={{ animationDelay: '1.5s' }} />
                                </div>

                                <div className="relative flex items-center justify-center gap-3">
                                    {isLoading ? (
                                        <>
                                            <div className="w-6 h-6 border-3 border-yellow-200 border-t-transparent rounded-full animate-spin" />
                                            <span className="tracking-wide">{loadingStage}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-7 h-7" style={{
                                                filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))'
                                            }} />
                                            <span className="tracking-wide" style={{
                                                fontFamily: 'serif',
                                                letterSpacing: '0.05em'
                                            }}>
                                                Begin Analysis
                                            </span>
                                            <Shield className="w-6 h-6" style={{
                                                filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))'
                                            }} />
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>

                        <style jsx>{`
                            @keyframes shimmer {
                                0%, 100% { background-position: 0% 0%; }
                                50% { background-position: 100% 100%; }
                            }
                        `}</style>
                    </form>
                </div>

                {/* Loading */}
                {isLoading && <AnalysisProgress stage={loadingStage} />}

                {/* Results */}
                {result && <AnalysisResults data={result} />}
            </div>

            {/* Epic Footer Ornament */}
            <div className="relative mt-16 overflow-hidden" style={{
                background: 'linear-gradient(to bottom, rgba(26,18,8,0.8) 0%, rgba(10,6,4,0.95) 100%)',
                borderTop: '3px solid',
                borderImage: 'linear-gradient(to right, #8B7355, #D4AF37, #8B7355) 1'
            }}>
                {/* Top Decorative Line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent opacity-60" />

                <div className="container mx-auto px-4 py-10 text-center relative">
                    {/* Decorative Ornament */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="h-px w-32 bg-gradient-to-r from-transparent to-yellow-700/50" />
                        <div className="relative">
                            <div className="w-3 h-3 rotate-45 bg-yellow-600/60 shadow-lg shadow-yellow-600/30" />
                            <div className="absolute inset-0 w-3 h-3 rotate-45 bg-yellow-500/30 blur-sm" />
                        </div>
                        <div className="h-px w-32 bg-gradient-to-l from-transparent to-yellow-700/50" />
                    </div>

                    <p className="text-sm font-serif mb-2" style={{
                        color: '#8B7355',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    }}>
                        Forged in the fires of Azeroth • Powered by AI Magic
                    </p>

                    <div className="flex items-center justify-center gap-2 text-xs" style={{ color: '#6B5345' }}>
                        <span>Blessed by the Light</span>
                        <span>•</span>
                        <span>Empowered by the Void</span>
                    </div>
                </div>

                {/* Bottom Glow */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
