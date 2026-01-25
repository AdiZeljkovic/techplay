"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Target, Zap, Heart, Globe, Shield, Users, ArrowRight } from "lucide-react";

// SEO handled by parent layout + generateMetadata pattern
// For client components, metadata is set via head in parent or layout

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="About TechPlay"
                description="Built by gamers, for gamers. No corporate BS, just honest tech talk."
            />

            <div className="container mx-auto px-4 py-16 max-w-6xl space-y-24">

                {/* Mission Section */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center max-w-3xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-white mb-6">What We Do</h2>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
                        We test hardware until it breaks. We play games until 4 AM to write honest reviews.
                        We dig through patch notes so you don't have to. And we do it because we genuinely care
                        about this stuff—not because some PR agency asked nicely.
                    </p>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        TechPlay exists to answer one simple question: "Is this actually worth buying?"
                        No fluff, no sponsored hot takes, just real opinions from people who spend their own money on gear.
                    </p>
                </motion.section>

                {/* Values Grid */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white">Core Values</h2>
                        <div className="w-20 h-1 bg-[var(--accent)] mx-auto mt-4 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Target, title: "We Actually Test Things", desc: "Benchmarks, stress tests, daily use. We don't copy-paste press releases and call it a review." },
                            { icon: Shield, title: "No Sponsored Bullshit", desc: "If a product sucks, we'll tell you. Even if the brand sent us 10 units for free." },
                            { icon: Users, title: "Community First", desc: "You guys keep the lights on, not advertisers. Your trust matters more than any partnership deal." },
                            { icon: Heart, title: "We're Gamers Too", desc: "Our writers grind ranked, debate console wars in Slack, and spend paychecks on RGB. We get it." },
                            { icon: Zap, title: "Fast & Accurate", desc: "Breaking news drops while it's still fresh. Deep dives go live when we've tested everything twice." },
                            { icon: Globe, title: "For Everyone", desc: "Whether you're building a €3000 rig or gaming on a laptop from 2015, you belong here." },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors group"
                            >
                                <div className="w-12 h-12 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center mb-6 text-[var(--accent)] group-hover:scale-110 transition-transform">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-[var(--text-secondary)]">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* History / Story */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
                >
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
                        <div className="space-y-4 text-[var(--text-secondary)]">
                            <p>
                                TechPlay started back in 2020 as a small blog covering local gaming news from the Balkans.
                                Gaming has always been in our blood—late-night sessions, heated debates about which console is better,
                                and that constant itch to know what's coming next.
                            </p>
                            <p>
                                What began as a passion project quickly grew into something bigger. We realized there was a gap:
                                people wanted honest takes on games and tech, not recycled press releases dressed up as reviews.
                            </p>
                            <p>
                                Today, we cover everything from the latest AAA releases and esports drama to hardware reviews
                                and that weird indie game everyone's sleeping on. Gaming isn't just what we write about—it's what we do
                                when the keyboards go silent.
                            </p>
                            <p className="text-[var(--text-primary)] font-semibold">
                                We're not the biggest, but gaming runs in our veins. And we're just getting started.
                            </p>
                        </div>
                    </div>
                    <div className="relative h-[400px] rounded-3xl overflow-hidden border border-[var(--border)]">
                        <img
                            src="/images/about/team.jpg"
                            alt="TechPlay Team"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent"></div>

                        {/* Stats overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                            <div className="flex justify-around text-center">
                                <div>
                                    <div className="text-3xl font-black text-white">2020</div>
                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Founded</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-[var(--accent)]">0</div>
                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Sponsored Reviews</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white">∞</div>
                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Gaming Hours</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* What We Cover */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">What You'll Find Here</h2>
                            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                                We cover the full spectrum of gaming and tech. Here's what to expect:
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    title: "Hardware Reviews",
                                    items: ["GPUs, CPUs, and motherboards", "Gaming laptops and peripherals", "Monitors, mice, keyboards", "Real-world benchmarks"]
                                },
                                {
                                    title: "Game Coverage",
                                    items: ["Day-one reviews (no spoilers)", "Patch notes breakdowns", "Indie game spotlights", "Performance analysis"]
                                },
                                {
                                    title: "Guides & Tutorials",
                                    items: ["PC building for beginners", "Optimization guides", "Troubleshooting common issues", "Settings deep dives"]
                                },
                                {
                                    title: "Industry News",
                                    items: ["Game announcements", "Tech releases and rumors", "Esports updates", "Developer interviews"]
                                }
                            ].map((category, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={fadeInUp}
                                    className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                                >
                                    <h3 className="text-lg font-bold text-white mb-4">{category.title}</h3>
                                    <ul className="space-y-2">
                                        {category.items.map((item, i) => (
                                            <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                                <span className="text-[var(--accent)] mt-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-[var(--text-muted)] mb-6">
                                Questions? Suggestions? Think we missed something important?
                            </p>
                            <a
                                href="/contact"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl transition-colors"
                            >
                                Get in Touch
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </motion.section>

            </div>
        </div>
    );
}
