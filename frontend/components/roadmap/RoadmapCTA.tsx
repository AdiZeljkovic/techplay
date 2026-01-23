"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bell, Twitter, Youtube, Twitch, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RoadmapCTA() {
    const socialLinks = [
        { icon: Twitter, label: "Twitter", href: "https://twitter.com/techplaygg", color: "#1DA1F2" },
        { icon: Youtube, label: "YouTube", href: "https://youtube.com/@techplaygg", color: "#FF0000" },
        { icon: Twitch, label: "Twitch", href: "https://twitch.tv/techplaygg", color: "#9146FF" },
        { icon: MessageCircle, label: "Discord", href: "https://discord.gg/techplaygg", color: "#5865F2" },
    ];

    return (
        <section className="relative container mx-auto px-4 py-32 max-w-6xl overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)] opacity-10 blur-[150px] rounded-full" />
            </div>

            <div className="relative">
                {/* Main CTA card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative"
                >
                    {/* Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-blue-500 rounded-3xl opacity-20 blur-2xl" />

                    {/* Card content */}
                    <div className="relative bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-12 md:p-16 text-center">
                        {/* Icon */}
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 mb-8"
                        >
                            <Bell className="w-10 h-10 text-[var(--accent)]" />
                        </motion.div>

                        {/* Heading */}
                        <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
                            Stay Updated on Our Journey
                        </h2>

                        {/* Description */}
                        <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
                            Follow our progress and be the first to know when new features drop.
                            Join our community and help shape the future of TechPlay.
                        </p>

                        {/* Social links */}
                        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                            {socialLinks.map((social, index) => (
                                <motion.a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                    whileHover={{ scale: 1.1, y: -5 }}
                                    className="group relative"
                                >
                                    {/* Glow on hover */}
                                    <div
                                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
                                        style={{ backgroundColor: social.color }}
                                    />

                                    {/* Button */}
                                    <div className="relative flex items-center gap-3 px-6 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl group-hover:border-[var(--accent)]/50 transition-all duration-300">
                                        <social.icon
                                            className="w-5 h-5 transition-colors duration-300"
                                            style={{ color: social.color }}
                                        />
                                        <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-300">
                                            {social.label}
                                        </span>
                                    </div>
                                </motion.a>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                Or
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
                        </div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            <Button
                                size="lg"
                                className="group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Join the Community
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                                </span>

                                {/* Animated background */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-blue-500"
                                    animate={{
                                        x: ["0%", "100%"],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                />
                            </Button>
                        </motion.div>

                        {/* Bottom note */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7, duration: 0.6 }}
                            className="mt-8 text-sm text-[var(--text-muted)]"
                        >
                            Have suggestions or feedback? We'd love to hear from you!
                        </motion.p>
                    </div>
                </motion.div>

                {/* Decorative elements */}
                <motion.div
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -top-10 -left-10 w-20 h-20 border-2 border-[var(--accent)]/20 rounded-full"
                />
                <motion.div
                    animate={{
                        rotate: [360, 0],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -bottom-10 -right-10 w-32 h-32 border-2 border-purple-500/20 rounded-full"
                />
            </div>
        </section>
    );
}
