"use client";

import { useMediaKit } from "@/hooks/useMediaKit";
import { FileText, TrendingUp, Users, Globe, Mail, Download, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "./components/AnimatedCounter";
import TrafficChart from "./components/TrafficChart";

// Loading skeleton
function MediaKitSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] animate-pulse">
            <div className="h-[70vh] bg-[var(--bg-elevated)]" />
            <div className="container mx-auto px-4 py-12 space-y-16">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-64 bg-[var(--bg-elevated)] rounded-3xl" />
                ))}
            </div>
        </div>
    );
}

// Error state
function ErrorState({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-12 max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                    Failed to Load Media Kit
                </h2>
                <p className="text-[var(--text-secondary)]">{message}</p>
            </div>
        </div>
    );
}

// Enhanced Stat Card with animations
function StatCard({ label, value, icon: Icon, color, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl
                       hover:shadow-2xl hover:shadow-[var(--accent)]/10 transition-all duration-300
                       cursor-pointer group"
        >
            <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${color} group-hover:scale-110 transition-transform duration-300`} />
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-2">
                <AnimatedCounter value={value} />
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        </motion.div>
    );
}

// Social Stat Card with hover effect
function SocialStatCard({ platform, followers, delay }: { platform: string; followers: number; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            className="bg-[var(--bg-elevated)] p-6 rounded-2xl text-center
                       hover:bg-[var(--bg-card)] hover:border hover:border-[var(--accent)]
                       transition-all duration-300 cursor-pointer"
        >
            <p className="text-sm text-[var(--text-secondary)] mb-2">{platform}</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">
                <AnimatedCounter value={followers} />
            </p>
        </motion.div>
    );
}

// Main MediaKit Client Component
export default function MediaKitClient() {
    const { data, isLoading, error } = useMediaKit();

    if (isLoading) return <MediaKitSkeleton />;
    if (error) return <ErrorState message="Failed to load media kit data" />;

    const stats = data.statistics;

    const handleDownloadPDF = () => {
        // TODO: Implement PDF generation
        alert("PDF download functionality coming soon!");
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* Enhanced Hero Section */}
            <section className="relative h-[70vh] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-primary)] overflow-hidden flex items-center justify-center">
                <div className="container mx-auto px-4 text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-6">
                            Advertising on <span className="text-[var(--accent)] relative inline-block">
                                TechPlay
                                <motion.div
                                    className="absolute -top-6 -right-6"
                                    animate={{ rotate: [0, 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Sparkles className="w-6 h-6 text-[var(--accent)]" />
                                </motion.div>
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto"
                    >
                        Reach engaged gaming & tech enthusiasts worldwide with premium ad placements
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="flex flex-col md:flex-row gap-4 justify-center items-center"
                    >
                        <a
                            href={`mailto:${data.about?.contact_email || 'advertising@techplay.gg'}`}
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-white font-bold rounded-xl
                                     hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg shadow-[var(--accent)]/30"
                        >
                            <Mail className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Get in Touch
                        </a>
                        <button
                            onClick={handleDownloadPDF}
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-[var(--bg-card)] border-2 border-[var(--border)]
                                     text-[var(--text-primary)] font-bold rounded-xl hover:border-[var(--accent)]
                                     hover:scale-105 transition-all duration-300"
                        >
                            <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            Download PDF
                        </button>
                    </motion.div>
                </div>

                {/* Animated gradient blobs */}
                <motion.div
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[150px] pointer-events-none"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ repeat: Infinity, duration: 8 }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ repeat: Infinity, duration: 10, delay: 1 }}
                />
            </section>

            <div className="container mx-auto px-4 space-y-16 py-12">
                {/* About Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-12
                               hover:shadow-2xl transition-shadow duration-500"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-6">
                        {data.about?.about_title || 'About TechPlay'}
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
                        {data.about?.about_description}
                    </p>
                    <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border-l-4 border-[var(--accent)]">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Our Mission</h3>
                        <p className="text-[var(--text-secondary)]">{data.about?.about_mission}</p>
                    </div>
                </motion.section>

                {/* Platform Statistics with Animation */}
                <section>
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center"
                    >
                        Platform Statistics
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Total Content"
                            value={stats.content?.total_content || 0}
                            icon={FileText}
                            color="text-blue-500"
                            delay={0}
                        />
                        <StatCard
                            label="Total Views"
                            value={stats.content?.total_views || 0}
                            icon={TrendingUp}
                            color="text-green-500"
                            delay={0.1}
                        />
                        <StatCard
                            label="Active Users"
                            value={stats.engagement?.total_registered_users || 0}
                            icon={Users}
                            color="text-purple-500"
                            delay={0.2}
                        />
                        <StatCard
                            label="Monthly Visitors"
                            value={stats.audience?.monthly_visitors || 0}
                            icon={Globe}
                            color="text-orange-500"
                            delay={0.3}
                        />
                    </div>
                </section>

                {/* Traffic Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <TrafficChart />
                </motion.div>

                {/* Standard Ad Formats Pricing with "Most Popular" Badge */}
                {data.content?.ad_formats_standard && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8
                                   hover:shadow-2xl transition-all duration-500"
                    >
                        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-6">
                            Standard Ad Formats (CPM)
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-8">
                            IAB-standard display advertising with guaranteed impressions and viewability tracking.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="text-left py-4 px-4 text-[var(--text-primary)] font-bold">Ad Format</th>
                                        <th className="text-left py-4 px-4 text-[var(--text-primary)] font-bold">Dimensions</th>
                                        <th className="text-right py-4 px-4 text-[var(--text-primary)] font-bold">CPM Rate</th>
                                        <th className="text-right py-4 px-4 text-[var(--text-primary)] font-bold">Monthly Package</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.content.ad_formats_standard.map((format: any, i: number) => {
                                        const isMostPopular = format.name === 'Desktop Billboard';
                                        return (
                                            <motion.tr
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`border-b border-[var(--border)] hover:bg-[var(--bg-elevated)]
                                                           transition-all duration-300 group relative
                                                           ${isMostPopular ? 'bg-[var(--accent)]/5' : ''}`}
                                            >
                                                <td className="py-4 px-4 text-[var(--text-primary)] relative">
                                                    {format.name}
                                                    {isMostPopular && (
                                                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent)]
                                                                       text-white text-xs font-bold rounded-full">
                                                            <Sparkles className="w-3 h-3" />
                                                            Most Popular
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-[var(--text-secondary)]">{format.dimensions}</td>
                                                <td className="py-4 px-4 text-right text-[var(--accent)] font-bold text-lg
                                                               group-hover:scale-110 transition-transform">
                                                    {format.cpm}
                                                </td>
                                                <td className="py-4 px-4 text-right text-[var(--text-primary)] font-semibold">
                                                    {format.monthly}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>
                )}

                {/* Flexible Ad Formats (CPC) */}
                {data.content?.ad_formats_flexible && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8
                                   hover:shadow-2xl transition-all duration-500"
                    >
                        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-6">
                            Flexible Ad Formats (CPC)
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-8">
                            Performance-based advertising with pay-per-click pricing model.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="text-left py-4 px-4 text-[var(--text-primary)] font-bold">Ad Format</th>
                                        <th className="text-left py-4 px-4 text-[var(--text-primary)] font-bold">Format Type</th>
                                        <th className="text-right py-4 px-4 text-[var(--text-primary)] font-bold">CPC Rate</th>
                                        <th className="text-right py-4 px-4 text-[var(--text-primary)] font-bold">Monthly Package</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.content.ad_formats_flexible.map((format: any, i: number) => (
                                        <motion.tr
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)]
                                                     transition-all duration-300 group"
                                        >
                                            <td className="py-4 px-4 text-[var(--text-primary)]">{format.name}</td>
                                            <td className="py-4 px-4 text-[var(--text-secondary)]">{format.format}</td>
                                            <td className="py-4 px-4 text-right text-[var(--accent)] font-bold text-lg
                                                         group-hover:scale-110 transition-transform">
                                                {format.cpc}
                                            </td>
                                            <td className="py-4 px-4 text-right text-[var(--text-primary)] font-semibold">
                                                {format.monthly}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>
                )}

                {/* Fixed/Positioned Formats */}
                {data.content?.ad_formats_fixed && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8
                                   hover:shadow-2xl transition-all duration-500"
                    >
                        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-6">
                            Premium Positioned Formats
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-8">
                            High-impact placements with guaranteed visibility and exclusive positioning.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="text-left py-4 px-4 text-[var(--text-primary)] font-bold">Placement</th>
                                        <th className="text-left py-4 px-4 text-[var(--text-primary)] font-bold">Details</th>
                                        <th className="text-right py-4 px-4 text-[var(--text-primary)] font-bold">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.content.ad_formats_fixed.map((format: any, i: number) => (
                                        <motion.tr
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)]
                                                     transition-all duration-300 group"
                                        >
                                            <td className="py-4 px-4 text-[var(--text-primary)] font-semibold">{format.name}</td>
                                            <td className="py-4 px-4 text-[var(--text-secondary)]">
                                                {format.duration || format.subscribers || format.format}
                                            </td>
                                            <td className="py-4 px-4 text-right text-[var(--accent)] font-bold text-xl
                                                         group-hover:scale-110 transition-transform">
                                                {format.price}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>
                )}

                {/* Social Media Reach */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8"
                >
                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center">
                        Social Media Reach
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <SocialStatCard platform="Facebook" followers={stats.social?.facebook_followers || 0} delay={0} />
                        <SocialStatCard platform="Instagram" followers={stats.social?.instagram_followers || 0} delay={0.1} />
                        <SocialStatCard platform="YouTube" followers={stats.social?.youtube_subscribers || 0} delay={0.2} />
                        <SocialStatCard platform="TikTok" followers={stats.social?.tiktok_followers || 0} delay={0.3} />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="text-center p-6 bg-gradient-to-r from-[var(--accent)]/10 to-blue-500/10
                                 rounded-2xl border border-[var(--accent)]/20"
                    >
                        <p className="text-sm text-[var(--text-secondary)] mb-2">Total Social Reach</p>
                        <p className="text-5xl font-black text-[var(--accent)]">
                            <AnimatedCounter value={stats.social?.total_social_reach || 0} />
                        </p>
                    </motion.div>
                </motion.section>

                {/* Contact Section with Enhanced CTA */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative bg-gradient-to-br from-[var(--accent)]/10 to-[var(--bg-card)]
                             border border-[var(--border)] rounded-3xl p-12 text-center overflow-hidden"
                >
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4">
                            Ready to Advertise with Us?
                        </h2>
                        <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                            Get in touch to discuss your advertising needs and receive a custom media kit tailored to your campaign goals.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                            <a
                                href={`mailto:${data.about?.contact_email || 'advertising@techplay.gg'}`}
                                className="group inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-white
                                         font-bold rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-300
                                         shadow-lg shadow-[var(--accent)]/30"
                            >
                                <Mail className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                {data.about?.contact_email || 'advertising@techplay.gg'}
                            </a>
                            <button
                                onClick={handleDownloadPDF}
                                className="group inline-flex items-center gap-2 px-8 py-4 bg-[var(--bg-card)]
                                         border-2 border-[var(--accent)] text-[var(--text-primary)] font-bold rounded-xl
                                         hover:bg-[var(--accent)] hover:text-white hover:scale-105 transition-all duration-300"
                            >
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                                Download Full Media Kit
                            </button>
                        </div>
                    </div>

                    {/* Decorative animated circle */}
                    <motion.div
                        className="absolute -bottom-20 -right-20 w-64 h-64 bg-[var(--accent)]/20 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 5 }}
                    />
                </motion.section>
            </div>
        </div>
    );
}
