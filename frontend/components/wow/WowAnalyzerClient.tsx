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
        <div className="min-h-screen" style={{
            background: 'linear-gradient(to bottom, #0a0604 0%, #1a1208 50%, #0a0604 100%)'
        }}>
            {/* WoW-Style Hero Header */}
            <div className="relative border-b-4 border-[#8B7355] overflow-hidden"
                style={{
                    background: 'linear-gradient(to bottom, #2a1f15 0%, #1a1208 100%)',
                    boxShadow: 'inset 0 -20px 40px rgba(0,0,0,0.5)'
                }}>

                {/* Decorative Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-600 to-transparent opacity-50" />

                {/* Void Energy Background */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative container mx-auto px-4 py-12 max-w-4xl text-center">
                    {/* Ornamental Shield */}
                    <div className="relative inline-block mb-4">
                        <Shield
                            className="w-20 h-20 text-yellow-500 mx-auto"
                            style={{
                                filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.6))',
                            }}
                        />
                        <Swords className="w-8 h-8 text-[var(--accent)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-3"
                        style={{
                            color: '#FFD700',
                            textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: 'serif'
                        }}>
                        WoW Character Analyzer
                    </h1>

                    <div className="text-xl mb-2" style={{ color: '#C0A080' }}>
                        Discover your readiness for <span className="text-purple-400 font-bold">The War Within: Midnight</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#8B7355' }}>
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <span>Powered by Profesor Buffy's AI Magic</span>
                    </div>
                </div>

                {/* Bottom Decorative Border */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8B7355] to-transparent" />
            </div>

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* WoW Parchment-Style Form */}
                <div
                    className="relative rounded-lg border-4 p-8 mb-8 overflow-hidden"
                    style={{
                        background: 'linear-gradient(to bottom, #2a1f15 0%, #1a1208 100%)',
                        borderColor: '#8B7355',
                        boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 30px rgba(139,115,85,0.1)'
                    }}
                >
                    {/* Corner Ornaments */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-yellow-600/50" />
                    <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-yellow-600/50" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-yellow-600/50" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-yellow-600/50" />

                    {/* Inner Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/5 via-transparent to-purple-900/5 pointer-events-none" />

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
                                    className="w-full px-4 py-3 rounded-lg border-2 transition-all"
                                    style={{
                                        background: 'linear-gradient(to bottom, #1a1208, #0f0804)',
                                        borderColor: errors.character_name ? '#DC2626' : '#8B7355',
                                        color: '#FBBF24',
                                        boxShadow: errors.character_name
                                            ? '0 0 10px rgba(220,38,38,0.3)'
                                            : '0 0 15px rgba(139,115,85,0.2)',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'}
                                    onBlur={(e) => e.target.style.borderColor = errors.character_name ? '#DC2626' : '#8B7355'}
                                    {...register("character_name", {
                                        required: "Character name is required",
                                        minLength: { value: 2, message: "Must be at least 2 characters" },
                                        maxLength: { value: 12, message: "Must be max 12 characters" },
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

                        {/* WoW Epic Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-lg border-4 font-bold text-lg transition-all relative overflow-hidden group"
                            style={{
                                background: isLoading
                                    ? 'linear-gradient(to bottom, #4a3820, #3a2810)'
                                    : 'linear-gradient(to bottom, #8B6914, #6B5914)',
                                borderColor: '#D4AF37',
                                color: '#FFF',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                boxShadow: '0 0 30px rgba(212,175,55,0.3), inset 0 2px 0 rgba(255,255,255,0.2)',
                            }}
                        >
                            {/* Button Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            <div className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-yellow-200 border-t-transparent rounded-full animate-spin" />
                                        <span>{loadingStage}</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-6 h-6" />
                                        <span>Analyze Character</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                </div>

                {/* Loading */}
                {isLoading && <AnalysisProgress stage={loadingStage} />}

                {/* Results */}
                {result && <AnalysisResults data={result} />}
            </div>

            {/* Footer Ornament */}
            <div className="border-t-4 border-[#8B7355] py-8" style={{
                background: 'linear-gradient(to bottom, #1a1208, #0a0604)'
            }}>
                <div className="container mx-auto px-4 text-center" style={{ color: '#8B7355' }}>
                    <p className="text-sm">Forged in the fires of Azeroth • Powered by AI Magic</p>
                </div>
            </div>
        </div>
    );
}
