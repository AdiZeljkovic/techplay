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
        <div className="min-h-screen relative" style={{
            background: '#1a1208',
            backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)
            `
        }}>
            {/* Stone Texture Overlay */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(139,115,85,0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 50%, rgba(107,83,69,0.1) 0%, transparent 50%)
                `
            }} />

            {/* Classic WoW Stone Header */}
            <div className="relative overflow-hidden" style={{
                background: 'linear-gradient(to bottom, #2d2416 0%, #1a1208 100%)',
                borderBottom: '10px solid',
                borderImage: 'linear-gradient(to right, #1a1208, #5D4037, #8B6914, #5D4037, #1a1208) 1',
                boxShadow: `
                    inset 0 -8px 16px rgba(0,0,0,0.8),
                    inset 0 2px 2px rgba(139,115,85,0.3),
                    0 8px 24px rgba(0,0,0,0.9)
                `
            }}>
                {/* Stone Texture */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)'
                }} />

                <div className="relative container mx-auto px-4 py-12 max-w-4xl text-center">
                    {/* Stone Emblem */}
                    <div className="relative inline-block mb-6">
                        <div className="relative p-4 rounded-sm" style={{
                            background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
                            border: '6px solid',
                            borderColor: '#8B7355 #6B5345 #4a3820 #8B7355',
                            boxShadow: `
                                inset 2px 2px 4px rgba(139,115,85,0.4),
                                inset -2px -2px 4px rgba(0,0,0,0.8),
                                0 4px 12px rgba(0,0,0,0.8)
                            `
                        }}>
                            <Shield className="w-20 h-20 text-yellow-600" style={{
                                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                            }} />
                            <Swords className="w-8 h-8 text-yellow-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {/* WoW Classic Title */}
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 uppercase"
                        style={{
                            color: '#FFC107',
                            textShadow: `
                                3px 3px 0 #5D4037,
                                4px 4px 0 #3E2723,
                                6px 6px 12px rgba(0,0,0,0.9)
                            `,
                            fontFamily: 'serif',
                            letterSpacing: '0.1em',
                            fontWeight: 900
                        }}>
                        Character Analyzer
                    </h1>

                    {/* Classic Separator */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-700 to-yellow-700" />
                        <div className="w-1.5 h-1.5 bg-yellow-700 transform rotate-45" />
                        <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-yellow-700 to-yellow-700" />
                    </div>

                    {/* Quest Text */}
                    <div className="text-xl mb-2 font-serif" style={{
                        color: '#C9B388',
                        textShadow: '2px 2px 3px rgba(0,0,0,0.9)'
                    }}>
                        Prepare for <span className="text-purple-400 font-bold">The War Within: Midnight</span>
                    </div>

                    {/* Powered By */}
                    <div className="inline-block px-4 py-1.5 mt-3" style={{
                        background: 'linear-gradient(to bottom, #3E2723, #2d1f18)',
                        border: '3px solid #5D4037',
                        boxShadow: 'inset 1px 1px 2px rgba(139,115,85,0.3), inset -1px -1px 2px rgba(0,0,0,0.8)'
                    }}>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#C9B388' }}>
                                Powered by AI Magic
                            </span>
                            <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                        </div>
                    </div>
                </div>

                {/* Bottom Stone Edge */}
                <div className="absolute bottom-0 left-0 right-0 h-3" style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))'
                }} />
            </div>

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* WoW Classic Quest Window */}
                <div className="relative mb-8" style={{
                    background: 'linear-gradient(to bottom, #D4C5A9 0%, #C9B388 50%, #B8A589 100%)',
                    border: '10px solid',
                    borderColor: '#5D4037 #3E2723 #2d1f18 #5D4037',
                    boxShadow: `
                        inset 3px 3px 6px rgba(255,255,255,0.3),
                        inset -3px -3px 6px rgba(0,0,0,0.6),
                        0 10px 30px rgba(0,0,0,0.9),
                        0 0 0 2px #8B7355
                    `,
                    padding: '12px'
                }}>
                    {/* Inner Parchment */}
                    <div className="relative" style={{
                        background: 'linear-gradient(to bottom, #F4ECD8 0%, #E8DCC4 100%)',
                        border: '2px solid #B8A589',
                        boxShadow: 'inset 0 0 20px rgba(139,115,85,0.2)',
                        padding: '32px'
                    }}>
                        {/* Parchment Texture + Aging Effects */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                            backgroundImage: `
                                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(107,83,69,0.1) 2px, rgba(107,83,69,0.1) 4px),
                                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(107,83,69,0.1) 2px, rgba(107,83,69,0.1) 4px)
                            `
                        }} />

                        {/* Age Stains */}
                        <div className="absolute top-10 right-12 w-20 h-20 rounded-full opacity-5 pointer-events-none" style={{
                            background: 'radial-gradient(circle, #8B7355 0%, transparent 70%)'
                        }} />
                        <div className="absolute bottom-16 left-8 w-16 h-16 rounded-full opacity-5 pointer-events-none" style={{
                            background: 'radial-gradient(circle, #6B5345 0%, transparent 70%)'
                        }} />

                        {/* Torn Edges Effect */}
                        <div className="absolute top-0 left-0 right-0 h-2 opacity-20 pointer-events-none" style={{
                            background: 'linear-gradient(to right, transparent 0%, #8B7355 2%, transparent 4%, #6B5345 6%, transparent 8%, #8B7355 10%, transparent 100%)'
                        }} />
                        <div className="absolute bottom-0 left-0 right-0 h-2 opacity-20 pointer-events-none" style={{
                            background: 'linear-gradient(to right, transparent 0%, #6B5345 3%, transparent 5%, #8B7355 9%, transparent 11%, #6B5345 14%, transparent 100%)'
                        }} />

                        {/* Paper Creases / Fold Lines */}
                        <div className="absolute top-1/3 left-0 right-0 h-px opacity-5 pointer-events-none" style={{
                            background: 'linear-gradient(to right, transparent, #5D4037, transparent)',
                            transform: 'rotate(0.5deg)'
                        }} />
                        <div className="absolute top-2/3 left-0 right-0 h-px opacity-5 pointer-events-none" style={{
                            background: 'linear-gradient(to right, transparent, #5D4037, transparent)',
                            transform: 'rotate(-0.3deg)'
                        }} />

                        {/* Metal Corner Rivets */}
                        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-900 shadow-lg" style={{
                            boxShadow: 'inset 1px 1px 2px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)'
                        }} />
                        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-900 shadow-lg" style={{
                            boxShadow: 'inset 1px 1px 2px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)'
                        }} />
                        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-900 shadow-lg" style={{
                            boxShadow: 'inset 1px 1px 2px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)'
                        }} />
                        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-900 shadow-lg" style={{
                            boxShadow: 'inset 1px 1px 2px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)'
                        }} />

                        {/* Wax Seal / Quest Emblem */}
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                                    background: 'radial-gradient(circle, #8B0000 0%, #5D0000 100%)',
                                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.5)',
                                    border: '3px solid #6B0000'
                                }}>
                                    <Shield className="w-8 h-8 text-yellow-600" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800" style={{
                                    boxShadow: 'inset 1px 1px 2px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.6)'
                                }} />
                            </div>
                        </div>

                        {/* Quest Title */}
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold uppercase mb-2" style={{
                                color: '#3E2723',
                                textShadow: '2px 2px 0 rgba(255,255,255,0.6)',
                                fontFamily: 'serif',
                                letterSpacing: '0.15em'
                            }}>
                                Character Analysis
                            </h2>
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <div className="w-20 h-px bg-yellow-800" />
                                <div className="w-1.5 h-1.5 bg-yellow-800 transform rotate-45" />
                                <div className="w-20 h-px bg-yellow-800" />
                            </div>
                        </div>

                        {/* Quest Description (Flavor Text) */}
                        <div className="mb-6 text-center px-8">
                            <p className="text-base leading-relaxed italic mb-3" style={{
                                color: '#5D4037',
                                fontFamily: 'serif',
                                textShadow: '1px 1px 0 rgba(255,255,255,0.3)'
                            }}>
                                Greetings, hero! The shadows of <span className="font-bold not-italic text-purple-700">Midnight</span> loom
                                over Quel'Thalas. I need your assistance in analyzing a champion's readiness for the trials ahead.
                            </p>
                            <p className="text-sm" style={{
                                color: '#8B7355',
                                fontFamily: 'serif'
                            }}>
                                Provide the details below, and I shall divine their fate through ancient magic...
                            </p>
                        </div>

                        {/* Quest Objectives Header */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-6 bg-yellow-800" />
                                <h3 className="text-lg font-bold uppercase" style={{
                                    color: '#3E2723',
                                    fontFamily: 'serif',
                                    letterSpacing: '0.1em',
                                    textShadow: '1px 1px 0 rgba(255,255,255,0.5)'
                                }}>
                                    Quest Objectives
                                </h3>
                            </div>
                        </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Character Name Input */}
                            <div>
                                <label className="block text-sm font-bold mb-2 tracking-wide flex items-start gap-2" style={{
                                    color: '#3E2723',
                                    textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
                                    fontFamily: 'serif'
                                }}>
                                    <div className="flex-shrink-0 w-5 h-5 rounded-sm mt-0.5 flex items-center justify-center" style={{
                                        background: 'linear-gradient(135deg, #C9B388 0%, #B8A589 100%)',
                                        border: '2px solid #8B7355',
                                        boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.3)'
                                    }}>
                                        <Swords className="w-3 h-3 text-yellow-800" />
                                    </div>
                                    <span className="flex-1">Provide Character Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter character name..."
                                    className="w-full px-4 py-3 transition-all focus:outline-none"
                                    style={{
                                        background: errors.character_name
                                            ? 'linear-gradient(to bottom, #FFF 0%, #FFE8E8 100%)'
                                            : 'linear-gradient(to bottom, #FFF 0%, #F5F5F0 100%)',
                                        border: '3px solid',
                                        borderColor: errors.character_name ? '#8B0000' : '#8B7355',
                                        color: '#3E2723',
                                        boxShadow: errors.character_name
                                            ? 'inset 1px 1px 3px rgba(139,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)'
                                            : 'inset 1px 1px 3px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.3)',
                                        fontFamily: 'serif',
                                        fontSize: '16px'
                                    }}
                                    {...register("character_name", {
                                        required: "Character name is required",
                                        minLength: { value: 2, message: "Must be at least 2 characters" },
                                        maxLength: { value: 12, message: "Must be max 12 characters" }
                                    })}
                                />
                                {errors.character_name && (
                                    <p className="mt-1.5 text-sm font-semibold flex items-center gap-1" style={{
                                        color: '#8B0000',
                                        textShadow: '1px 1px 0 rgba(255,255,255,0.5)'
                                    }}>
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

                        {/* Region Selection */}
                        <div>
                            <label className="block text-sm font-bold mb-3 tracking-wide flex items-start gap-2" style={{
                                color: '#3E2723',
                                textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
                                fontFamily: 'serif'
                            }}>
                                <div className="flex-shrink-0 w-5 h-5 rounded-sm mt-0.5 flex items-center justify-center" style={{
                                    background: 'linear-gradient(135deg, #C9B388 0%, #B8A589 100%)',
                                    border: '2px solid #8B7355',
                                    boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.3)'
                                }}>
                                    <Shield className="w-3 h-3 text-yellow-800" />
                                </div>
                                <span className="flex-1">Select Character Region</span>
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
                                        <div
                                            className="p-3 text-center transition-all"
                                            style={{
                                                background: selectedRegion === region
                                                    ? 'linear-gradient(to bottom, #8B6914 0%, #6B5914 100%)'
                                                    : 'linear-gradient(to bottom, #C9B388 0%, #B8A589 100%)',
                                                border: '4px solid',
                                                borderColor: selectedRegion === region
                                                    ? '#C9B388 #5D4037 #3E2723 #8B7355'
                                                    : '#8B7355 #5D4037 #3E2723 #8B7355',
                                                boxShadow: selectedRegion === region
                                                    ? 'inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.6)'
                                                    : 'inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)',
                                            }}
                                        >
                                            <span
                                                className="text-sm font-bold uppercase tracking-wider"
                                                style={{
                                                    color: selectedRegion === region ? '#FFF' : '#5D4037',
                                                    textShadow: selectedRegion === region
                                                        ? '1px 1px 2px rgba(0,0,0,0.8)'
                                                        : '1px 1px 0 rgba(255,255,255,0.5)',
                                                    fontFamily: 'serif'
                                                }}
                                            >
                                                {region}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Classic WoW Stone Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative w-full py-4 font-bold text-lg uppercase tracking-wider disabled:cursor-not-allowed transition-all"
                            style={{
                                background: isLoading
                                    ? 'linear-gradient(to bottom, #5D4037 0%, #3E2723 100%)'
                                    : 'linear-gradient(to bottom, #8B6914 0%, #6B5914 50%, #5D4037 100%)',
                                border: '6px solid',
                                borderColor: isLoading
                                    ? '#3E2723 #2d1f18 #1a1208 #5D4037'
                                    : '#C9B388 #8B7355 #5D4037 #C9B388',
                                color: isLoading ? '#8B7355' : '#FFF',
                                textShadow: isLoading
                                    ? '1px 1px 2px rgba(0,0,0,0.8)'
                                    : '2px 2px 0 #3E2723, 3px 3px 6px rgba(0,0,0,0.9)',
                                boxShadow: isLoading
                                    ? 'inset 2px 2px 4px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.6)'
                                    : `
                                        inset 3px 3px 6px rgba(255,255,255,0.2),
                                        inset -2px -2px 4px rgba(0,0,0,0.5),
                                        0 6px 12px rgba(0,0,0,0.8)
                                    `,
                                fontFamily: 'serif',
                                letterSpacing: '0.15em'
                            }}
                            onMouseDown={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.transform = 'translateY(2px)';
                                    e.currentTarget.style.boxShadow = 'inset 2px 2px 4px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.6)';
                                }
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = `
                                    inset 3px 3px 6px rgba(255,255,255,0.2),
                                    inset -2px -2px 4px rgba(0,0,0,0.5),
                                    0 6px 12px rgba(0,0,0,0.8)
                                `;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = '';
                            }}
                        >
                            <div className="relative flex items-center justify-center gap-3">
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-3 border-yellow-800 border-t-transparent rounded-full animate-spin" />
                                        <span>{loadingStage}</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-6 h-6" />
                                        <span>Accept Quest</span>
                                        <Shield className="w-5 h-5" />
                                    </>
                                )}
                            </div>
                        </button>

                        {/* Quest Completion / Signature */}
                        <div className="mt-8 pt-6 border-t-2 border-yellow-800/30">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                                        background: 'linear-gradient(135deg, #6B5914 0%, #5D4037 100%)',
                                        border: '3px solid #8B7355',
                                        boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)'
                                    }}>
                                        <Sparkles className="w-6 h-6 text-yellow-400" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm italic mb-2" style={{
                                        color: '#5D4037',
                                        fontFamily: 'serif',
                                        lineHeight: '1.6'
                                    }}>
                                        May the Light guide your path through the darkness, champion. The secrets of Midnight await those brave enough to seek them.
                                    </p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="h-px flex-1 bg-gradient-to-r from-yellow-800/50 to-transparent" />
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{
                                            color: '#8B7355',
                                            fontFamily: 'serif'
                                        }}>
                                            — Profesor Buffy
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quest Rewards Preview */}
                            <div className="mt-4 p-3 rounded" style={{
                                background: 'linear-gradient(to right, rgba(139,105,20,0.1), rgba(107,83,69,0.1))',
                                border: '1px solid rgba(139,115,85,0.3)'
                            }}>
                                <div className="flex items-center gap-2 text-xs" style={{ color: '#8B7355' }}>
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="font-semibold">Quest Rewards:</span>
                                    <span>AI-Powered Analysis • Midnight Readiness Score • Strategic Recommendations</span>
                                </div>
                            </div>
                        </div>
                    </form>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && <AnalysisProgress stage={loadingStage} />}

                {/* Results */}
                {result && <AnalysisResults data={result} />}
            </div>

            {/* Classic Stone Footer */}
            <div className="relative mt-12" style={{
                background: 'linear-gradient(to bottom, #2d2416 0%, #1a1208 100%)',
                borderTop: '8px solid',
                borderColor: '#5D4037',
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.6)'
            }}>
                <div className="container mx-auto px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-16 h-0.5 bg-yellow-800" />
                        <div className="w-1 h-1 bg-yellow-800 transform rotate-45" />
                        <div className="w-16 h-0.5 bg-yellow-800" />
                    </div>

                    <p className="text-sm font-serif mb-1 uppercase tracking-wider" style={{
                        color: '#8B7355',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
                        letterSpacing: '0.1em'
                    }}>
                        Forged in Azeroth • Powered by Magic
                    </p>

                    <div className="text-xs" style={{ color: '#6B5345' }}>
                        For the Horde • For the Alliance
                    </div>
                </div>
            </div>
        </div>
    );
}
