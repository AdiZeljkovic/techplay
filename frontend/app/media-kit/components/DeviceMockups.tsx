"use client";

import { motion } from "framer-motion";

export default function DeviceMockups() {
    return (
        <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "1200px" }}>
            {/* Ambient glow behind devices */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[70%] h-[60%] rounded-full bg-[var(--accent)]/[0.06] blur-[80px]" />
            </div>

            {/* === Laptop — Center, largest === */}
            <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-20"
            >
                <div className="relative w-[520px] h-[340px]"
                    style={{ transform: "rotateX(4deg) rotateY(-3deg)" }}>
                    {/* Laptop body */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#16162a]
                                   rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden">
                        {/* Bezel top */}
                        <div className="flex items-center justify-center py-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        </div>
                        {/* Screen area */}
                        <div className="mx-2 mb-2 rounded-lg overflow-hidden bg-[#0a0e1a] h-[calc(100%-40px)]
                                       border border-white/[0.04]">
                            {/* Screen content — stylized TechPlay UI */}
                            <div className="w-full h-full relative">
                                {/* Nav bar */}
                                <div className="h-8 bg-[#0d1220] flex items-center px-4 gap-2 border-b border-white/[0.04]">
                                    <span className="text-[var(--accent)] text-[10px] font-black tracking-wider">TECHPLAY</span>
                                    <div className="flex gap-2 ml-auto">
                                        <div className="w-8 h-1.5 rounded-full bg-white/10" />
                                        <div className="w-8 h-1.5 rounded-full bg-white/10" />
                                        <div className="w-8 h-1.5 rounded-full bg-white/10" />
                                        <div className="w-8 h-1.5 rounded-full bg-white/10" />
                                    </div>
                                </div>
                                {/* Hero area */}
                                <div className="p-4">
                                    <div className="h-24 rounded-lg bg-gradient-to-r from-[var(--accent)]/20 to-blue-500/10
                                                   border border-white/[0.04] flex items-center px-4 mb-3">
                                        <div className="space-y-1.5">
                                            <div className="w-28 h-2 rounded bg-white/20" />
                                            <div className="w-20 h-1.5 rounded bg-white/10" />
                                        </div>
                                    </div>
                                    {/* Card grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-16 rounded-lg bg-white/[0.03] border border-white/[0.04]
                                                                    flex flex-col items-center justify-center gap-1">
                                                <div className="w-6 h-6 rounded-md bg-[var(--accent)]/10" />
                                                <div className="w-10 h-1 rounded bg-white/10" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Screen glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/[0.03] via-transparent to-blue-500/[0.03] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    {/* Laptop base / hinge */}
                    <div className="absolute -bottom-1.5 left-[10%] right-[10%] h-2
                                   bg-gradient-to-b from-[#1a1a2e] to-[#0f0f20]
                                   rounded-b-xl border-x border-b border-white/[0.06]" />
                </div>
            </motion.div>

            {/* === Tablet — Right === */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute right-0 top-[10%] z-30"
                style={{ transform: "rotateY(-12deg) rotateX(3deg)" }}
            >
                <div className="relative w-[200px] h-[280px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#16162a]
                                   rounded-2xl border border-white/[0.08] shadow-xl shadow-blue-500/[0.08]
                                   overflow-hidden p-2">
                        <div className="w-full h-full rounded-xl bg-[#0a0e1a] border border-white/[0.04] overflow-hidden">
                            {/* Tablet screen content */}
                            <div className="p-3 space-y-2">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <span className="text-[var(--accent)] text-[8px] font-black">TP</span>
                                    <div className="w-4 h-1 rounded bg-white/10 ml-auto" />
                                </div>
                                <div className="h-16 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10
                                               border border-white/[0.04]" />
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-10 rounded bg-white/[0.03] border border-white/[0.04]" />
                                    ))}
                                </div>
                                <div className="h-8 rounded bg-white/[0.03] border border-white/[0.04]" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* === Phone — Left === */}
            <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute left-0 bottom-[5%] z-30"
                style={{ transform: "rotateY(10deg) rotateX(3deg)" }}
            >
                <div className="relative w-[140px] h-[280px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#16162a]
                                   rounded-[1.8rem] border border-white/[0.08] shadow-xl shadow-purple-500/[0.08]
                                   overflow-hidden p-2">
                        {/* Notch */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#1a1a2e] rounded-b-xl z-10
                                       border-b border-x border-white/[0.04]" />
                        <div className="w-full h-full rounded-[1.4rem] bg-[#0a0e1a] border border-white/[0.04] overflow-hidden">
                            {/* Phone screen content */}
                            <div className="pt-6 p-3 space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[var(--accent)] text-[7px] font-black">TECHPLAY</span>
                                    <div className="flex gap-0.5">
                                        <div className="w-1 h-1 rounded-full bg-white/20" />
                                        <div className="w-1 h-1 rounded-full bg-white/20" />
                                        <div className="w-1 h-1 rounded-full bg-white/20" />
                                    </div>
                                </div>
                                <div className="h-14 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10
                                               border border-white/[0.04]" />
                                <div className="space-y-1.5">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-8 rounded bg-white/[0.03] border border-white/[0.04]" />
                                    ))}
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.04] via-transparent to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
