"use client";

import { useMediaKit } from "@/hooks/useMediaKit";
import { useState } from "react";
import {
    FileText, TrendingUp, Users, Globe, Sparkles, Target,
    Monitor, Smartphone, Tablet, ChevronRight, Download,
    Mail, Palette, Type,
    Facebook, Instagram, Youtube, Music2
} from "lucide-react";
import { motion } from "framer-motion";

// Components
import AnimatedCounter from "./components/AnimatedCounter";
import EnhancedHero from "./components/EnhancedHero";
import StickyNav from "./components/StickyNav";
import TrustedBy from "./components/TrustedBy";
import RealtimeStats from "./components/RealtimeStats";
import PerformanceMetricsDashboard from "./components/PerformanceMetricsDashboard";
import SuccessStories from "./components/SuccessStories";
import WhyChooseTechPlay from "./components/WhyChooseTechPlay";
import ROICalculator from "./components/ROICalculator";
import Testimonials from "./components/Testimonials";
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

function SocialCard({ platform, followers, icon: Icon, color, bgColor, delay }: {
    platform: string; followers: number; icon: any; color: string; bgColor: string; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6
                       hover:bg-white/[0.06] hover:border-white/[0.12]
                       transition-all duration-500 cursor-default group"
        >
            <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center mb-4
                            group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-white mb-1">
                <AnimatedCounter value={followers} />
            </p>
            <p className="text-sm text-white/40 font-medium">{platform}</p>
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

function ColorSwatch({ color, name, hex }: { color: string; name: string; hex: string }) {
    return (
        <div className="group cursor-default">
            <div
                className="w-full aspect-square rounded-2xl mb-3 border border-white/[0.06]
                          group-hover:scale-105 group-hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: color }}
            />
            <p className="text-sm font-semibold text-white/80">{name}</p>
            <p className="text-xs text-white/40 font-mono">{hex}</p>
        </div>
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

    // Hero stats for trust badges
    const heroStats = {
        totalContent: stats.content?.total_content || 0,
        monthlyVisitors: stats.audience?.monthly_visitors || 0,
        socialReach: stats.social?.total_social_reach || 0,
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Sticky Navigation */}
            <StickyNav
                contactEmail={data.about?.contact_email}
                onDownloadPDF={handleDownloadPDF}
                onOpenPackageModal={() => setPackageModalOpen(true)}
            />

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
                stats={heroStats}
            />

            <div className="container mx-auto px-4 space-y-32 py-24">

                {/* ═══ TRUSTED BY ═══ */}
                <Section id="trusted-by">
                    <TrustedBy />
                </Section>

                {/* ═══ REALTIME STATS ═══ */}
                <Section>
                    <RealtimeStats />
                </Section>

                {/* ═══ ABOUT SECTION ═══ */}
                <Section id="about">
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Left — Text */}
                        <div className="lg:col-span-3">
                            <SectionHeader
                                overline="About Us"
                                title={data.about?.about_title || 'About TechPlay'}
                            />
                            <p className="text-lg text-white/50 leading-relaxed">
                                {data.about?.about_description}
                            </p>
                        </div>
                        {/* Right — Mission Card */}
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
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-[var(--accent)]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Our Mission</h3>
                                </div>
                                <p className="text-white/50 leading-relaxed">{data.about?.about_mission}</p>
                            </motion.div>
                        </div>
                    </div>
                </Section>

                {/* ═══ PLATFORM STATISTICS ═══ */}
                <Section id="stats">
                    <SectionHeader
                        overline="Platform Statistics"
                        title="Our Numbers Speak"
                        description="Key metrics that demonstrate our reach and engagement across all channels."
                    />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        <StatCard
                            label="Total Content"
                            value={stats.content?.total_content || 0}
                            icon={FileText}
                            gradient="bg-gradient-to-r from-blue-500 to-cyan-400"
                            delay={0}
                        />
                        <StatCard
                            label="Total Views"
                            value={stats.content?.total_views || 0}
                            icon={TrendingUp}
                            gradient="bg-gradient-to-r from-emerald-500 to-green-400"
                            delay={0.1}
                        />
                        <StatCard
                            label="Active Users"
                            value={stats.engagement?.total_registered_users || 0}
                            icon={Users}
                            gradient="bg-gradient-to-r from-violet-500 to-purple-400"
                            delay={0.2}
                        />
                        <StatCard
                            label="Monthly Visitors"
                            value={stats.audience?.monthly_visitors || 0}
                            icon={Globe}
                            gradient="bg-gradient-to-r from-[var(--accent)] to-orange-400"
                            delay={0.3}
                        />
                    </div>
                </Section>

                {/* ═══ PERFORMANCE METRICS DASHBOARD ═══ */}
                <Section id="performance">
                    <SectionHeader
                        overline="Analytics"
                        title="Performance Metrics"
                        description="Deep dive into our traffic patterns, audience behavior, and content performance."
                    />
                    <PerformanceMetricsDashboard />
                </Section>

                {/* ═══ AUDIENCE DEMOGRAPHICS ═══ */}
                <Section id="audience">
                    <SectionHeader
                        overline="Audience Insights"
                        title="Know Our Audience"
                        description="Detailed breakdown of who reads TechPlay — so you can target precisely."
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

                {/* ═══ SUCCESS STORIES ═══ */}
                <Section id="success">
                    <SectionHeader
                        overline="Client Success"
                        title="Proven Results"
                        description="See how leading brands achieved their marketing goals with TechPlay."
                    />
                    <SuccessStories />
                </Section>

                {/* ═══ WHY CHOOSE TECHPLAY ═══ */}
                <Section id="why-choose">
                    <SectionHeader
                        overline="Competitive Edge"
                        title="Why Choose TechPlay"
                        description="Compare our performance, audience quality, and service against other platforms."
                    />
                    <WhyChooseTechPlay />
                </Section>

                {/* ═══ ADVERTISING TIERS ═══ */}
                <Section id="pricing">
                    <SectionHeader
                        overline="Advertising"
                        title="Advertising Options"
                        description="Choose the advertising model that fits your campaign objectives. All placements include real-time analytics and performance reporting."
                    />
                    <div className="grid lg:grid-cols-3 gap-6">
                        {standardFeatures.length > 0 && (
                            <PricingTierCard
                                title="Standard"
                                subtitle="CPM — Cost Per Mille"
                                description="IAB-standard display advertising with guaranteed impressions and viewability tracking."
                                features={standardFeatures}
                                delay={0}
                            />
                        )}
                        {fixedFeatures.length > 0 && (
                            <PricingTierCard
                                title="Premium"
                                subtitle="Fixed Positioning"
                                description="High-impact placements with guaranteed visibility and exclusive positioning."
                                features={fixedFeatures}
                                isPopular
                                delay={0.15}
                            />
                        )}
                        {flexibleFeatures.length > 0 && (
                            <PricingTierCard
                                title="Performance"
                                subtitle="CPC — Cost Per Click"
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

                {/* ═══ SOCIAL MEDIA REACH ═══ */}
                <Section id="social">
                    <SectionHeader
                        overline="Social Presence"
                        title="Social Media Reach"
                        description="Our cross-platform social audience — and it's growing every day."
                    />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        <SocialCard
                            platform="Facebook"
                            followers={stats.social?.facebook_followers || 0}
                            icon={Facebook}
                            color="text-blue-400"
                            bgColor="bg-blue-500/10"
                            delay={0}
                        />
                        <SocialCard
                            platform="Instagram"
                            followers={stats.social?.instagram_followers || 0}
                            icon={Instagram}
                            color="text-pink-400"
                            bgColor="bg-pink-500/10"
                            delay={0.1}
                        />
                        <SocialCard
                            platform="YouTube"
                            followers={stats.social?.youtube_subscribers || 0}
                            icon={Youtube}
                            color="text-red-400"
                            bgColor="bg-red-500/10"
                            delay={0.2}
                        />
                        <SocialCard
                            platform="TikTok"
                            followers={stats.social?.tiktok_followers || 0}
                            icon={Music2}
                            color="text-white"
                            bgColor="bg-white/[0.06]"
                            delay={0.3}
                        />
                    </div>

                    {/* Total Reach Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="relative bg-gradient-to-r from-[var(--accent)]/[0.08] via-white/[0.02] to-blue-500/[0.08]
                                 border border-white/[0.08] rounded-2xl p-8 text-center overflow-hidden"
                    >
                        <p className="text-sm text-white/40 mb-2 font-medium uppercase tracking-wider">Total Social Reach</p>
                        <p className="text-5xl md:text-6xl font-black text-white">
                            <AnimatedCounter value={stats.social?.total_social_reach || 0} />
                        </p>
                        {/* Ambient glow */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[300px] h-[80px]
                                       bg-[var(--accent)]/20 rounded-full blur-[60px] pointer-events-none" />
                    </motion.div>
                </Section>

                {/* ═══ TESTIMONIALS ═══ */}
                <Section id="testimonials">
                    <SectionHeader
                        overline="Client Reviews"
                        title="What Advertisers Say"
                        description="Hear from brands that have successfully partnered with TechPlay."
                    />
                    <Testimonials />
                </Section>

                {/* ═══ BRAND ASSETS ═══ */}
                <Section id="brand">
                    <SectionHeader
                        overline="Brand"
                        title="Brand Assets"
                        description="Download our official brand assets for use in press releases, articles, and partnerships."
                    />
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Logo & Colors */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                                    <Palette className="w-5 h-5 text-[var(--accent)]" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Brand Colors</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <ColorSwatch color="#FC4100" name="Accent" hex="#FC4100" />
                                <ColorSwatch color="#001540" name="Navy" hex="#001540" />
                                <ColorSwatch color="#FFFFFF" name="White" hex="#FFFFFF" />
                                <ColorSwatch color="#00215E" name="Card" hex="#00215E" />
                            </div>
                        </motion.div>

                        {/* Typography & Downloads */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 flex flex-col"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                                    <Type className="w-5 h-5 text-[var(--accent)]" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Typography & Assets</h3>
                            </div>
                            <div className="space-y-3 mb-8 flex-1">
                                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                                    <span className="text-sm text-white/60">Primary Font</span>
                                    <span className="text-sm font-bold text-white">Be Vietnam Pro</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                                    <span className="text-sm text-white/60">Weights Used</span>
                                    <span className="text-sm font-bold text-white">400, 600, 700, 900</span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-white/60">Logo Formats</span>
                                    <span className="text-sm font-bold text-white">SVG, PNG</span>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-2 py-3.5
                                         bg-white/[0.04] border border-white/[0.08] rounded-xl
                                         text-white/70 font-semibold text-sm
                                         hover:bg-white/[0.08] hover:border-white/[0.15]
                                         transition-all duration-300"
                            >
                                <Download className="w-4 h-4" />
                                Download Brand Kit
                            </motion.button>
                        </motion.div>
                    </div>
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
                                    Let&apos;s Work Together
                                </span>
                                <h2 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
                                    Ready to Advertise?
                                </h2>
                                <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
                                    Get in touch to discuss your advertising needs and receive a custom media kit
                                    tailored to your campaign goals.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <motion.a
                                        href={`mailto:${data.about?.contact_email || 'advertising@techplay.gg'}`}
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
                                            {data.about?.contact_email || 'advertising@techplay.gg'}
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
