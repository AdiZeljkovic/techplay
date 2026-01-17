"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Target, Zap, Heart, Globe, Shield, Users } from "lucide-react";

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
                title="About Us"
                description="Fueling the passion for gaming and technology since 2024."
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
                    <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        At TechPlay, we believe that gaming and technology are more than just hobbies—they are a lifestyle.
                        Our mission is to provide in-depth, unbiased, and entertaining coverage of the latest trends,
                        hardware releases, and game developments. We strive to build a community where every gamer,
                        from casual to hardcore, feels at home.
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
                            { icon: Target, title: "Accuracy", desc: "We prioritize facts and thorough testing in all our reviews and news." },
                            { icon: Heart, title: "Passion", desc: "Driven by a genuine love for the craft, we put our heart into every article." },
                            { icon: Users, title: "Community", desc: "Our readers are our heartbeat. We listen, engage, and grow together." },
                            { icon: Zap, title: "Innovation", desc: "Always looking ahead, we embrace the cutting edge of tech evolution." },
                            { icon: Shield, title: "Integrity", desc: "Our opinions are our own. Unbought, unbossed, and honest." },
                            { icon: Globe, title: "Inclusivity", desc: "Gaming is for everyone. We foster a welcoming space for all." },
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
                                Founded in Sarajevo by a group of tech enthusiasts and hardcore gamers, TechPlay started as a small blog
                                covering local LAN parties.
                            </p>
                            <p>
                                Today, we have grown into a premier destination for tech news in the region, bringing you exclusive coverage
                                from major global events and hands-on reviews of the latest gear.
                            </p>
                            <p>
                                Whatever the future holds for technology, we promise to be there, controller in hand, ready to explore new worlds with you.
                            </p>
                        </div>
                    </div>
                    <div className="relative h-[300px] rounded-3xl overflow-hidden border border-[var(--border)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-purple-900 opacity-20"></div>
                        {/* Placeholder for an office image or team photo */}
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]">
                            <Users className="w-24 h-24 text-[var(--border)] opacity-50" />
                        </div>
                    </div>
                </motion.section>

            </div>
        </div>
    );
}
