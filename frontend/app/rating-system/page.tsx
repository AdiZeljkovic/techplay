"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Star, Monitor, Gamepad2, Volume2, History, RotateCcw, AlertTriangle, Trophy, Medal, ThumbsUp, ThumbsDown, Meh, Zap, Crosshair, BarChart3 } from "lucide-react";

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
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

const ScoreCard = ({ score, title, description, color, bgGradient, icon: Icon }: any) => (
    <motion.div
        variants={fadeInUp}
        className={`group relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 hover:border-[var(--accent)] transition-all duration-300`}
    >
        {/* Background glow */}
        <div className={`absolute -top-10 -right-10 w-40 h-40 ${color} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`} />

        <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
                <span className={`text-4xl font-black ${color} block mb-1`}>{score}</span>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${bgGradient} flex items-center justify-center text-white shadow-lg transform group-hover:rotate-6 transition-transform`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>

        <div className="w-full h-1 bg-[var(--bg-elevated)] rounded-full mb-4 overflow-hidden">
            <div className={`h-full ${color.replace('text-', 'bg-')} bg-current opacity-50`} style={{ width: score === '10' ? '100%' : score === '9' ? '90%' : score === '8' ? '80%' : score === '7' ? '70%' : '40%' }} />
        </div>

        <p className="text-[var(--text-secondary)] leading-relaxed font-medium relative z-10">
            {description}
        </p>
    </motion.div>
);

export default function RatingSystemPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Our Rating System"
                description="Transparency in how we play, test, and score the games you love."
                icon={Star}
            />

            <div className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">

                {/* Visual Intro */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="relative mb-24 text-center max-w-4xl mx-auto"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[100px] -z-10" />

                    <span className="inline-block py-1 px-3 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold uppercase tracking-wider mb-6">
                        The TechPlay Standard
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                        More Than Just a Number
                    </h2>
                    <p className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
                        We don't use complicated algorithms. Our 1-10 scale represents a gut check backed by rigorous analysis.
                        It's about the <span className="text-[var(--text-primary)] font-bold">experience</span>, not just the technicalities.
                    </p>
                </motion.div>

                {/* The Scale Details */}
                <div className="mb-32">
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <ScoreCard
                            score="10"
                            title="Masterpiece"
                            description="Defining moments in gaming history. Essential for everyone. While not technically 'perfect', it represents the absolute peak of the medium."
                            color="text-cyan-400"
                            bgGradient="bg-gradient-to-br from-cyan-400 to-blue-600"
                            icon={Trophy}
                        />
                        <ScoreCard
                            score="9"
                            title="Amazing"
                            description="An exceptional experience with only minor flaws that don't hinder overall enjoyment. A must-play title."
                            color="text-emerald-400"
                            bgGradient="bg-gradient-to-br from-emerald-400 to-green-600"
                            icon={Medal}
                        />
                        <ScoreCard
                            score="8"
                            title="Great"
                            description="A very good game worth your time and money. Accompishes its goals with style but may lack that final spark of genius."
                            color="text-green-400"
                            bgGradient="bg-gradient-to-br from-green-400 to-emerald-600"
                            icon={ThumbsUp}
                        />
                        <ScoreCard
                            score="7"
                            title="Good"
                            description="A solid experience. Fans of the genre will essentially enjoy it, despite a lack of polish or innovation."
                            color="text-yellow-400"
                            bgGradient="bg-gradient-to-br from-yellow-400 to-orange-500"
                            icon={Zap}
                        />
                        <ScoreCard
                            score="5-6"
                            title="Average"
                            description="It works, but fails to leave a lasting impression. Functionally competent but creatively stagnant."
                            color="text-orange-400"
                            bgGradient="bg-gradient-to-br from-orange-400 to-red-500"
                            icon={Meh}
                        />
                        <ScoreCard
                            score="1-4"
                            title="Poor / Broken"
                            description="Ranges from 'needs major work' to 'fundamentally broken'. Avoid unless you have a specific morbid curiosity."
                            color="text-red-500"
                            bgGradient="bg-gradient-to-br from-red-500 to-pink-600"
                            icon={ThumbsDown}
                        />
                    </motion.div>
                </div>

                {/* The 5 Pillars Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="relative bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[3rem] p-10 md:p-20 overflow-hidden"
                >
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />

                    <div className="relative z-10 text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] mb-6">The 5 Pillars</h2>
                        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg">
                            Every game is deconstructed into five core components that inform our final verdict.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
                        {[
                            {
                                icon: Gamepad2,
                                title: "Gameplay",
                                desc: "Mechanics, controls, and game feel.",
                                color: "text-purple-400"
                            },
                            {
                                icon: Monitor,
                                title: "Visuals",
                                desc: "Art direction, fidelity, and polish.",
                                color: "text-blue-400"
                            },
                            {
                                icon: Volume2,
                                title: "Audio",
                                desc: "Sound design, music score, acting.",
                                color: "text-cyan-400"
                            },
                            {
                                icon: History,
                                title: "Narrative",
                                desc: "Story, pacing, and characters.",
                                color: "text-emerald-400"
                            },
                            {
                                icon: RotateCcw,
                                title: "Replayability",
                                desc: "Value, longevity, and endgame.",
                                color: "text-orange-400"
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="text-center group"
                            >
                                <div className={`w-20 h-20 mx-auto bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] flex items-center justify-center ${item.color} shadow-lg mb-6 group-hover:scale-110 group-hover:border-[var(--accent)] transition-all duration-300`}>
                                    <item.icon className="w-10 h-10" />
                                </div>
                                <h3 className="font-bold text-xl text-[var(--text-primary)] mb-2">{item.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Disclaimer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 flex justify-center"
                >
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-full px-8 py-3 flex items-center gap-3 shadow-lg">
                        <AlertTriangle className="w-5 h-5 text-[var(--accent)]" />
                        <p className="text-sm font-medium text-[var(--text-secondary)]">
                            <span className="text-[var(--text-primary)] font-bold">Note:</span> Reviews reflect the subjective experience of the reviewer.
                        </p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
