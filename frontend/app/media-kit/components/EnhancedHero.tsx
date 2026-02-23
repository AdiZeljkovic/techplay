"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { Mail, Download, Sparkles, TrendingUp, Users, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import DeviceMockups from "./DeviceMockups";

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
}

interface FloatingStatProps {
    icon: any;
    value: string;
    label: string;
    delay: number;
    x: string;
    y: string;
}

function FloatingStat({ icon: Icon, value, label, delay, x, y }: FloatingStatProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0],
                y: [0, -20, -40, -60],
            }}
            transition={{
                duration: 4,
                delay,
                repeat: Infinity,
                repeatDelay: 2,
            }}
            className="absolute pointer-events-none"
            style={{ left: x, top: y }}
        >
            <div className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--accent)]/30
                          rounded-2xl p-4 shadow-2xl shadow-[var(--accent)]/20">
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-[var(--accent)]" />
                    <div>
                        <div className="text-2xl font-black text-[var(--text-primary)]">{value}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{label}</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function EnhancedHero({ contactEmail, onDownloadPDF }: { contactEmail?: string; onDownloadPDF: () => void }) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Parallax effect
    const parallaxX = useTransform(mouseX, [0, window.innerWidth], [-20, 20]);
    const parallaxY = useTransform(mouseY, [0, window.innerHeight], [-20, 20]);

    useEffect(() => {
        // Generate particles
        const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * 5,
        }));
        setParticles(newParticles);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    return (
        <section
            className="relative h-[100vh] overflow-hidden flex items-center justify-center"
            onMouseMove={handleMouseMove}
        >
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-[var(--bg-primary)]">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(252, 65, 0, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(252, 65, 0, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            {/* Animated Particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-[var(--accent)]"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0, 0.6, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Large Gradient Orbs */}
            <motion.div
                className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(252, 65, 0, 0.15) 0%, transparent 70%)',
                    x: parallaxX,
                    y: parallaxY,
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    x: useTransform(parallaxX, (x) => -x),
                    y: useTransform(parallaxY, (y) => -y),
                }}
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 10,
                    delay: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />


            {/* Device Mockups - Top Section */}
            <div className="absolute top-[10%] left-0 right-0 z-20 h-[60%]">
                <DeviceMockups />
            </div>

            {/* Main Content - Bottom Section */}
            <div className="absolute bottom-[5%] left-0 right-0 z-30">
                <div className="container mx-auto px-4 text-center">
                    {/* Logo/Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="mb-6"
                    >
                        <div className="inline-flex items-center gap-3 bg-[var(--bg-card)]/90 backdrop-blur-md
                                      border border-[var(--accent)]/30 rounded-2xl px-8 py-4 shadow-2xl">
                            <motion.div
                                animate={{
                                    rotate: [0, 360],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                }}
                            >
                                <Sparkles className="w-8 h-8 text-[var(--accent)]" />
                            </motion.div>
                            <h1 className="text-4xl md:text-5xl font-black">
                                <span className="text-[var(--text-primary)]">Advertising on </span>
                                <motion.span
                                    className="text-[var(--accent)]"
                                    animate={{
                                        textShadow: [
                                            "0 0 20px rgba(252, 65, 0, 0.5)",
                                            "0 0 40px rgba(252, 65, 0, 0.8)",
                                            "0 0 20px rgba(252, 65, 0, 0.5)",
                                        ],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    TechPlay
                                </motion.span>
                            </h1>
                        </div>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="text-lg md:text-xl text-[var(--text-secondary)] mb-8 max-w-3xl mx-auto leading-relaxed"
                    >
                        Reach{" "}
                        <span className="text-[var(--accent)] font-bold">
                            engaged gaming & tech enthusiasts
                        </span>
                        {" "}worldwide with premium ad placements
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="flex flex-col md:flex-row gap-4 justify-center items-center"
                    >
                    <motion.a
                        href={`mailto:${contactEmail || 'advertising@techplay.gg'}`}
                        className="group relative inline-flex items-center gap-2 px-10 py-5 bg-[var(--accent)]
                                 text-white font-bold rounded-2xl overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                        <Mail className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform" />
                        <span className="relative z-10 text-lg">Get in Touch</span>
                    </motion.a>

                    <motion.button
                        onClick={onDownloadPDF}
                        className="group inline-flex items-center gap-2 px-10 py-5 bg-[var(--bg-card)]
                                 border-2 border-[var(--accent)] text-[var(--text-primary)] font-bold rounded-2xl
                                 hover:bg-[var(--accent)] hover:text-white transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                        <span className="text-lg">Download Media Kit</span>
                    </motion.button>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40"
            >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-6 h-10 border-2 border-[var(--accent)] rounded-full flex items-start justify-center p-2"
                    >
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full"
                        />
                    </motion.div>
                </motion.div>

            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-[var(--accent)]/30 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-[var(--accent)]/30 rounded-br-3xl" />
        </section>
    );
}
