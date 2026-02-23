"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function DeviceMockups() {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Desktop/Laptop - Center, Large */}
            <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative z-20"
                style={{ perspective: "1000px" }}
            >
                <div className="relative w-[700px] h-[450px]">
                    {/* Laptop Frame */}
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3
                                   shadow-2xl border-2 border-gray-700"
                        style={{
                            transform: "rotateX(5deg) rotateY(-2deg)",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(252, 65, 0, 0.3)"
                        }}
                    >
                        {/* Screen */}
                        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-gray-800">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 via-transparent to-blue-500/20" />

                            {/* Placeholder for screenshot - replace with actual TechPlay screenshot */}
                            <div className="relative w-full h-full bg-[#0a0e1a] flex items-center justify-center">
                                <div className="text-center space-y-4">
                                    <div className="text-6xl font-black text-[var(--accent)]">TechPlay</div>
                                    <div className="text-sm text-gray-400">Desktop Experience</div>
                                    {/* Grid background */}
                                    <div
                                        className="absolute inset-0 opacity-10"
                                        style={{
                                            backgroundImage: `
                                                linear-gradient(rgba(252, 65, 0, 0.3) 1px, transparent 1px),
                                                linear-gradient(90deg, rgba(252, 65, 0, 0.3) 1px, transparent 1px)
                                            `,
                                            backgroundSize: '30px 30px',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Screen reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        </div>

                        {/* Webcam notch */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rounded-full border border-gray-700" />
                    </div>

                    {/* Laptop base */}
                    <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[720px] h-4 bg-gradient-to-b from-gray-700 to-gray-800
                                   rounded-b-2xl shadow-xl"
                        style={{ transform: "perspective(1000px) rotateX(60deg)" }}
                    />
                </div>
            </motion.div>

            {/* Tablet - Right side */}
            <motion.div
                initial={{ opacity: 0, x: 100, rotateY: -20 }}
                animate={{ opacity: 1, x: 0, rotateY: -15 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="absolute right-[5%] top-[15%] z-30"
                style={{ perspective: "1000px" }}
            >
                <div className="relative w-[280px] h-[380px]">
                    {/* Tablet Frame */}
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-3
                                   shadow-2xl border-2 border-gray-700"
                        style={{
                            transform: "rotateY(-15deg) rotateX(5deg)",
                            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)"
                        }}
                    >
                        {/* Screen */}
                        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden border border-gray-800">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20" />

                            <div className="relative w-full h-full bg-[#0a0e1a] flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <div className="text-4xl font-black text-blue-400">TechPlay</div>
                                    <div className="text-xs text-gray-400">Tablet View</div>
                                </div>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        </div>

                        {/* Home button */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-full" />
                    </div>
                </div>
            </motion.div>

            {/* Mobile Phone - Left side */}
            <motion.div
                initial={{ opacity: 0, x: -100, rotateY: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: 15 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="absolute left-[8%] top-[25%] z-30"
                style={{ perspective: "1000px" }}
            >
                <div className="relative w-[180px] h-[360px]">
                    {/* Phone Frame */}
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] p-3
                                   shadow-2xl border-2 border-gray-700"
                        style={{
                            transform: "rotateY(15deg) rotateX(5deg)",
                            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)"
                        }}
                    >
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10" />

                        {/* Screen */}
                        <div className="relative w-full h-full bg-black rounded-[2rem] overflow-hidden border border-gray-800">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20" />

                            <div className="relative w-full h-full bg-[#0a0e1a] flex items-center justify-center">
                                <div className="text-center space-y-2 mt-8">
                                    <div className="text-2xl font-black text-purple-400">TechPlay</div>
                                    <div className="text-xs text-gray-400">Mobile App</div>
                                </div>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        </div>
                    </div>

                    {/* Power button */}
                    <div className="absolute right-0 top-24 w-1 h-12 bg-gray-700 rounded-l" />
                </div>
            </motion.div>

            {/* Floating elements around devices */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[10%] right-[25%] w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--accent)] to-orange-600
                         shadow-lg shadow-[var(--accent)]/50 flex items-center justify-center z-10"
            >
                <span className="text-2xl">🎮</span>
            </motion.div>

            <motion.div
                animate={{
                    y: [0, 20, 0],
                    rotate: [0, -5, 0],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute bottom-[20%] left-[20%] w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600
                         shadow-lg shadow-blue-500/50 flex items-center justify-center z-10"
            >
                <span className="text-3xl">⚡</span>
            </motion.div>
        </div>
    );
}
