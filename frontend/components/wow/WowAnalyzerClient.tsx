"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    Shield, Sparkles, Zap, TrendingUp, Trophy, Clock,
    ArrowRight, CheckCircle2, Star, Users, Globe,
    Swords, Target, Brain, Rocket, ChevronDown, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RealmDropdown from "@/components/wow/RealmDropdown";
import AnalysisResults from "@/components/wow/AnalysisResults";
import AnalysisProgress from "@/components/wow/AnalysisProgress";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { ComprehensiveWowAnalysis, UserWowCharacter } from "@/types";

interface FormData {
    character_name: string;
    realm_slug: string;
    region: "us" | "eu" | "kr" | "tw";
}

export default function WowAnalyzerClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<string>("");
    const [result, setResult] = useState<(ComprehensiveWowAnalysis & { id?: number }) | null>(null);
    const [myCharacters, setMyCharacters] = useState<UserWowCharacter[]>([]);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    const { isAuthenticated } = useAuth({ middleware: 'guest' });

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            character_name: "",
            realm_slug: "",
            region: "eu"
        }
    });

    const selectedRegion = watch("region");

    // Fetch user's WoW characters if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            axios.get('/user/wow-characters')
                .then((res) => {
                    setMyCharacters(res.data.data || []);
                })
                .catch((err) => {
                    console.error('Failed to fetch characters', err);
                });
        }
    }, [isAuthenticated]);

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setResult(null);

        // Scroll to loading section
        setTimeout(() => {
            document.getElementById('analysis-results')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);

        const stages = [
            "Connecting to Blizzard API...",
            "Fetching character data...",
            "Analyzing achievements & progress...",
            "Calculating Midnight readiness...",
            "Generating recommendations..."
        ];

        let currentStage = 0;
        setLoadingStage(stages[0]);

        const stageInterval = setInterval(() => {
            currentStage++;
            if (currentStage < stages.length) {
                setLoadingStage(stages[currentStage]);
            }
        }, 1200);

        try {
            const response = await axios.post("/wow/analyze", data);
            clearInterval(stageInterval);
            setResult(response.data.data);
            toast.success("Analysis complete! 🎉");
        } catch (error: any) {
            clearInterval(stageInterval);
            const message = error.response?.data?.message || "Analysis failed. Please try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
            setLoadingStage("");
        }
    };

    const getClassColor = (className: string | null): string => {
        const colors: Record<string, string> = {
            'Death Knight': '#C41F3B', 'Demon Hunter': '#A330C9', 'Druid': '#FF7D0A',
            'Evoker': '#33937F', 'Hunter': '#ABD473', 'Mage': '#69CCF0',
            'Monk': '#00FF96', 'Paladin': '#F58CBA', 'Priest': '#FFFFFF',
            'Rogue': '#FFF569', 'Shaman': '#0070DE', 'Warlock': '#9482C9', 'Warrior': '#C79C6E'
        };
        return colors[className || ''] || 'var(--text-primary)';
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* HERO SECTION - Immediate Impact */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden border-b border-[var(--border)]">
                {/* Background Wallpaper */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('/WoW_Midnight_DarknessDevours_Wallpaper_1920x1080-579529d5e24ee9365714.jpg')`
                    }}
                />

                {/* Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/60" />

                {/* Accent Glow Effects */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--accent)] rounded-full blur-[150px] opacity-[0.15]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[150px] opacity-[0.12]" />

                <div className="relative container mx-auto px-4 py-20 md:py-32 max-w-5xl">
                    <div className="text-center">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-md border border-[var(--accent)]/30 rounded-full mb-8"
                        >
                            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                            <span className="text-sm font-bold text-[var(--accent)]">
                                Instant Analysis • Free Forever
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.05]"
                        >
                            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">Ready for</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] via-purple-400 to-purple-500 drop-shadow-[0_4px_30px_rgba(252,65,0,0.6)]">
                                Midnight expansion?
                            </span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] max-w-3xl mx-auto"
                        >
                            Get your instant readiness score and personalized roadmap for <strong className="text-white font-bold">World of Warcraft: Midnight</strong> expansion.
                        </motion.p>

                        {/* Trust Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-wrap items-center justify-center gap-8 mb-12"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-black/50 bg-gradient-to-br from-purple-400 to-[var(--accent)] flex items-center justify-center text-sm font-bold text-white shadow-xl">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-base text-gray-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                                    <strong className="text-white font-bold">50K+</strong> players analyzed
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" />
                                    ))}
                                </div>
                                <span className="text-base text-gray-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                                    4.9/5 rating
                                </span>
                            </div>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            onClick={() => document.getElementById('analyzer-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[var(--accent)] to-orange-600 hover:from-[var(--accent)]/90 hover:to-orange-600/90 text-white rounded-2xl font-bold text-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[var(--accent)]/30 mb-6"
                        >
                            <Rocket className="w-6 h-6" />
                            Analyze My Character
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        {/* Small Trust Line */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-sm text-gray-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
                        >
                            ⚡ Takes 5 seconds • No account required • 100% free
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ANALYZER FORM - The Main Event */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="analyzer-form" className="py-20 scroll-mt-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        {/* Form Header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full mb-6">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-semibold text-[var(--text-secondary)]">
                                    Ready to analyze • Powered by Blizzard API
                                </span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4">
                                Enter Your Character
                            </h2>
                            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                                We'll fetch your data from Blizzard and give you a comprehensive readiness report in seconds
                            </p>
                        </div>

                        {/* Main Form Card */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-12 shadow-xl">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                {/* Quick Select - My Characters */}
                                {isAuthenticated && myCharacters.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="p-6 bg-gradient-to-br from-purple-500/5 to-[var(--accent)]/5 border border-purple-500/20 rounded-2xl"
                                    >
                                        <label className="block text-sm font-bold mb-3 text-purple-400 uppercase flex items-center gap-2">
                                            <Star className="w-4 h-4" />
                                            Quick Select (Your Characters)
                                        </label>
                                        <select
                                            onChange={(e) => {
                                                const charId = parseInt(e.target.value);
                                                const char = myCharacters.find(c => c.id === charId);
                                                if (char) {
                                                    setValue('character_name', char.character_name);
                                                    setValue('realm_slug', char.realm_slug);
                                                    setValue('region', char.region as "us" | "eu" | "kr" | "tw");
                                                    toast.success(`Selected ${char.character_name}`);
                                                }
                                            }}
                                            className="w-full px-4 py-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-purple-400 transition-colors cursor-pointer font-medium"
                                            defaultValue=""
                                        >
                                            <option value="">-- Select a character --</option>
                                            {myCharacters.map((char) => (
                                                <option key={char.id} value={char.id}>
                                                    {char.character_name} - {char.realm_slug} ({char.region.toUpperCase()})
                                                    {char.is_main ? ' ⭐ Main' : ''}
                                                    {char.item_level ? ` - ${char.item_level} iLvL` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-[var(--text-secondary)] mt-3 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" />
                                            Select a character to auto-fill the form
                                        </p>
                                    </motion.div>
                                )}

                                {/* Region Selection - Radio Cards */}
                                <div>
                                    <label className="block text-sm font-bold mb-4 text-[var(--text-primary)] uppercase tracking-wide">
                                        Select Region
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {(["us", "eu", "kr", "tw"] as const).map((region) => (
                                            <label key={region} className="relative cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value={region}
                                                    {...register("region")}
                                                    className="sr-only peer"
                                                />
                                                <div className={`p-4 text-center rounded-xl border-2 transition-all ${
                                                    selectedRegion === region
                                                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-lg shadow-[var(--accent)]/20'
                                                        : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50'
                                                }`}>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Globe className={`w-4 h-4 ${selectedRegion === region ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} />
                                                        <span className={`font-bold uppercase ${
                                                            selectedRegion === region ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                                                        }`}>
                                                            {region}
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Character & Realm - Side by Side */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Character Name */}
                                    <div>
                                        <label className="block text-sm font-bold mb-3 text-[var(--text-primary)] uppercase tracking-wide">
                                            Character Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Garamel"
                                            className="w-full px-5 py-4 bg-[var(--bg-elevated)] border-2 border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium text-lg"
                                            {...register("character_name", {
                                                required: "Character name is required",
                                                minLength: { value: 2, message: "Must be at least 2 characters" },
                                                maxLength: { value: 12, message: "Must be max 12 characters" }
                                            })}
                                        />
                                        {errors.character_name && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-2 text-sm text-red-400 flex items-center gap-2"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.character_name.message}
                                            </motion.p>
                                        )}
                                    </div>

                                    {/* Realm */}
                                    <Controller
                                        name="realm_slug"
                                        control={control}
                                        rules={{ required: "Realm is required" }}
                                        render={({ field }) => (
                                            <div>
                                                <label className="block text-sm font-bold mb-3 text-[var(--text-primary)] uppercase tracking-wide">
                                                    Realm
                                                </label>
                                                <RealmDropdown
                                                    region={selectedRegion}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    error={errors.realm_slug?.message}
                                                />
                                            </div>
                                        )}
                                    />
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative w-full px-8 py-5 bg-gradient-to-r from-[var(--accent)] to-purple-600 hover:from-[var(--accent)]/90 hover:to-purple-600/90 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-[var(--accent)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                                    <span className="relative flex items-center justify-center gap-3">
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Analyzing Character...
                                            </>
                                        ) : (
                                            <>
                                                <Rocket className="w-5 h-5" />
                                                Analyze Character Now
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </motion.button>

                                {/* Trust Line */}
                                <div className="flex items-center justify-center gap-6 pt-4 border-t border-[var(--border)]">
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        Free Forever
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        No Account Required
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        {'< 5 Seconds'}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ANALYSIS RESULTS / LOADING */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div id="analysis-results">
                <AnimatePresence mode="wait">
                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <AnalysisProgress stage={loadingStage} />
                        </motion.div>
                    )}

                    {result && !isLoading && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <AnalysisResults data={result} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* HOW IT WORKS - Visual Process */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {!result && (
                <section className="py-20 bg-[var(--bg-elevated)] border-y border-[var(--border)]">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4">
                                How It Works
                            </h2>
                            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                                Smart analysis powered by real-time Blizzard data
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    step: "01",
                                    icon: Globe,
                                    title: "Fetch Character Data",
                                    description: "We connect to Blizzard API to pull your character's achievements, gear, M+ score, raid progress, and collections"
                                },
                                {
                                    step: "02",
                                    icon: Brain,
                                    title: "Smart Analysis",
                                    description: "Our system analyzes 50+ data points including Midnight-specific achievements, Void Elf unlocks, and housing readiness"
                                },
                                {
                                    step: "03",
                                    icon: Rocket,
                                    title: "Actionable Report",
                                    description: "Get personalized recommendations, daily priorities, and a readiness score from 0-100 to maximize your Midnight launch"
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2 }}
                                    className="relative"
                                >
                                    {/* Connector Line */}
                                    {i < 2 && (
                                        <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-20" />
                                    )}

                                    <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 h-full hover:border-[var(--accent)] transition-colors">
                                        {/* Step Number */}
                                        <div className="absolute -top-4 -left-4 w-12 h-12 bg-[var(--accent)] rounded-2xl flex items-center justify-center shadow-lg">
                                            <span className="text-white font-black">{item.step}</span>
                                        </div>

                                        {/* Icon */}
                                        <div className="w-16 h-16 bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-center mb-6">
                                            <item.icon className="w-8 h-8 text-[var(--accent)]" />
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                                            {item.title}
                                        </h3>
                                        <p className="text-[var(--text-secondary)] leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* FINAL CTA - If no results */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {!result && (
                <section className="py-20 bg-gradient-to-br from-[var(--accent)]/5 to-purple-500/5 border-y border-[var(--accent)]/20">
                    <div className="container mx-auto px-4 max-w-4xl text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <Clock className="w-16 h-16 text-[var(--accent)] mx-auto mb-6" />
                            <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4">
                                Midnight Launches March 2, 2026
                            </h2>
                            <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                                Don't get caught unprepared. Check your character now and get a personalized roadmap to be expansion-ready.
                            </p>
                            <button
                                onClick={() => document.getElementById('analyzer-form')?.scrollIntoView({ behavior: 'smooth' })}
                                className="group inline-flex items-center gap-3 px-10 py-5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-2xl font-bold text-xl transition-all hover:scale-105 shadow-2xl shadow-[var(--accent)]/30"
                            >
                                Analyze My Character
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    </div>
                </section>
            )}
        </div>
    );
}
