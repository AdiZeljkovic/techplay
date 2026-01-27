"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import {
    TrendingUp, Users, Target, Zap, BarChart3, Layout,
    Share2, Mail, Download, ArrowRight, CheckCircle2,
    MonitorSmartphone, MousePointerClick, Shield, Globe,
    Cpu, Gamepad2, Layers
} from "lucide-react";
import { Button } from "@/components/ui/Button";

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
        color: "text-purple-400"
    },
    {
        name: "Leaderboard",
        dims: "728x90",
        desc: "High visibility across all pages. The industry standard/staple for brand awareness.",
        icon: Layers,
        color: "text-blue-400"
    },
    {
        name: "Medium Rectangle",
        dims: "300x250",
        desc: "Integrated into the sidebar and article content. High click-through rates.",
        icon: MonitorSmartphone,
        color: "text-green-400"
    },
    {
        name: "Mobile Sticky",
        dims: "320x50 / 320x100",
        desc: "Persistent footer ad on mobile devices. Cannot be missed.",
        icon: Zap,
        color: "text-yellow-400"
    }
];

export default function MarketingClient() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Advertising & Partnerships"
                description="Connect with a passionate audience of gamers, tech enthusiasts, and early adopters."
                backgroundImage="/hero-marketing.jpg"
            />

            {/* Introduction: The "Gamers Who Read" Value Prop */}
            <section className="py-20 relative overflow-hidden">
                <div className="container mx-auto px-4 max-w-5xl relative z-10 text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            More Than Just <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-500">
                                Impressions
                            </span>
                        </h2>
                        <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed">
                            TechPlay isn't just another content farm. We're a community-driven hub where
                            regional gamers come for deep dives, honest reviews, and tech analysis.
                            <br /><br />
                            When you advertise with us, you're not just buying pixels—you're starting a conversation
                            with an audience that actually listens, researches, and invests in their setup.
                        </p>
                    </motion.div>
                </div>

                {/* Background Glows */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[120px] -z-0 pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] -z-0 pointer-events-none" />
            </section>

            {/* Audience Demographics */}
            <section className="py-20 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
                <div className="container mx-auto px-4 max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-sm uppercase tracking-wider">
                            Audience Profile
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mt-4">Who Reads TechPlay?</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Age */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center"
                        >
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Young Professionals</h3>
                            <p className="text-4xl font-black text-[var(--text-primary)] mb-2">72%</p>
                            <p className="text-[var(--text-secondary)] text-sm">Aged 18-34</p>
                        </motion.div>

                        {/* Region */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center"
                        >
                            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-400">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Regional Focus</h3>
                            <p className="text-4xl font-black text-[var(--text-primary)] mb-2">SEE</p>
                            <p className="text-[var(--text-secondary)] text-sm">Bosnia, Croatia, Serbia, Montenegro</p>
                        </motion.div>

                        {/* Tech Savvy */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center"
                        >
                            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-400">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Hardware Enthusiasts</h3>
                            <p className="text-4xl font-black text-[var(--text-primary)] mb-2">85%</p>
                            <p className="text-[var(--text-secondary)] text-sm">PC & Console Gamers</p>
                        </motion.div>

                        {/* Engagement */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl text-center"
                        >
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-yellow-400">
                                <Gamepad2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Active Buyers</h3>
                            <p className="text-4xl font-black text-[var(--text-primary)] mb-2">High</p>
                            <p className="text-[var(--text-secondary)] text-sm">Purchase Intent</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Ad Placements Showcase */}
            <section className="py-20">
                <div className="container mx-auto px-4 max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                    >
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">Standard Advertising Units</h2>
                            <p className="text-[var(--text-secondary)] text-lg mb-10 leading-relaxed">
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
                                        className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[var(--bg-elevated)] transition-colors"
                                    >
                                        <div className={`p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl ${spec.color}`}>
                                            <spec.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                                {spec.name}
                                                <span className="text-xs font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)]">
                                                    {spec.dims}
                                                </span>
                                            </h4>
                                            <p className="text-[var(--text-secondary)] text-sm mt-1">{spec.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Visual "Map" of Ad Positions */}
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl p-8 relative shadow-2xl">
                            <div className="absolute top-4 left-4 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                <div className="w-3 h-3 rounded-full bg-green-500/20" />
                            </div>
                            <div className="mt-6 flex flex-col gap-4 opacity-90">
                                {/* Billboard */}
                                <div className="w-full h-24 bg-purple-500/20 border-2 border-dashed border-purple-500/50 rounded-lg flex items-center justify-center text-purple-400 font-mono text-xs md:text-sm">
                                    Billboard (970x250)
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-4">
                                        {/* Content Mock */}
                                        <div className="h-8 w-3/4 bg-[var(--bg-card)] rounded" />
                                        <div className="h-4 w-full bg-[var(--bg-card)] rounded" />
                                        <div className="h-4 w-5/6 bg-[var(--bg-card)] rounded" />
                                        <div className="h-4 w-4/6 bg-[var(--bg-card)] rounded" />
                                        {/* Native/In-Article */}
                                        <div className="w-full h-16 bg-blue-500/20 border-2 border-dashed border-blue-500/50 rounded-lg flex items-center justify-center text-blue-400 font-mono text-xs">
                                            In-Article (Native)
                                        </div>
                                        <div className="h-4 w-full bg-[var(--bg-card)] rounded" />
                                        <div className="h-4 w-5/6 bg-[var(--bg-card)] rounded" />
                                    </div>
                                    {/* Sidebar */}
                                    <div className="w-1/3 flex flex-col gap-4">
                                        <div className="w-full aspect-square bg-green-500/20 border-2 border-dashed border-green-500/50 rounded-lg flex items-center justify-center text-green-400 font-mono text-center text-xs p-2">
                                            Medium Rectangle (300x250)
                                        </div>
                                        <div className="flex-1 bg-[var(--bg-card)] rounded-lg opacity-50" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-[var(--text-muted)] text-xs mt-6">Schematic representation of key ad zones</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Custom Solutions (Replaces Pricing) */}
            <section className="py-24 bg-[var(--bg-elevated)] border-y border-[var(--border)] overflow-hidden">
                <div className="container mx-auto px-4 max-w-7xl">
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
                            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mt-6 mb-6">Beyond The Banner</h2>
                            <p className="text-[var(--text-secondary)] text-lg">
                                Display is great, but story is better. We specialize in custom integrations that
                                cut through banner blindness.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl group hover:border-[var(--accent)] transition-colors">
                                <Shield className="w-10 h-10 text-[var(--accent)] mb-6" />
                                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Sponsored Reviews</h3>
                                <p className="text-[var(--text-secondary)] mb-6">
                                    Deep-dive reviews of your hardware or game. Fully honest, fully transparent, but giving your product the spotlight it deserves.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl group hover:border-[var(--accent)] transition-colors">
                                <VideoIcon className="w-10 h-10 text-purple-400 mb-6" />
                                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Video & Social</h3>
                                <p className="text-[var(--text-secondary)] mb-6">
                                    Short-form video content (Reels/TikTok) and social media blasts that reach gamers where they scroll.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-3xl group hover:border-[var(--accent)] transition-colors">
                                <MousePointerClick className="w-10 h-10 text-green-400 mb-6" />
                                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Giveaways</h3>
                                <p className="text-[var(--text-secondary)] mb-6">
                                    High-engagement campaigns that drive massive traffic and social following. You provide the loot, we bring the crowd.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 text-center">
                <div className="container mx-auto px-4 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-6">Let's Talk Business</h2>
                        <p className="text-[var(--text-secondary)] text-lg mb-10 leading-relaxed mx-auto max-w-2xl">
                            We don't do "one size fits all" pricing. Every campaign is unique.
                            Tell us your budget and goals, and we'll craft a plan that works.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a href="mailto:marketing@techplay.gg">
                                <Button size="lg" className="h-14 text-lg px-8 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/90">
                                    <Mail className="w-5 h-5 mr-2" /> marketing@techplay.gg
                                </Button>
                            </a>
                            <Button variant="outline" size="lg" className="h-14 text-lg px-8 rounded-full" disabled>
                                <Download className="w-5 h-5 mr-2" /> Download Media Kit (PDF)
                            </Button>
                        </div>
                        <p className="mt-8 text-[var(--text-muted)] text-sm">
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
