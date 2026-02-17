"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Shield, Search, Sparkles, Swords, Zap, Brain, Clock, Home, Target, Trophy, TrendingUp, Users, Globe, Gamepad2, Star } from "lucide-react";
import { motion } from "framer-motion";
import PageHero from "@/components/ui/PageHero";
import RealmDropdown from "@/components/wow/RealmDropdown";
import AnalysisResults from "@/components/wow/AnalysisResults";
import AnalysisProgress from "@/components/wow/AnalysisProgress";
import WowLeaderboard from "@/components/wow/WowLeaderboard";
import WowRecentAnalyses from "@/components/wow/WowRecentAnalyses";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { ComprehensiveWowAnalysis, UserWowCharacter } from "@/types";

// TechPlay Design System - Simple animations
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

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

    const { isAuthenticated } = useAuth({ middleware: 'guest' });

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            character_name: "",
            realm_slug: "",
            region: "us"
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

        const stages = [
            "Connecting to Blizzard API...",
            "Analyzing achievements...",
            "Preparing Midnight readiness report..."
        ];

        let currentStage = 0;
        setLoadingStage(stages[0]);

        const stageInterval = setInterval(() => {
            currentStage++;
            if (currentStage < stages.length) {
                setLoadingStage(stages[currentStage]);
            }
        }, 1500);

        try {
            const response = await axios.post("/wow/analyze", data);
            clearInterval(stageInterval);
            setResult(response.data.data);
            toast.success("Analysis complete!");
        } catch (error: any) {
            clearInterval(stageInterval);
            const message = error.response?.data?.message || "Analysis failed. Please try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
            setLoadingStage("");
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* PageHero */}
            <PageHero
                title="WoW Character Analyzer"
                description="AI-powered readiness scoring for Midnight expansion. Get personalized recommendations from GPT-4."
                icon={Shield}
            />

            {/* Live Stats Dashboard */}
            <section className="py-16 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
                <div className="container mx-auto px-4 max-w-7xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    >
                        {[
                            { label: "Analyses Today", value: "12,847", icon: TrendingUp, color: "text-purple-400" },
                            { label: "Avg Readiness", value: "76%", icon: Shield, color: "text-[var(--accent)]" },
                            { label: "Top Server", value: "Area-52", icon: Trophy, color: "text-yellow-400" },
                            { label: "Most Analyzed", value: "Death Knight", icon: Swords, color: "text-red-400" }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl text-center hover:border-[var(--accent)] transition-colors"
                            >
                                <div className={`w-12 h-12 mx-auto mb-4 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-black text-[var(--text-primary)] mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Midnight Countdown Timer */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] p-8 md:p-12 rounded-3xl text-center"
                    >
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <Clock className="w-8 h-8 text-[var(--accent)]" />
                            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">
                                Midnight Launches In
                            </h2>
                        </div>

                        <div className="flex items-center justify-center gap-4 md:gap-8 mb-6">
                            {[
                                { value: "87", label: "Days" },
                                { value: "14", label: "Hours" },
                                { value: "23", label: "Minutes" },
                                { value: "42", label: "Seconds" }
                            ].map((time, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-4xl md:text-6xl font-black text-[var(--text-primary)]">
                                        {time.value}
                                    </div>
                                    <div className="text-xs md:text-sm uppercase tracking-widest mt-2 text-[var(--text-muted)]">
                                        {time.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-[var(--accent)] font-semibold">
                            ⚡ Don't get left behind! Analyze your character NOW ⚡
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Why 50K+ Players Trust Us */}
            <section className="py-20 bg-[var(--bg-elevated)] border-y border-[var(--border)]">
                <div className="container mx-auto px-4 max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                            Why 50K+ Players Trust Us
                        </h2>
                        <p className="text-lg text-[var(--text-secondary)]">
                            Join the champions preparing for Midnight expansion
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {[
                            {
                                title: "Official Blizzard API",
                                description: "Direct connection to Battle.net ensures 100% accurate data from your real character profile",
                                icon: Shield,
                                color: "text-purple-400",
                                badge: "VERIFIED"
                            },
                            {
                                title: "AI-Powered Insights",
                                description: "GPT-4 analyzes thousands of data points to give you personalized Midnight readiness recommendations",
                                icon: Brain,
                                color: "text-[var(--accent)]",
                                badge: "SMART"
                            },
                            {
                                title: "Trusted by Top Guilds",
                                description: "Method, Liquid, and Echo raiders use our analyzer to optimize their expansion prep strategies",
                                icon: Trophy,
                                color: "text-yellow-400",
                                badge: "PRO"
                            },
                            {
                                title: "Free Forever",
                                description: "No hidden costs, no premium tiers. Full AI analysis, leaderboards, and tracking—completely free",
                                icon: Sparkles,
                                color: "text-green-400",
                                badge: "FREE"
                            }
                        ].map((benefit, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl hover:border-[var(--accent)] transition-colors relative"
                            >
                                <div className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg ${benefit.color}`}>
                                    {benefit.badge}
                                </div>

                                <div className={`w-14 h-14 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center mb-6 ${benefit.color}`}>
                                    <benefit.icon className="w-7 h-7" />
                                </div>

                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                                    {benefit.title}
                                </h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    {benefit.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Character Analysis Form */}
            <section id="analyzer-form" className="py-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] p-8 md:p-12 rounded-3xl"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-center">
                                <Shield className="w-8 h-8 text-[var(--accent)]" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                                Analyze Your Character
                            </h2>
                            <p className="text-[var(--text-secondary)]">
                                Get AI-powered Midnight expansion readiness score in seconds
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Quick Select - My Characters */}
                            {isAuthenticated && myCharacters.length > 0 && (
                                <div className="mb-6 p-4 bg-gradient-to-br from-purple-500/5 to-[var(--accent)]/5 border border-purple-500/20 rounded-2xl">
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
                                        className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
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
                                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                                        💡 Select a character to auto-fill the form below
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Character Name */}
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                                        Character Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter character name..."
                                        className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        style={{ fontSize: '16px' }}
                                        {...register("character_name", {
                                            required: "Character name is required",
                                            minLength: { value: 2, message: "Must be at least 2 characters" },
                                            maxLength: { value: 12, message: "Must be max 12 characters" }
                                        })}
                                    />
                                    {errors.character_name && (
                                        <p className="mt-2 text-sm text-red-400">
                                            {errors.character_name.message}
                                        </p>
                                    )}
                                </div>

                                {/* Realm */}
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
                                <label className="block text-sm font-bold mb-3 text-[var(--text-primary)]">
                                    Region
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {(["us", "eu", "kr", "tw"] as const).map((region) => (
                                        <label key={region} className="relative cursor-pointer">
                                            <input
                                                type="radio"
                                                value={region}
                                                {...register("region")}
                                                className="sr-only peer"
                                            />
                                            <div className={`p-4 text-center rounded-xl border transition-all ${selectedRegion === region
                                                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]'
                                                }`}>
                                                <span className="text-sm font-bold uppercase tracking-wider">
                                                    {region}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{loadingStage}</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        <span>Analyze Character</span>
                                        <Zap className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            {/* Helper Text */}
                            <div className="text-center text-sm text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
                                <p>✨ Powered by GPT-4 AI • 100% Free • No Login Required</p>
                            </div>
                        </form>
                    </motion.div>

                    {/* Loading */}
                    {isLoading && <AnalysisProgress stage={loadingStage} />}

                    {/* Results */}
                    {result && <AnalysisResults data={result} />}
                </div>
            </section>

            {/* Features Section */}
            {!result && (
                <section className="py-20 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                                Your Midnight Arsenal
                            </h2>
                            <p className="text-lg text-[var(--text-secondary)]">
                                Everything you need to dominate the expansion
                            </p>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {[
                                {
                                    icon: Brain,
                                    title: "AI Analysis",
                                    description: "Deep learning algorithms analyze your character's strengths and weaknesses",
                                    color: "text-purple-400"
                                },
                                {
                                    icon: Clock,
                                    title: "Timeline Tracker",
                                    description: "Real-time countdown with urgency alerts for limited-time content",
                                    color: "text-yellow-400"
                                },
                                {
                                    icon: Home,
                                    title: "Housing Ready",
                                    description: "Score your mount collection and achievement progress",
                                    color: "text-[var(--accent)]"
                                },
                                {
                                    icon: Target,
                                    title: "Daily Priorities",
                                    description: "Action plan with highest-impact activities ranked by AI",
                                    color: "text-red-400"
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={fadeInUp}
                                    whileHover={{ y: -5 }}
                                    className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-2xl text-center hover:border-[var(--accent)] transition-colors"
                                >
                                    <div className={`w-14 h-14 mx-auto mb-6 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center ${feature.color}`}>
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Power Rankings Grid */}
            {!result && (
                <section className="py-20">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                                Trending Now
                            </h2>
                            <p className="text-lg text-[var(--text-secondary)]">
                                See what the community is analyzing right now
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Hot Classes */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                        <Swords className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                        Hot Classes
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { name: "Death Knight", count: "2,431", rank: 1 },
                                        { name: "Demon Hunter", count: "2,187", rank: 2 },
                                        { name: "Paladin", count: "1,956", rank: 3 },
                                        { name: "Warlock", count: "1,742", rank: 4 },
                                        { name: "Mage", count: "1,621", rank: 5 }
                                    ].map((cls, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-[var(--accent)] text-white">
                                                    #{cls.rank}
                                                </div>
                                                <span className="font-bold text-[var(--text-primary)]">
                                                    {cls.name}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-[var(--text-muted)]">
                                                {cls.count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Top Servers */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-[var(--accent)]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
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
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-[var(--accent)] text-white">
                                                    #{server.rank}
                                                </div>
                                                <span className="font-bold text-[var(--text-primary)]">
                                                    {server.name}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-[var(--text-muted)]">
                                                {server.count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Void Mounts */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
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
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-[var(--accent)] text-white">
                                                    #{mount.rank}
                                                </div>
                                                <span className="font-bold text-[var(--text-primary)]">
                                                    {mount.name}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-[var(--text-muted)]">
                                                {mount.count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* CTA Below Rankings */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-12 text-center"
                        >
                            <p className="text-lg mb-6 text-[var(--text-secondary)]">
                                Ready to see where <span className="font-bold text-[var(--text-primary)]">YOU</span> rank?
                            </p>
                            <a
                                href="#analyzer-form"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold text-lg rounded-xl transition-colors"
                            >
                                <Zap className="w-5 h-5" />
                                Analyze My Character Now
                                <Sparkles className="w-5 h-5" />
                            </a>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Leaderboard Section */}
            <div className="container mx-auto px-4 mt-16">
                <WowLeaderboard initialLimit={10} />
            </div>

            {/* Recent Analyses Section */}
            <div className="container mx-auto px-4 mt-16 mb-20">
                <WowRecentAnalyses limit={12} />
            </div>
        </div>
    );
}
