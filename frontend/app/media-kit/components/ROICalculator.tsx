"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Calculator, TrendingUp, DollarSign, Eye, Users, Target, ArrowRight, Sparkles } from "lucide-react";

// Real pricing and realistic CTR for global gaming tech portal
const adFormats = [
    { id: "leaderboard", name: "Desktop Leaderboard", cpm: 1.00, avgCTR: 2.8 },
    { id: "billboard", name: "Desktop Billboard", cpm: 1.50, avgCTR: 3.2 },
    { id: "rectangle", name: "Medium Rectangle", cpm: 1.20, avgCTR: 2.5 },
    { id: "halfpage", name: "Half Page", cpm: 2.00, avgCTR: 3.5 },
    { id: "native", name: "In-Article Native", cpm: 2.00, avgCTR: 4.2 },
];

export default function ROICalculator() {
    const [budget, setBudget] = useState(2000);
    const [selectedFormat, setSelectedFormat] = useState(adFormats[0]);
    const [conversionRate, setConversionRate] = useState(2.0);
    const [avgOrderValue, setAvgOrderValue] = useState(120);

    // Calculations
    const results = useMemo(() => {
        const impressions = (budget / selectedFormat.cpm) * 1000;
        const clicks = impressions * (selectedFormat.avgCTR / 100);
        const conversions = clicks * (conversionRate / 100);
        const revenue = conversions * avgOrderValue;
        const roi = ((revenue - budget) / budget) * 100;
        const costPerClick = budget / clicks;
        const costPerConversion = budget / conversions;

        return {
            impressions: Math.round(impressions),
            clicks: Math.round(clicks),
            conversions: Math.round(conversions),
            revenue: Math.round(revenue),
            roi: roi.toFixed(1),
            costPerClick: costPerClick.toFixed(2),
            costPerConversion: costPerConversion.toFixed(2),
        };
    }, [budget, selectedFormat, conversionRate, avgOrderValue]);

    return (
        <section className="relative">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="relative rounded-3xl overflow-hidden"
                >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/[0.08] via-transparent to-blue-500/[0.08]" />
                    <div className="absolute inset-0 border border-white/[0.08] rounded-3xl pointer-events-none" />

                    <div className="relative z-10 p-6 md:p-8 lg:p-12">
                        {/* Header */}
                        <div className="text-center mb-8 md:mb-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", duration: 0.6 }}
                                className="inline-flex items-center gap-3 mb-4 md:mb-6"
                            >
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-orange-600
                                               flex items-center justify-center shadow-lg shadow-[var(--accent)]/25">
                                    <Calculator className="w-6 h-6 md:w-7 md:h-7 text-white" />
                                </div>
                            </motion.div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4 px-4">
                                Calculate your ROI
                            </h2>
                            <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto px-4">
                                See how your ad budget performs with our competitive global rates and engaged gaming audience.
                                Adjust parameters below for real-time ROI projections.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                            {/* Left — Input controls */}
                            <div className="space-y-4 md:space-y-6">
                                {/* Budget slider */}
                                <div className="p-4 md:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                        <label className="text-xs sm:text-sm font-bold text-white/80">Campaign budget</label>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-[var(--accent)]" />
                                            <span className="text-xl sm:text-2xl font-black text-white">
                                                ${budget.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="500"
                                        max="20000"
                                        step="250"
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer
                                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                                                 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                                                 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[var(--accent)]
                                                 [&::-webkit-slider-thumb]:to-orange-600 [&::-webkit-slider-thumb]:shadow-lg
                                                 [&::-webkit-slider-thumb]:shadow-[var(--accent)]/50
                                                 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                                                 [&::-webkit-slider-thumb]:hover:scale-110"
                                    />
                                    <div className="flex justify-between text-xs text-white/40 mt-2">
                                        <span>$500</span>
                                        <span>$20,000</span>
                                    </div>
                                </div>

                                {/* Ad format selector */}
                                <div className="p-4 md:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <label className="text-xs sm:text-sm font-bold text-white/80 mb-3 md:mb-4 block">Ad format</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {adFormats.map((format) => (
                                            <motion.button
                                                key={format.id}
                                                whileHover={{ x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedFormat(format)}
                                                className={`relative p-3 md:p-4 rounded-xl text-left transition-all duration-300
                                                          ${selectedFormat.id === format.id
                                                        ? 'bg-[var(--accent)]/10 border-2 border-[var(--accent)]'
                                                        : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-white text-xs sm:text-sm mb-1 truncate">{format.name}</div>
                                                        <div className="text-[10px] sm:text-xs text-white/50">
                                                            ${format.cpm} CPM • {format.avgCTR}% avg CTR
                                                        </div>
                                                    </div>
                                                    {selectedFormat.id === format.id && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center"
                                                        >
                                                            <Sparkles className="w-3 h-3 text-white" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Advanced settings */}
                                <div className="p-4 md:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                                    <label className="text-xs sm:text-sm font-bold text-white/80 block">Advanced settings</label>

                                    {/* Conversion rate */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] sm:text-xs text-white/60">Conversion rate</span>
                                            <span className="text-xs sm:text-sm font-bold text-white">{conversionRate}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="10"
                                            step="0.5"
                                            value={conversionRate}
                                            onChange={(e) => setConversionRate(Number(e.target.value))}
                                            className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer
                                                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                                                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                                                     [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                    </div>

                                    {/* Average order value */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] sm:text-xs text-white/60">Avg order value</span>
                                            <span className="text-xs sm:text-sm font-bold text-white">${avgOrderValue}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="500"
                                            step="10"
                                            value={avgOrderValue}
                                            onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                                            className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer
                                                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                                                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                                                     [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right — Results */}
                            <div className="space-y-4">
                                {/* ROI highlight */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={results.roi}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                        className="relative p-6 md:p-8 rounded-2xl overflow-hidden"
                                        style={{
                                            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)"
                                        }}
                                    >
                                        <div className="absolute inset-0 border-2 border-green-500/20 rounded-2xl pointer-events-none" />
                                        <div className="text-center">
                                            <div className="text-xs sm:text-sm text-white/50 font-semibold uppercase tracking-wider mb-2 md:mb-3">
                                                Estimated ROI
                                            </div>
                                            <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
                                                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                                                <div className="text-4xl sm:text-5xl md:text-6xl font-black text-white">
                                                    {results.roi}%
                                                </div>
                                            </div>
                                            <div className="text-xs sm:text-sm text-green-400 font-bold">
                                                ${results.revenue.toLocaleString()} projected revenue
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Metrics grid */}
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    {[
                                        { icon: Eye, label: "Impressions", value: results.impressions.toLocaleString(), color: "from-blue-500 to-cyan-500" },
                                        { icon: Users, label: "Clicks", value: results.clicks.toLocaleString(), color: "from-purple-500 to-pink-500" },
                                        { icon: Target, label: "Conversions", value: results.conversions.toLocaleString(), color: "from-green-500 to-emerald-500" },
                                        { icon: DollarSign, label: "Cost/Conv", value: `$${results.costPerConversion}`, color: "from-orange-500 to-red-500" },
                                    ].map((metric, i) => (
                                        <motion.div
                                            key={metric.label}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1, duration: 0.4 }}
                                            className="p-3 md:p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                                        >
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${metric.color} mb-2 md:mb-3
                                                          flex items-center justify-center shadow-lg`}>
                                                <metric.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            </div>
                                            <div className="text-lg sm:text-xl md:text-2xl font-black text-white mb-1 break-all">
                                                {metric.value}
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-white/50 font-medium">
                                                {metric.label}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center gap-2 md:gap-3 p-4 md:p-5 rounded-2xl
                                             bg-gradient-to-r from-[var(--accent)] to-orange-600
                                             text-white font-bold shadow-lg shadow-[var(--accent)]/25
                                             hover:shadow-xl hover:shadow-[var(--accent)]/40
                                             transition-shadow duration-500"
                                >
                                    <span className="text-sm md:text-base lg:text-lg">
                                        <span className="hidden sm:inline">Get this campaign started</span>
                                        <span className="sm:hidden">Start campaign</span>
                                    </span>
                                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                                </motion.button>

                                {/* Disclaimer */}
                                <p className="text-[10px] sm:text-xs text-white/30 text-center leading-relaxed px-2">
                                    * Estimates based on historical data and industry benchmarks.
                                    Actual results may vary based on creative quality, targeting, and market conditions.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
