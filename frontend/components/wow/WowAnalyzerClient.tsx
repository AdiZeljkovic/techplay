"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
            // Simulate progress stages
            setTimeout(() => setLoadingStage("Profesor Buffy analizira achievemente..."), 1000);
            setTimeout(() => setLoadingStage("Profesor Buffy priprema savete za Midnight..."), 2500);

            const response = await axios.post("/wow/analyze", {
                character_name: data.character_name.trim(),
                realm_slug: data.realm_slug, // Already in slug format from dropdown
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
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Page Hero */}
            <div className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border-b border-[var(--border)]">
                <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
                    <Shield className="w-16 h-16 text-[var(--accent)] mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                        WoW Character Analyzer
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        Discover your readiness for The War Within: Midnight expansion
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Form Card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 mb-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Character Name"
                                placeholder="e.g., Thrall"
                                error={errors.character_name?.message}
                                {...register("character_name", {
                                    required: "Character name is required",
                                    minLength: { value: 2, message: "Must be at least 2 characters" },
                                    maxLength: { value: 12, message: "Must be max 12 characters" },
                                })}
                            />

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

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                                Region
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {(["us", "eu", "kr", "tw"] as const).map((region) => (
                                    <label
                                        key={region}
                                        className="relative flex items-center justify-center p-3 bg-[var(--bg-elevated)] border-2 border-[var(--border)] rounded-lg cursor-pointer hover:border-[var(--accent)] transition-all"
                                    >
                                        <input
                                            type="radio"
                                            value={region}
                                            {...register("region")}
                                            className="sr-only peer"
                                        />
                                        <span className="text-sm font-semibold text-[var(--text-secondary)] peer-checked:text-[var(--accent)] uppercase">
                                            {region}
                                        </span>
                                        <div className="absolute inset-0 border-2 border-[var(--accent)] rounded-lg opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="w-full"
                            size="lg"
                        >
                            {isLoading ? loadingStage : (
                                <>
                                    <Search className="w-5 h-5" />
                                    Analyze Character
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Loading Progress */}
                {isLoading && <AnalysisProgress stage={loadingStage} />}

                {/* Results */}
                {result && <AnalysisResults data={result} />}
            </div>
        </div>
    );
}
