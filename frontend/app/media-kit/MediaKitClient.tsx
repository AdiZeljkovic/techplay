"use client";

import type { MediaKitData } from "@/hooks/useMediaKit";
import { useState } from "react";
import {
    FileText, TrendingUp, Users, Globe, Sparkles,
    Monitor, Smartphone, Tablet, ChevronRight,
    Mail
} from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import toast from "react-hot-toast";

// Components
import AnimatedCounter from "./components/AnimatedCounter";
import EnhancedHero from "./components/EnhancedHero";
import PerformanceMetricsDashboard from "./components/PerformanceMetricsDashboard";
import WhyChooseTechPlay from "./components/WhyChooseTechPlay";
import ROICalculator from "./components/ROICalculator";
import RequestPackageModal from "./components/RequestPackageModal";

// The skeleton and the error state that used to live here are gone with the
// client-side fetch. The page receives its data from the server now, so there
// is no loading pass to fill and no request that can fail in the browser.

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
        <div className="mb-6">
            <span className="block mb-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                {overline}
            </span>
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                <span aria-hidden className="w-[3px] h-[14px] rounded-full bg-[var(--accent)]" />
                {title}
            </h2>
            {description && (
                <p className="mt-2.5 max-w-3xl text-[13px] text-[var(--ink-low)] leading-relaxed">{description}</p>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon }: {
    label: string; value: number; icon: LucideIcon; gradient?: string; delay?: number;
}) {
    return (
        <div className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300">
            <span className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-4">
                <Icon className="w-[18px] h-[18px]" />
            </span>
            <p className="font-display text-[26px] font-black tabular-nums leading-none text-[var(--ink-hi)]">
                <AnimatedCounter value={value} />
            </p>
            <p className="mt-1.5 text-[12px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{label}</p>
        </div>
    );
}

function PricingTierCard({ title, subtitle, description, features, isPopular }: {
    title: string; subtitle: string; description: string;
    features: { name: string; detail: string; price: string }[];
    isPopular?: boolean; delay?: number;
}) {
    return (
        <div
            className={`relative flex h-full flex-col rounded-[var(--radius-card)] p-6 border ${
                isPopular
                    ? "bg-[var(--surface-2)] border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                    : "bg-[var(--surface-1)] border-[var(--line)]"
            }`}
        >
            {isPopular && (
                <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <Sparkles className="w-3 h-3" />
                    Most popular
                </span>
            )}

            <h3 className="font-display text-[15px] font-black uppercase tracking-wider text-[var(--ink-hi)]">{title}</h3>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">{subtitle}</p>
            <p className="mt-2.5 mb-5 text-[12.5px] text-[var(--ink-low)] leading-relaxed">{description}</p>

            <div className="mt-auto">
                {features.map((feature) => (
                    <div
                        key={feature.name}
                        className="flex items-center justify-between gap-4 border-t border-[var(--line)] py-3"
                    >
                        <span className="min-w-0">
                            <span className="block text-[13px] font-semibold text-[var(--ink-hi)]">{feature.name}</span>
                            {feature.detail && (
                                <span className="block text-[11.5px] text-[var(--ink-faint)]">{feature.detail}</span>
                            )}
                        </span>
                        <span className="shrink-0 font-display text-[15px] font-black text-[var(--accent)] tabular-nums">
                            {feature.price}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DemoBar({ label, percentage }: { label: string; percentage: number; delay?: number }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-[var(--ink-mid)]">{label}</span>
                <span className="text-[12.5px] font-bold tabular-nums text-[var(--accent)]">{percentage}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--fill-2)] overflow-hidden">
                <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function MediaKitClient({ data }: { data: MediaKitData }) {
    const [packageModalOpen, setPackageModalOpen] = useState(false);

    // The API can be unreachable at build time, and every figure below already
    // has a fallback — so an empty shape here means the page still renders.
    const stats = data.statistics ?? ({} as MediaKitData["statistics"]);

    const handleDownloadPDF = () => {
        toast("PDF download functionality coming soon!");
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
        <main className="min-h-screen bg-[var(--surface-0)]">
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

            <div className="container-page space-y-10 md:space-y-14 py-10 md:py-14">

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
                                                        className="h-full bg-[var(--accent)]"
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
                            gradient=""
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
                                                    className="h-full rounded-full bg-[var(--accent)]"
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
                    <div className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-8 text-center">
                        <span className="block mb-3 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                            Interested?
                        </span>
                        <h2 className="font-display text-[19px] md:text-[22px] font-black uppercase tracking-tight text-[var(--ink-hi)] mb-3">
                            Let&apos;s talk about your campaign
                        </h2>
                        <p className="mx-auto mb-7 max-w-2xl text-[13.5px] text-[var(--ink-low)] leading-relaxed">
                            Send us an email and we&apos;ll get back to you with pricing and options. Usually within
                            a few hours.
                        </p>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
                            <a
                                href={`mailto:${data.about?.contact_email || 'marketing@techplay.gg'}`}
                                className="btn-command inline-flex items-center justify-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                            >
                                <Mail className="w-4 h-4" />
                                {data.about?.contact_email || 'marketing@techplay.gg'}
                            </a>

                            {/*
                              The button RequestPackageModal was waiting for. The modal was
                              built, imported and rendered, but setPackageModalOpen(true) was
                              never called anywhere — 347 lines of form that could only ever
                              be closed.
                            */}
                            <button
                                type="button"
                                onClick={() => setPackageModalOpen(true)}
                                className="btn-command btn-command-quiet inline-flex items-center justify-center gap-2 h-11 px-6 bg-[var(--fill-2)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                            >
                                <Sparkles className="w-4 h-4" />
                                Request a package
                            </button>
                        </div>
                    </div>
                </Section>
            </div>
        </main>
    );
}
