"use client";

import { useMediaKit } from "@/hooks/useMediaKit";
import { FileText, TrendingUp, Users, Globe, Mail } from "lucide-react";

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

// Main MediaKit Client Component
export default function MediaKitClient() {
    const { data, isLoading, error } = useMediaKit();

    if (isLoading) return <MediaKitSkeleton />;
    if (error) return <ErrorState message="Failed to load media kit data" />;

    const stats = data.statistics;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* Hero Section */}
            <section className="relative h-[70vh] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-primary)] overflow-hidden flex items-center justify-center">
                <div className="container mx-auto px-4 text-center z-10">
                    <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-6">
                        Advertising on <span className="text-[var(--accent)]">TechPlay</span>
                    </h1>
                    <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                        Reach engaged gaming & tech enthusiasts worldwide with premium ad placements
                    </p>
                    <a
                        href={`mailto:${data.about?.contact_email || 'advertising@techplay.gg'}`}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        <Mail className="w-5 h-5" />
                        Get in Touch
                    </a>
                </div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[150px] pointer-events-none" />
            </section>

            <div className="container mx-auto px-4 space-y-16 py-12">
                {/* About Section */}
                <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-12">
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
                </section>

                {/* Platform Statistics */}
                <section>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center">
                        Platform Statistics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Total Content"
                            value={stats.content?.total_content || 0}
                            icon={FileText}
                            color="text-blue-500"
                        />
                        <StatCard
                            label="Total Views"
                            value={stats.content?.total_views || 0}
                            icon={TrendingUp}
                            color="text-green-500"
                        />
                        <StatCard
                            label="Active Users"
                            value={stats.engagement?.total_registered_users || 0}
                            icon={Users}
                            color="text-purple-500"
                        />
                        <StatCard
                            label="Monthly Visitors"
                            value={stats.audience?.monthly_visitors || 0}
                            icon={Globe}
                            color="text-orange-500"
                        />
                    </div>
                </section>

                {/* Standard Ad Formats Pricing */}
                {data.content?.ad_formats_standard && (
                    <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8">
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
                                    {data.content.ad_formats_standard.map((format: any, i: number) => (
                                        <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors">
                                            <td className="py-4 px-4 text-[var(--text-primary)]">{format.name}</td>
                                            <td className="py-4 px-4 text-[var(--text-secondary)]">{format.dimensions}</td>
                                            <td className="py-4 px-4 text-right text-[var(--accent)] font-bold">{format.cpm}</td>
                                            <td className="py-4 px-4 text-right text-[var(--text-primary)] font-semibold">{format.monthly}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Flexible Ad Formats (CPC) */}
                {data.content?.ad_formats_flexible && (
                    <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8">
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
                                        <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors">
                                            <td className="py-4 px-4 text-[var(--text-primary)]">{format.name}</td>
                                            <td className="py-4 px-4 text-[var(--text-secondary)]">{format.format}</td>
                                            <td className="py-4 px-4 text-right text-[var(--accent)] font-bold">{format.cpc}</td>
                                            <td className="py-4 px-4 text-right text-[var(--text-primary)] font-semibold">{format.monthly}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Fixed/Positioned Formats */}
                {data.content?.ad_formats_fixed && (
                    <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8">
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
                                        <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors">
                                            <td className="py-4 px-4 text-[var(--text-primary)]">{format.name}</td>
                                            <td className="py-4 px-4 text-[var(--text-secondary)]">
                                                {format.duration || format.subscribers || format.format}
                                            </td>
                                            <td className="py-4 px-4 text-right text-[var(--accent)] font-bold text-lg">{format.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Social Media Reach */}
                <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8">
                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center">
                        Social Media Reach
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <SocialStatCard platform="Facebook" followers={stats.social?.facebook_followers || 0} />
                        <SocialStatCard platform="Instagram" followers={stats.social?.instagram_followers || 0} />
                        <SocialStatCard platform="YouTube" followers={stats.social?.youtube_subscribers || 0} />
                        <SocialStatCard platform="TikTok" followers={stats.social?.tiktok_followers || 0} />
                    </div>
                    <div className="text-center p-6 bg-[var(--bg-elevated)] rounded-2xl">
                        <p className="text-sm text-[var(--text-secondary)] mb-2">Total Social Reach</p>
                        <p className="text-4xl font-black text-[var(--accent)]">
                            {(stats.social?.total_social_reach || 0).toLocaleString()}
                        </p>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="bg-gradient-to-br from-[var(--accent)]/10 to-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-12 text-center">
                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4">
                        Ready to Advertise with Us?
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                        Get in touch to discuss your advertising needs and receive a custom media kit tailored to your campaign goals.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <a
                            href={`mailto:${data.about?.contact_email || 'advertising@techplay.gg'}`}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            <Mail className="w-5 h-5" />
                            {data.about?.contact_email || 'advertising@techplay.gg'}
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${color}`} />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-2">
                {value.toLocaleString()}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        </div>
    );
}

// Social Stat Card
function SocialStatCard({ platform, followers }: { platform: string; followers: number }) {
    return (
        <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">{platform}</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">
                {followers.toLocaleString()}
            </p>
        </div>
    );
}
