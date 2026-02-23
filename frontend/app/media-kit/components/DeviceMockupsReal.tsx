"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function DeviceMockupsReal() {
    return (
        <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "1500px" }}>
            {/* Ambient glow behind devices */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] h-[70%] rounded-full bg-[var(--accent)]/[0.08] blur-[100px]" />
                <div className="absolute w-[60%] h-[60%] rounded-full bg-blue-500/[0.06] blur-[80px]" />
            </div>

            {/* === Laptop — Center, largest === */}
            <motion.div
                animate={{
                    y: [0, -10, 0],
                    rotateY: [-3, -1, -3],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-20"
            >
                <div className="relative w-[540px] h-[350px]"
                    style={{
                        transform: "rotateX(5deg) rotateY(-2deg)",
                        transformStyle: "preserve-3d"
                    }}>
                    {/* Laptop body with premium materials */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c2e] via-[#18182a] to-[#14141f]
                                   rounded-xl border border-white/[0.12] shadow-2xl overflow-hidden">
                        {/* Screen bezel with camera */}
                        <div className="flex items-center justify-center py-2 bg-gradient-to-b from-black/40 to-transparent">
                            <div className="w-2 h-2 rounded-full bg-white/[0.08] ring-1 ring-white/5" />
                        </div>
                        {/* Screen area with real TechPlay design */}
                        <div className="mx-2.5 mb-2.5 rounded-lg overflow-hidden bg-[#0a0e1a] h-[calc(100%-44px)]
                                       border border-white/[0.06] relative">
                            {/* Real TechPlay UI */}
                            <div className="w-full h-full relative bg-[#001540]">
                                {/* Navigation bar - exact TechPlay style */}
                                <div className="h-12 bg-[#00112e]/95 backdrop-blur-xl flex items-center px-6 gap-6
                                               border-b border-white/[0.04] relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                                            <span className="text-white text-[9px] font-black">TP</span>
                                        </div>
                                        <span className="text-white text-xs font-black tracking-tight">TechPlay</span>
                                    </div>
                                    <div className="flex gap-5 text-[9px] text-white/60 font-semibold">
                                        <span className="hover:text-white transition-colors">Articles</span>
                                        <span className="hover:text-white transition-colors">Reviews</span>
                                        <span className="hover:text-white transition-colors">Guides</span>
                                        <span className="text-[var(--accent)]">Media Kit</span>
                                    </div>
                                </div>

                                {/* Hero section with gradient */}
                                <div className="p-6 relative">
                                    <div className="relative h-32 rounded-2xl overflow-hidden mb-4 group">
                                        {/* Gradient background */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/20 via-orange-500/10 to-blue-500/20" />
                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
                                        <div className="relative h-full flex flex-col justify-center px-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="px-2 py-0.5 bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-md">
                                                    <span className="text-[var(--accent)] text-[7px] font-bold">FEATURED</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="w-40 h-2.5 rounded bg-white/80" />
                                                <div className="w-32 h-1.5 rounded bg-white/40" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Article grid - TechPlay style cards */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { color: 'from-blue-500/20 to-cyan-500/10', tag: 'REVIEW' },
                                            { color: 'from-purple-500/20 to-pink-500/10', tag: 'GUIDE' },
                                            { color: 'from-orange-500/20 to-red-500/10', tag: 'NEWS' }
                                        ].map((item, i) => (
                                            <div key={i} className="group">
                                                <div className="relative h-20 rounded-xl overflow-hidden mb-2
                                                               bg-white/[0.02] border border-white/[0.06]
                                                               hover:border-white/[0.12] transition-all duration-300">
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
                                                    <div className="relative h-full p-2 flex flex-col justify-end">
                                                        <div className="px-1.5 py-0.5 bg-black/40 backdrop-blur-sm
                                                                      rounded w-fit border border-white/10">
                                                            <span className="text-white text-[6px] font-bold">{item.tag}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="w-full h-1.5 rounded bg-white/20" />
                                                    <div className="w-3/4 h-1 rounded bg-white/10" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Screen glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/[0.04] via-transparent to-blue-500/[0.04] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    {/* Laptop base with depth */}
                    <div className="absolute -bottom-2 left-[8%] right-[8%] h-2.5
                                   bg-gradient-to-b from-[#1c1c2e] via-[#14141f] to-[#0a0a10]
                                   rounded-b-xl border-x border-b border-white/[0.08]
                                   shadow-xl"
                         style={{ transform: "translateZ(-10px)" }} />
                </div>
            </motion.div>

            {/* === Tablet — Right === */}
            <motion.div
                animate={{
                    y: [0, 12, 0],
                    rotateY: [-12, -10, -12],
                }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute right-[5%] top-[8%] z-30"
                style={{
                    transform: "rotateY(-12deg) rotateX(4deg)",
                    transformStyle: "preserve-3d"
                }}
            >
                <div className="relative w-[220px] h-[300px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c2e] to-[#14141f]
                                   rounded-[1.2rem] border border-white/[0.1]
                                   shadow-2xl shadow-blue-500/[0.15] overflow-hidden p-2.5">
                        <div className="w-full h-full rounded-xl bg-[#001540] border border-white/[0.06] overflow-hidden relative">
                            {/* Tablet content */}
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-md bg-[var(--accent)] flex items-center justify-center">
                                            <span className="text-white text-[7px] font-black">TP</span>
                                        </div>
                                        <span className="text-white text-[9px] font-bold">TechPlay</span>
                                    </div>
                                    <div className="w-5 h-1 rounded bg-white/10" />
                                </div>

                                <div className="h-20 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/10
                                               border border-white/[0.06] p-3 flex flex-col justify-end">
                                    <div className="w-16 h-1.5 rounded bg-white/30 mb-1" />
                                    <div className="w-12 h-1 rounded bg-white/20" />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-14 rounded-lg bg-white/[0.03] border border-white/[0.05] p-2">
                                            <div className="w-full h-3 rounded bg-white/10 mb-1.5" />
                                            <div className="w-3/4 h-1.5 rounded bg-white/5" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] to-purple-500/[0.03] pointer-events-none" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* === Phone — Left === */}
            <motion.div
                animate={{
                    y: [0, -14, 0],
                    rotateY: [10, 12, 10],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute left-[5%] bottom-[8%] z-30"
                style={{
                    transform: "rotateY(10deg) rotateX(4deg)",
                    transformStyle: "preserve-3d"
                }}
            >
                <div className="relative w-[150px] h-[300px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c2e] to-[#14141f]
                                   rounded-[2rem] border border-white/[0.1]
                                   shadow-2xl shadow-purple-500/[0.15] overflow-hidden p-2">
                        {/* Dynamic Island / Notch */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0a0a10]
                                       rounded-full z-10 border border-white/[0.06] flex items-center justify-center gap-2 px-3">
                            <div className="w-1 h-1 rounded-full bg-purple-500/60" />
                            <div className="flex-1 h-[2px] bg-white/5 rounded-full" />
                        </div>

                        <div className="w-full h-full rounded-[1.6rem] bg-[#001540] border border-white/[0.06] overflow-hidden relative">
                            {/* Phone content */}
                            <div className="pt-8 p-3 space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[var(--accent)] text-[8px] font-black tracking-tight">TECHPLAY</span>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-white/30" />
                                        <div className="w-1 h-1 rounded-full bg-white/30" />
                                        <div className="w-1 h-1 rounded-full bg-white/30" />
                                    </div>
                                </div>

                                <div className="h-18 rounded-xl bg-gradient-to-br from-pink-500/15 to-orange-500/10
                                               border border-white/[0.06] p-2.5 flex flex-col justify-end">
                                    <div className="px-1.5 py-0.5 bg-[var(--accent)]/20 rounded-md w-fit mb-1.5">
                                        <span className="text-[var(--accent)] text-[6px] font-bold">TRENDING</span>
                                    </div>
                                    <div className="w-16 h-1.5 rounded bg-white/30 mb-0.5" />
                                    <div className="w-12 h-1 rounded bg-white/15" />
                                </div>

                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/10" />
                                            <div className="flex-1 space-y-1">
                                                <div className="w-full h-1.5 rounded bg-white/20" />
                                                <div className="w-3/4 h-1 rounded bg-white/10" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.05] to-pink-500/[0.03] pointer-events-none" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Floating particles for depth */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-white/10"
                    style={{
                        left: `${15 + Math.random() * 70}%`,
                        top: `${10 + Math.random() * 80}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: 5 + Math.random() * 3,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}
