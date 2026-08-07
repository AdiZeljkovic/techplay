"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Target, Zap, Heart, Globe, Shield, Users, ArrowRight, Gamepad2, Monitor, Cpu, Keyboard } from "lucide-react";

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
        <div className="min-h-screen">
            <PageHero
                title="About TechPlay"
                description="Built by gamers, for gamers. Just honest gaming and tech talk."
            />

            <div className="container-page py-16 space-y-24">

                {/* Mission Section */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center max-w-3xl mx-auto"
                >
                    <h2 className="font-display text-3xl font-bold text-white mb-6 uppercase tracking-tight">What We Do</h2>
                    <p className="text-lg text-white/55 leading-relaxed mb-6">
                        We test hardware until it breaks. We play games until 4 AM to write honest reviews.
                        We dig through patch notes so you don't have to. And we do it because we genuinely care
                        about this stuff—not because some PR agency asked nicely.
                    </p>
                    <p className="text-lg text-white/55 leading-relaxed">
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
                                className="bg-[var(--surface-1)] p-8 rounded-[var(--radius-panel)] border border-[var(--line)] hover:border-[var(--accent)] transition-colors group"
                            >
                                <div className="w-12 h-12 bg-[var(--surface-2)] rounded-[var(--radius-card)] flex items-center justify-center mb-6 text-[var(--accent)] group-hover:scale-110 transition-transform">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-white/55">{item.desc}</p>
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
                        <div className="space-y-4 text-white/55">
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
                            <p className="text-white font-semibold">
                                We're not the biggest, but gaming runs in our veins. And we're just getting started.
                            </p>
                        </div>
                    </div>
                    <div className="relative h-[400px] rounded-[var(--radius-panel)] overflow-hidden border border-[var(--line)]">
                        {/* Gaming-themed visual background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface-1)] to-[var(--surface-2)]">
                            {/* Grid pattern overlay */}
                            <div className="absolute inset-0 opacity-5" style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }} />

                            {/* Glowing orbs */}
                            <div className="absolute top-10 left-10 w-32 h-32 bg-[var(--accent)]/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-20 right-20 w-40 h-40 bg-[var(--accent)]/10 rounded-full blur-3xl" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl" />

                            {/* Floating gaming icons */}
                            <motion.div
                                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-12 left-[15%]"
                            >
                                <div className="p-4 bg-[var(--surface-1)]/80 backdrop-blur-sm rounded-[var(--radius-panel)] border border-[var(--line)] shadow-lg">
                                    <Gamepad2 className="w-10 h-10 text-[var(--accent)]" />
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="absolute top-16 right-[20%]"
                            >
                                <div className="p-4 bg-[var(--surface-1)]/80 backdrop-blur-sm rounded-[var(--radius-panel)] border border-[var(--line)] shadow-lg">
                                    <Monitor className="w-10 h-10 text-white/45" />
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, -8, 0], rotate: [0, -3, 0] }}
                                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute top-1/3 left-[8%]"
                            >
                                <div className="p-3 bg-[var(--surface-1)]/80 backdrop-blur-sm rounded-[var(--radius-card)] border border-[var(--line)] shadow-lg">
                                    <Keyboard className="w-8 h-8 text-white/45" />
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 12, 0], rotate: [0, 8, 0] }}
                                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                                className="absolute top-1/4 right-[10%]"
                            >
                                <div className="p-3 bg-[var(--surface-1)]/80 backdrop-blur-sm rounded-[var(--radius-card)] border border-[var(--line)] shadow-lg">
                                    <Cpu className="w-8 h-8 text-white/45" />
                                </div>
                            </motion.div>

                            {/* Center logo/text */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[#FF7A3D]"
                                >
                                    TP
                                </motion.div>
                                <p className="text-sm text-white/35 mt-2 tracking-widest uppercase">Est. 2020</p>
                            </div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-transparent to-transparent"></div>

                        {/* Stats overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                            <div className="flex justify-around text-center">
                                <div>
                                    <div className="text-3xl font-black text-white">2020</div>
                                    <div className="text-xs text-white/35 uppercase tracking-wider">Founded</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-[var(--accent)]">0</div>
                                    <div className="text-xs text-white/35 uppercase tracking-wider">Sponsored Reviews</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white">∞</div>
                                    <div className="text-xs text-white/35 uppercase tracking-wider">Gaming Hours</div>
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
                    className="bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-panel)] p-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">What You'll Find Here</h2>
                            <p className="text-white/55 max-w-2xl mx-auto">
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
                                    className="bg-[var(--surface-1)] p-6 rounded-[var(--radius-panel)] border border-[var(--line)] hover:border-[var(--accent)] transition-colors"
                                >
                                    <h3 className="text-lg font-bold text-white mb-4">{category.title}</h3>
                                    <ul className="space-y-2">
                                        {category.items.map((item, i) => (
                                            <li key={i} className="text-sm text-white/55 flex items-start gap-2">
                                                <span className="text-[var(--accent)] mt-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-white/35 mb-6">
                                Questions? Suggestions? Think we missed something important?
                            </p>
                            <a
                                href="/contact"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-[var(--radius-card)] transition-colors"
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
