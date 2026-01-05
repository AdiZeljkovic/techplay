"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import {
    TrendingUp, Users, Target, Zap, BarChart3, Layout,
    Share2, Mail, Download, ArrowRight, CheckCircle2,
    MonitorSmartphone, MousePointerClick
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

export default function MarketingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Advertise on TechPlay.gg"
                description="Reach a passionate audience in the world of technology and gaming."
                backgroundImage="/hero-marketing.jpg"
            />

            {/* Introduction */}
            <section className="py-20 relative overflow-hidden">
                <div className="container mx-auto px-4 max-w-5xl relative z-10 text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            The Epicenter of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-500">
                                Tech & Gaming Culture
                            </span>
                        </h2>
                        <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed">
                            Welcome to TechPlay.gg, the portal delivering daily fresh info, detailed reviews, practical guides,
                            and engaging commentary from the dynamic world of tech and video games.
                            If you want to present your brand to an audience truly interested in <span className="text-[var(--text-primary)] font-semibold">innovation, premium hardware, and gaming</span>,
                            you are in the right place.
                        </p>
                    </motion.div>
                </div>

                {/* Background Blobs */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[120px] -z-0" />
                <div className="absolute top-1/3 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] -z-0" />
            </section>

            {/* Why Advertise With Us - Bento Grid */}
            <section className="py-20 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
                <div className="container mx-auto px-4 max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-sm uppercase tracking-wider">
                            Value Proposition
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mt-4">Why Advertise With Us?</h2>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6"
                    >
                        {/* Box 1: Target Audience (Large) */}
                        <motion.div variants={fadeInUp} className="lg:col-span-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-12 relative overflow-hidden group hover:border-[var(--accent)] transition-colors">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Target className="w-48 h-48 text-[var(--accent)]" />
                            </div>
                            <div className="relative z-10 h-full flex flex-col justify-center">
                                <div className="w-14 h-14 bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-center mb-6 text-[var(--accent)]">
                                    <Users className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">Reach Targeted Audience</h3>
                                <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-xl">
                                    Our readers are your potential buyers – informed, tech-savvy, and passionate about new technologies.
                                    Skip the noise and speak directly to decision-makers and early adopters.
                                </p>
                            </div>
                        </motion.div>

                        {/* Box 2: Stats (Tall) */}
                        <motion.div variants={fadeInUp} className="lg:col-span-4 bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                            <BarChart3 className="w-16 h-16 text-purple-400 mb-6" />
                            <div className="space-y-6 w-full">
                                <div>
                                    <div className="text-4xl font-black text-[var(--text-primary)]">50K+</div>
                                    <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide">Montyly Unique Visitors</div>
                                </div>
                                <div className="w-full h-px bg-[var(--border)]" />
                                <div>
                                    <div className="text-4xl font-black text-[var(--text-primary)]">120K+</div>
                                    <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide">Page Views</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Box 3: Brand Visibility */}
                        <motion.div variants={fadeInUp} className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 hover:bg-[var(--bg-elevated)] transition-colors">
                            <MonitorSmartphone className="w-10 h-10 text-blue-400 mb-6" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Brand Visibility</h3>
                            <p className="text-[var(--text-secondary)]">
                                Stand out in a relevant environment that your target group actively monitors daily.
                            </p>
                        </motion.div>

                        {/* Box 4: Concrete Results */}
                        <motion.div variants={fadeInUp} className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 hover:bg-[var(--bg-elevated)] transition-colors">
                            <TrendingUp className="w-10 h-10 text-green-400 mb-6" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Concrete Results</h3>
                            <p className="text-[var(--text-secondary)]">
                                Whether aiming for brand awareness, lead generation, or sales, our formats deliver.
                            </p>
                        </motion.div>

                        {/* Box 5: Community (Wide) */}
                        <motion.div variants={fadeInUp} className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 hover:bg-[var(--bg-elevated)] transition-colors">
                            <Zap className="w-10 h-10 text-yellow-400 mb-6" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Engaged Community</h3>
                            <p className="text-[var(--text-secondary)]">
                                Connect with an audience that values quality, authentic content and honest reviews.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Advertising Solutions */}
            <section className="py-24 overflow-hidden">
                <div className="container mx-auto px-4 max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-10 md:p-16 relative"
                    >
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">Our Advertising Solutions</h2>
                                <p className="text-[var(--text-secondary)] text-lg mb-8 leading-relaxed">
                                    We offer a wide range of advertising opportunities to meet diverse needs and budgets.
                                    From classic formats to creative campaigns, we are ready to design a solution that best fits your brand.
                                </p>

                                <ul className="space-y-4 mb-10">
                                    {[
                                        "Display Banners (Standard IAB sizes)",
                                        "Sponsored Articles & Reviews",
                                        "Social Media Campaigns (FB, IG, Native)",
                                        "Newsletter Inclusions",
                                        "Custom Giveaway Contests"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-[var(--text-primary)] font-medium">
                                            <CheckCircle2 className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a href="mailto:marketing@techplay.gg">
                                        <Button size="lg" className="w-full sm:w-auto h-14 text-lg px-8">
                                            <Mail className="w-5 h-5 mr-2" /> Contact Us
                                        </Button>
                                    </a>
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-lg px-8" disabled>
                                        <Download className="w-5 h-5 mr-2" /> Download Media Kit (PDF)
                                    </Button>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-4">* Media Kit download currently available upon request.</p>
                            </div>

                            {/* Visual Representation */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl aspect-square flex flex-col items-center justify-center text-center hover:border-[var(--accent)] transition-colors group">
                                    <Layout className="w-12 h-12 text-[var(--text-muted)] group-hover:text-[var(--accent)] mb-4 transition-colors" />
                                    <span className="font-bold text-[var(--text-primary)]">Display Ads</span>
                                </div>
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl aspect-square flex flex-col items-center justify-center text-center hover:border-[var(--accent)] transition-colors group mt-8">
                                    <MousePointerClick className="w-12 h-12 text-[var(--text-muted)] group-hover:text-[var(--accent)] mb-4 transition-colors" />
                                    <span className="font-bold text-[var(--text-primary)]">Sponsored Content</span>
                                </div>
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl aspect-square flex flex-col items-center justify-center text-center hover:border-[var(--accent)] transition-colors group -mt-8">
                                    <Share2 className="w-12 h-12 text-[var(--text-muted)] group-hover:text-[var(--accent)] mb-4 transition-colors" />
                                    <span className="font-bold text-[var(--text-primary)]">Social Media</span>
                                </div>
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl aspect-square flex flex-col items-center justify-center text-center hover:border-[var(--accent)] transition-colors group">
                                    <Target className="w-12 h-12 text-[var(--text-muted)] group-hover:text-[var(--accent)] mb-4 transition-colors" />
                                    <span className="font-bold text-[var(--text-primary)]">Custom Campaigns</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Custom / CTA Section */}
            <section className="py-20 bg-[var(--bg-secondary)] text-center">
                <div className="container mx-auto px-4 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-6">Have Custom Requirements?</h2>
                        <p className="text-[var(--text-secondary)] text-lg mb-10 leading-relaxed mx-auto max-w-2xl">
                            Open to long-term partnerships? Have an idea that isn't covered by standard packages?
                            Our marketing team is at your disposal for all questions and agreements.
                        </p>

                        <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-[var(--accent)] to-purple-600">
                            <a href="mailto:marketing@techplay.gg" className="flex items-center gap-3 bg-[var(--bg-primary)] rounded-full px-8 py-4 hover:bg-transparent transition-colors group">
                                <span className="text-xl font-bold text-[var(--text-primary)] group-hover:text-white transition-colors">
                                    marketing@techplay.gg
                                </span>
                                <ArrowRight className="w-6 h-6 text-[var(--text-primary)] group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </a>
                        </div>

                        <p className="mt-12 text-[var(--text-muted)]">
                            We look forward to a successful cooperation! <br />
                            <span className="font-bold text-[var(--text-primary)]">The TechPlay.gg Team</span>
                        </p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
