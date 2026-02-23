"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Calculator, TrendingUp, DollarSign, Eye, Users, Target, ArrowRight, Sparkles } from "lucide-react";

const adFormats = [
    { id: "billboard", name: "Desktop Billboard", cpm: 12, avgCTR: 4.2 },
    { id: "leaderboard", name: "Leaderboard", cpm: 10, avgCTR: 3.8 },
    { id: "sidebar", name: "Sidebar", cpm: 8, avgCTR: 3.2 },
    { id: "native", name: "Native Ads", cpm: 15, avgCTR: 5.5 },
    { id: "sponsored", name: "Sponsored Content", cpm: 25, avgCTR: 6.8 },
];

export default function ROICalculator() {
    const [budget, setBudget] = useState(5000);
    const [selectedFormat, setSelectedFormat] = useState(adFormats[0]);
    const [conversionRate, setConversionRate] = useState(2.5);
    const [avgOrderValue, setAvgOrderValue] = useState(150);

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

                    <div className="relative z-10 p-8 md:p-12">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", duration: 0.6 }}
                                className="inline-flex items-center gap-3 mb-6"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-orange-600
                                               flex items-center justify-center shadow-lg shadow-[var(--accent)]/25">
                                    <Calculator className="w-7 h-7 text-white" />
                                </div>
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                                Calculate Your ROI
                            </h2>
                            <p className="text-white/60 max-w-2xl mx-auto">
                                Estimate the potential return on your advertising investment with TechPlay.
                                Adjust the parameters below to see real-time projections.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Left — Input controls */}
                            <div className="space-y-6">
                                {/* Budget slider */}
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-sm font-bold text-white/80">Campaign Budget</label>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-[var(--accent)]" />
                                            <span className="text-2xl font-black text-white">
                                                ${budget.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="1000"
                                        max="50000"
                                        step="500"
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
                                        <span>$1,000</span>
                                        <span>$50,000</span>
                                    </div>
                                </div>

                                {/* Ad format selector */}
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <label className="text-sm font-bold text-white/80 mb-4 block">Ad Format</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {adFormats.map((format) => (
                                            <motion.button
                                                key={format.id}
                                                whileHover={{ x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedFormat(format)}
                                                className={`relative p-4 rounded-xl text-left transition-all duration-300
                                                          ${selectedFormat.id === format.id
                                                        ? 'bg-[var(--accent)]/10 border-2 border-[var(--accent)]'
                                                        : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-white text-sm mb-1">{format.name}</div>
                                                        <div className="text-xs text-white/50">
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
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                                    <label className="text-sm font-bold text-white/80 block">Advanced Settings</label>

                                    {/* Conversion rate */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-white/60">Conversion Rate</span>
                                            <span className="text-sm font-bold text-white">{conversionRate}%</span>
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
                                            <span className="text-xs text-white/60">Avg Order Value</span>
                                            <span className="text-sm font-bold text-white">${avgOrderValue}</span>
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
                                        className="relative p-8 rounded-2xl overflow-hidden"
                                        style={{
                                            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)"
                                        }}
                                    >
                                        <div className="absolute inset-0 border-2 border-green-500/20 rounded-2xl pointer-events-none" />
                                        <div className="text-center">
                                            <div className="text-sm text-white/50 font-semibold uppercase tracking-wider mb-3">
                                                Estimated ROI
                                            </div>
                                            <div className="flex items-center justify-center gap-3 mb-2">
                                                <TrendingUp className="w-8 h-8 text-green-400" />
                                                <div className="text-6xl font-black text-white">
                                                    {results.roi}%
                                                </div>
                                            </div>
                                            <div className="text-sm text-green-400 font-bold">
                                                ${results.revenue.toLocaleString()} projected revenue
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Metrics grid */}
                                <div className="grid grid-cols-2 gap-4">
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
                                            className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                                        >
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} mb-3
                                                          flex items-center justify-center shadow-lg`}>
                                                <metric.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="text-2xl font-black text-white mb-1">
                                                {metric.value}
                                            </div>
                                            <div className="text-xs text-white/50 font-medium">
                                                {metric.label}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl
                                             bg-gradient-to-r from-[var(--accent)] to-orange-600
                                             text-white font-bold shadow-lg shadow-[var(--accent)]/25
                                             hover:shadow-xl hover:shadow-[var(--accent)]/40
                                             transition-shadow duration-500"
                                >
                                    <span className="text-lg">Get This Campaign Started</span>
                                    <ArrowRight className="w-5 h-5" />
                                </motion.button>

                                {/* Disclaimer */}
                                <p className="text-xs text-white/30 text-center leading-relaxed">
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
