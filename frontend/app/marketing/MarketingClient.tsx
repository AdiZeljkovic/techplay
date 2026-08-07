"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Users, Zap, Layout, Mail, Download, MonitorSmartphone, MousePointerClick, Shield, Globe, Cpu, Gamepad2, Layers } from "lucide-react";
import Link from "next/link";
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

// Mock Data for Ad Specs
const adSpecs = [
    {
        name: "Billboard / Skin",
        dims: "970x250 + Background",
        desc: "Maximum impact. Own the top of the homepage and wrap the site experience.",
        icon: Layout,
        color: "text-[var(--accent)]"
    },
    {
        name: "Leaderboard",
        dims: "728x90",
        desc: "High visibility across all pages. The industry standard/staple for brand awareness.",
        icon: Layers,
        color: "text-[var(--accent)]"
    },
    {
        name: "Medium Rectangle",
        dims: "300x250",
        desc: "Integrated into the sidebar and article content. High click-through rates.",
        icon: MonitorSmartphone,
        color: "text-[var(--accent)]"
    },
    {
        name: "Mobile Sticky",
        dims: "320x50 / 320x100",
        desc: "Persistent footer ad on mobile devices. Cannot be missed.",
        icon: Zap,
        color: "text-[var(--accent)]"
    }
];

export default function MarketingClient() {
    return (
        <div className="min-h-screen">
            <PageHero
                title="Advertising & Partnerships"
                description="Connect with a passionate audience of gamers, tech enthusiasts, and early adopters."
            />

            {/* Introduction: The "Gamers Who Read" Value Prop */}
            <section className="py-20 relative overflow-hidden">
                <div className="container-page relative z-10 text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight">
                            More Than Just <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)]">
                                Impressions
                            </span>
                        </h2>
                        <p className="text-lg md:text-xl text-white/55 mb-12 max-w-3xl mx-auto leading-relaxed">
                            TechPlay isn't just another content farm. We're a community-driven hub where
                            gamers come for deep dives, honest reviews, and tech analysis.
                            <br /><br />
                            When you advertise with us, you're not just buying pixels—you're starting a conversation
                            with an audience that actually listens, researches, and invests in their setup.
                        </p>
                    </motion.div>
                </div>

                {/* Background Glows */}
            </section>

            {/* Audience Demographics */}
            <section className="py-20 bg-[var(--surface-1)] border-y border-[var(--line)]">
                <div className="container-page">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-sm uppercase tracking-wider">
                            Audience Profile
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mt-4">Who Reads TechPlay?</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Age */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-[var(--radius-panel)] text-center"
                        >
                            <div className="btn-command w-12 h-12 bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-6 text-[var(--accent)]">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Young Professionals</h3>
                            <p className="text-4xl font-black text-white mb-2">72%</p>
                            <p className="text-white/55 text-sm">Aged 18-34</p>
                        </motion.div>

                        {/* Region */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-[var(--radius-panel)] text-center"
                        >
                            <div className="btn-command w-12 h-12 bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-6 text-[var(--accent)]">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Global Reach</h3>
                            <p className="text-4xl font-black text-white mb-2">Worldwide</p>
                            <p className="text-white/55 text-sm">US, EU, and Global Audience</p>
                        </motion.div>

                        {/* Tech Savvy */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-[var(--radius-panel)] text-center"
                        >
                            <div className="btn-command w-12 h-12 bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-6 text-[var(--accent)]">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Hardware Enthusiasts</h3>
                            <p className="text-4xl font-black text-white mb-2">85%</p>
                            <p className="text-white/55 text-sm">PC & Console Gamers</p>
                        </motion.div>

                        {/* Engagement */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-[var(--radius-panel)] text-center"
                        >
                            <div className="btn-command w-12 h-12 bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-6 text-[var(--accent)]">
                                <Gamepad2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Active Buyers</h3>
                            <p className="text-4xl font-black text-white mb-2">High</p>
                            <p className="text-white/55 text-sm">Purchase Intent</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Ad Placements Showcase */}
            <section className="py-20">
                <div className="container-page">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                    >
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Standard Advertising Units</h2>
                            <p className="text-white/55 text-lg mb-10 leading-relaxed">
                                We support all IAB standard ad units, optimized for performance and visibility without ruining the user experience.
                            </p>

                            <div className="space-y-6">
                                {adSpecs.map((spec, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-start gap-4 p-4 rounded-[var(--radius-panel)] hover:bg-[var(--surface-2)] transition-colors"
                                    >
                                        <div className={`p-3 bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-card)] ${spec.color}`}>
                                            <spec.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                {spec.name}
                                                <span className="text-xs font-mono bg-[var(--surface-1)] px-2 py-1 rounded border border-[var(--line)] text-white/35">
                                                    {spec.dims}
                                                </span>
                                            </h4>
                                            <p className="text-white/55 text-sm mt-1">{spec.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Visual "Map" of Ad Positions */}
                        <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-panel)] p-8 relative shadow-2xl">
                            <div className="absolute top-4 left-4 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                <div className="w-3 h-3 rounded-full bg-green-500/20" />
                            </div>
                            <div className="mt-6 flex flex-col gap-4 opacity-90">
                                {/* Billboard */}
                                <div className="w-full h-24 bg-[var(--accent)]/15 border-2 border-dashed border-[var(--accent)]/40 rounded-[var(--radius-card)] flex items-center justify-center text-[var(--accent)] font-mono text-xs md:text-sm">
                                    Billboard (970x250)
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-4">
                                        {/* Content Mock */}
                                        <div className="h-8 w-3/4 bg-[var(--surface-1)] rounded" />
                                        <div className="h-4 w-full bg-[var(--surface-1)] rounded" />
                                        <div className="h-4 w-5/6 bg-[var(--surface-1)] rounded" />
                                        <div className="h-4 w-4/6 bg-[var(--surface-1)] rounded" />
                                        {/* Native/In-Article */}
                                        <div className="w-full h-16 bg-[var(--accent)]/10 border-2 border-dashed border-[var(--accent)]/30 rounded-[var(--radius-card)] flex items-center justify-center text-[var(--accent)]/80 font-mono text-xs">
                                            In-Article (Native)
                                        </div>
                                        <div className="h-4 w-full bg-[var(--surface-1)] rounded" />
                                        <div className="h-4 w-5/6 bg-[var(--surface-1)] rounded" />
                                    </div>
                                    {/* Sidebar */}
                                    <div className="w-1/3 flex flex-col gap-4">
                                        <div className="w-full aspect-square bg-[var(--accent)]/8 border-2 border-dashed border-[var(--accent)]/25 rounded-[var(--radius-card)] flex items-center justify-center text-[var(--accent)]/70 font-mono text-center text-xs p-2">
                                            Medium Rectangle (300x250)
                                        </div>
                                        <div className="flex-1 bg-[var(--surface-1)] rounded-[var(--radius-card)] opacity-50" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-white/35 text-xs mt-6">Schematic representation of key ad zones</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Custom Solutions (Replaces Pricing) */}
            <section className="py-24 bg-[var(--surface-2)] border-y border-[var(--line)] overflow-hidden">
                <div className="container-page">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative z-10"
                    >
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-sm uppercase tracking-wider">
                                Tailored Solutions
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mt-6 mb-6">Beyond The Banner</h2>
                            <p className="text-white/55 text-lg">
                                Display is great, but story is better. We specialize in custom integrations that
                                cut through banner blindness.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-[var(--radius-panel)] group hover:border-[var(--accent)] transition-colors">
                                <Shield className="w-10 h-10 text-[var(--accent)] mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-4">Brand Storytelling</h3>
                                <p className="text-white/55 mb-6">
                                    Share your announcements through PR and promo articles. We give your launches the context they need, ensuring your message lands with impact.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-[var(--radius-panel)] group hover:border-[var(--accent)] transition-colors">
                                <VideoIcon className="w-10 h-10 text-[var(--accent)] mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-4">Video & Social</h3>
                                <p className="text-white/55 mb-6">
                                    Short-form video content (Reels/TikTok) and social media blasts that reach gamers where they scroll.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-[var(--surface-1)] border border-[var(--line)] p-8 rounded-[var(--radius-panel)] group hover:border-[var(--accent)] transition-colors">
                                <MousePointerClick className="w-10 h-10 text-[var(--accent)] mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-4">Giveaways</h3>
                                <p className="text-white/55 mb-6">
                                    High-engagement campaigns that drive massive traffic and social following. You provide the loot, we bring the crowd.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 text-center">
                <div className="container-page">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Let's Talk Business</h2>
                        <p className="text-white/55 text-lg mb-10 leading-relaxed mx-auto max-w-2xl">
                            We don't do "one size fits all" pricing. Every campaign is unique.
                            Tell us your budget and goals, and we'll craft a plan that works.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a href="mailto:marketing@techplay.gg" className="btn-command inline-flex items-center gap-2 h-[52px] px-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-colors uppercase tracking-[0.08em] text-[13px]">
                                <Mail className="w-5 h-5" /> marketing@techplay.gg
                            </a>
                            <Link href="/media-kit" className="btn-command btn-command-quiet inline-flex items-center gap-2 h-[52px] px-8 bg-white/[0.04] text-white/70 hover:text-white font-bold uppercase tracking-[0.08em] text-[13px] transition-colors">
                                <Download className="w-5 h-5" /> View Media Kit
                            </Link>
                        </div>
                        <p className="mt-8 text-white/35 text-sm">
                            Agency? Ask for our agency rate card.
                        </p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

// Icon helper component since Video is not a direct export from lucide-react in some versions, sticking to known ones or using a reliable replacement
// Reused icons: Shield, MousePointerClick. Added a custom one below if Video is missing.
const VideoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
);
