"use client";

import { useMediaKit } from "@/hooks/useMediaKit";
import { useState } from "react";
import {
    FileText, TrendingUp, Users, Globe, Sparkles,
    Monitor, Smartphone, Tablet, ChevronRight,
    Mail
} from "lucide-react";
import { motion } from "framer-motion";

// Components
import AnimatedCounter from "./components/AnimatedCounter";
import EnhancedHero from "./components/EnhancedHero";
import PerformanceMetricsDashboard from "./components/PerformanceMetricsDashboard";
import WhyChooseTechPlay from "./components/WhyChooseTechPlay";
import ROICalculator from "./components/ROICalculator";
import RequestPackageModal from "./components/RequestPackageModal";

// ═══════════════════════════════════════════════════════════════════
// LOADING & ERROR STATES
// ═══════════════════════════════════════════════════════════════════

function MediaKitSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <div className="h-screen bg-[var(--bg-secondary)] animate-pulse" />
            <div className="container mx-auto px-4 py-20 space-y-20">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-64 bg-white/[0.03] rounded-3xl animate-pulse" />
                ))}
            </div>
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-12 max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Media Kit</h2>
                <p className="text-white/50">{message}</p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

function SectionHeader({ overline, title, description }: { overline: string; title: string; description?: string }) {
    return (
        <div className="mb-12 text-center">
            <span className="text-[var(--accent)] text-sm font-semibold uppercase tracking-widest mb-3 block">
                {overline}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">{title}</h2>
            {description && (
                <p className="text-lg text-white/50 max-w-3xl mx-auto leading-relaxed">{description}</p>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, gradient, delay }: {
    label: string; value: number; icon: any; gradient: string; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-7 rounded-2xl
                       hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-2xl
                       transition-all duration-500 cursor-default group overflow-hidden"
        >
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${gradient} opacity-60
                            group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 rounded-xl ${gradient} p-[1px]`}>
                    <div className="w-full h-full rounded-xl bg-[var(--bg-primary)] flex items-center justify-center
                                   group-hover:bg-[var(--bg-primary)]/80 transition-colors duration-500">
                        <Icon className="w-5 h-5 text-white/80" />
                    </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] opacity-60 animate-pulse" />
            </div>
            <h3 className="text-4xl font-black text-white mb-1.5 tracking-tight">
                <AnimatedCounter value={value} />
            </h3>
            <p className="text-sm text-white/40 font-medium">{label}</p>
        </motion.div>
    );
}

function PricingTierCard({ title, subtitle, description, features, isPopular, delay }: {
    title: string; subtitle: string; description: string;
    features: { name: string; detail: string; price: string }[];
    isPopular?: boolean; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.6 }}
            whileHover={{ y: -8 }}
            className={`relative rounded-3xl overflow-hidden transition-all duration-500
                       ${isPopular
                    ? 'bg-gradient-to-b from-[var(--accent)]/[0.08] to-white/[0.02] border-2 border-[var(--accent)]/30 shadow-xl shadow-[var(--accent)]/10'
                    : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12]'
                }`}
        >
            {isPopular && (
                <div className="absolute top-0 left-0 right-0 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[var(--accent)] text-white
                                   text-xs font-bold rounded-b-xl shadow-lg shadow-[var(--accent)]/30">
                        <Sparkles className="w-3 h-3" />
                        Most Popular
                    </span>
                </div>
            )}

            <div className="p-8">
                <div className={`${isPopular ? 'pt-6' : ''}`}>
                    <h3 className="text-2xl font-black text-white mb-1">{title}</h3>
                    <p className="text-sm text-[var(--accent)] font-semibold mb-3">{subtitle}</p>
                    <p className="text-sm text-white/40 mb-8 leading-relaxed">{description}</p>
                </div>

                <div className="space-y-0">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between py-4 border-b border-white/[0.04]
                                     last:border-0 group/item hover:bg-white/[0.02] -mx-3 px-3 rounded-lg
                                     transition-colors duration-300"
                        >
                            <div>
                                <p className="text-sm font-semibold text-white/80">{feature.name}</p>
                                <p className="text-xs text-white/30 mt-0.5">{feature.detail}</p>
                            </div>
                            <span className="text-lg font-black text-[var(--accent)] whitespace-nowrap ml-4">
                                {feature.price}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function DemoBar({ label, percentage, delay }: { label: string; percentage: number; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="space-y-2"
        >
            <div className="flex items-center justify-between">
                <span className="text-sm text-white/70 font-medium">{label}</span>
                <span className="text-sm text-[var(--accent)] font-bold">{percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-orange-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function MediaKitClient() {
    const { data, isLoading, error } = useMediaKit();
    const [packageModalOpen, setPackageModalOpen] = useState(false);

    if (isLoading) return <MediaKitSkeleton />;
    if (error) return <ErrorState message="Failed to load media kit data" />;

    const stats = data.statistics;

    const handleDownloadPDF = () => {
        alert("PDF download functionality coming soon!");
    };

    // Build pricing tiers from API data
    const standardFeatures = (data.content?.ad_formats_standard || []).map((f: any) => ({
        name: f.name,
        detail: f.dimensions || '',
        price: f.cpm || f.monthly || '',
    }));

    const flexibleFeatures = (data.content?.ad_formats_flexible || []).map((f: any) => ({
        name: f.name,
        detail: f.format || '',
        price: f.cpc || f.monthly || '',
    }));

    const fixedFeatures = (data.content?.ad_formats_fixed || []).map((f: any) => ({
        name: f.name,
        detail: f.duration || f.subscribers || f.format || '',
        price: f.price || '',
    }));


    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Request Package Modal */}
            <RequestPackageModal
                isOpen={packageModalOpen}
                onClose={() => setPackageModalOpen(false)}
                contactEmail={data.about?.contact_email}
            />

            {/* ═══ HERO ═══ */}
            <EnhancedHero
                contactEmail={data.about?.contact_email}
                onDownloadPDF={handleDownloadPDF}
            />

            <div className="container mx-auto px-4 space-y-32 py-24">

                {/* ═══ ABOUT SECTION ═══ */}
                <Section id="about">
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Left — Text */}
                        <div className="lg:col-span-3">
                            <SectionHeader
                                overline="About us"
                                title={data.about?.about_title || 'About TechPlay'}
                            />
                            <p className="text-lg text-white/50 leading-relaxed">
                                {data.about?.about_description}
                            </p>
                        </div>
                        {/* Right — Top Countries */}
                        <div className="lg:col-span-2">
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 h-full
                                          relative overflow-hidden hover:bg-white/[0.04] hover:border-white/[0.1]
                                          transition-all duration-500"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--accent)] to-transparent" />
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-[var(--accent)]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Top countries</h3>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { country: 'United States', percentage: 32, flag: '🇺🇸' },
                                        { country: 'United Kingdom', percentage: 18, flag: '🇬🇧' },
                                        { country: 'Germany', percentage: 14, flag: '🇩🇪' },
                                        { country: 'Serbia', percentage: 12, flag: '🇷🇸' },
                                        { country: 'Canada', percentage: 8, flag: '🇨🇦' },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.country}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.05, duration: 0.3 }}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.flag}</span>
                                                <span className="text-white/70 text-sm">{item.country}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${item.percentage}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                                                        className="h-full bg-gradient-to-r from-[var(--accent)] to-orange-500"
                                                    />
                                                </div>
                                                <span className="text-white font-bold text-sm w-10 text-right">
                                                    {item.percentage}%
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </Section>

                {/* ═══ PLATFORM STATISTICS ═══ */}
                <Section id="stats">
                    <SectionHeader
                        overline="The numbers"
                        title="Here's what we're working with"
                        description="Real stats from our platform. No fluff, just the actual data you'd want to know before running ads here."
                    />
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        <StatCard
                            label="In-depth reviews"
                            value={171}
                            icon={FileText}
                            gradient="bg-gradient-to-r from-blue-500 to-cyan-400"
                            delay={0}
                        />
                        <StatCard
                            label="Total views"
                            value={21500}
                            icon={TrendingUp}
                            gradient="bg-gradient-to-r from-emerald-500 to-green-400"
                            delay={0.1}
                        />
                        <StatCard
                            label="Social following"
                            value={2000}
                            icon={Globe}
                            gradient="bg-gradient-to-r from-[var(--accent)] to-orange-400"
                            delay={0.2}
                        />
                    </div>
                </Section>

                {/* ═══ PERFORMANCE METRICS DASHBOARD ═══ */}
                <Section id="performance">
                    <SectionHeader
                        overline="Analytics"
                        title="Performance metrics"
                        description="Deep dive into our traffic patterns, audience behavior, and content performance."
                    />
                    <PerformanceMetricsDashboard />
                </Section>

                {/* ═══ AUDIENCE DEMOGRAPHICS ═══ */}
                <Section id="audience">
                    <SectionHeader
                        overline="Who's reading"
                        title="Our audience breakdown"
                        description="Mostly 18-34 year olds who actually read tech reviews before buying stuff. You know, the kind of people who care about specs."
                    />
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Age Distribution */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-7"
                        >
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4 text-[var(--accent)]" />
                                Age Distribution
                            </h3>
                            <div className="space-y-4">
                                <DemoBar label="18 – 24" percentage={35} delay={0} />
                                <DemoBar label="25 – 34" percentage={42} delay={0.1} />
                                <DemoBar label="35 – 44" percentage={15} delay={0.2} />
                                <DemoBar label="45+" percentage={8} delay={0.3} />
                            </div>
                        </motion.div>

                        {/* Device Split */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-7"
                        >
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-[var(--accent)]" />
                                Device Breakdown
                            </h3>
                            <div className="space-y-5">
                                {[
                                    { icon: Monitor, label: "Desktop", pct: 62 },
                                    { icon: Smartphone, label: "Mobile", pct: 31 },
                                    { icon: Tablet, label: "Tablet", pct: 7 },
                                ].map((d, i) => (
                                    <motion.div
                                        key={d.label}
                                        initial={{ opacity: 0, x: -16 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                                            <d.icon className="w-4 h-4 text-white/60" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1.5">
                                                <span className="text-sm text-white/70 font-medium">{d.label}</span>
                                                <span className="text-sm text-white font-bold">{d.pct}%</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-orange-400"
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${d.pct}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Engagement Metrics */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-7"
                        >
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                                Engagement
                            </h3>
                            <div className="space-y-5">
                                {[
                                    { label: "Avg. Session", value: stats.audience?.avg_session_duration || "3:42" },
                                    { label: "Pages / Session", value: stats.audience?.pages_per_session || "4.2" },
                                    { label: "Bounce Rate", value: stats.audience?.bounce_rate || "38%" },
                                    { label: "Comments / Article", value: String(stats.engagement?.avg_comments_per_article || "5.8") },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1, duration: 0.4 }}
                                        className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                                    >
                                        <span className="text-sm text-white/50">{item.label}</span>
                                        <span className="text-lg font-bold text-white">{item.value}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </Section>

                {/* ═══ WHY CHOOSE TECHPLAY ═══ */}
                <Section id="why-choose">
                    <SectionHeader
                        overline="Why TechPlay?"
                        title="What makes us different"
                        description="We're not Google Ads. Our readers actually care about gaming tech, which means they're more likely to click and buy."
                    />
                    <WhyChooseTechPlay />
                </Section>

                {/* ═══ ADVERTISING TIERS ═══ */}
                <Section id="pricing">
                    <SectionHeader
                        overline="Pricing"
                        title="How we charge for ads"
                        description="Pick what works for your budget. Whether you want CPM, CPC, or fixed placements, we've got options."
                    />
                    <div className="grid lg:grid-cols-3 gap-6">
                        {standardFeatures.length > 0 && (
                            <PricingTierCard
                                title="Standard"
                                subtitle="CPM — Cost per mille"
                                description="IAB-standard display advertising with guaranteed impressions and viewability tracking."
                                features={standardFeatures}
                                delay={0}
                            />
                        )}
                        {fixedFeatures.length > 0 && (
                            <PricingTierCard
                                title="Premium"
                                subtitle="Fixed positioning"
                                description="High-impact placements with guaranteed visibility and exclusive positioning."
                                features={fixedFeatures}
                                isPopular
                                delay={0.15}
                            />
                        )}
                        {flexibleFeatures.length > 0 && (
                            <PricingTierCard
                                title="Performance"
                                subtitle="CPC — Cost per click"
                                description="Performance-based advertising with pay-per-click pricing model."
                                features={flexibleFeatures}
                                delay={0.3}
                            />
                        )}
                    </div>
                </Section>

                {/* ═══ ROI CALCULATOR ═══ */}
                <Section id="calculator">
                    <ROICalculator />
                </Section>

                {/* ═══ CONTACT CTA ═══ */}
                <Section id="contact">
                    <div className="relative rounded-3xl overflow-hidden">
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/[0.1] via-[var(--bg-card)] to-blue-600/[0.05]" />
                        <div className="absolute inset-0 border border-white/[0.06] rounded-3xl pointer-events-none" />

                        {/* Content */}
                        <div className="relative z-10 py-20 px-8 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="text-[var(--accent)] text-sm font-semibold uppercase tracking-widest mb-4 block">
                                    Interested?
                                </span>
                                <h2 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
                                    Let's Talk About Your Campaign
                                </h2>
                                <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
                                    Send us an email and we'll get back to you with pricing and options. Usually within a few hours.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <motion.a
                                        href={`mailto:${data.about?.contact_email || 'marketing@techplay.gg'}`}
                                        className="inline-flex items-center gap-3 px-8 py-4
                                                 bg-gradient-to-r from-[var(--accent)] to-orange-600
                                                 text-white font-bold rounded-2xl
                                                 shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl hover:shadow-[var(--accent)]/40
                                                 transition-shadow duration-500"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Mail className="w-5 h-5" />
                                        <span className="text-lg">
                                            {data.about?.contact_email || 'marketing@techplay.gg'}
                                        </span>
                                        <ChevronRight className="w-5 h-5 opacity-60" />
                                    </motion.a>
                                </div>
                            </motion.div>
                        </div>

                        {/* Decorative orbs */}
                        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
                    </div>
                </Section>
            </div>
        </div>
    );
}
