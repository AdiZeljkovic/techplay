"use client";

import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function DiscordWidget() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#5865F2] p-6 text-white text-center group">

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/30 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 blur-[40px] rounded-full translate-y-1/2 -translate-x-1/2" />

            {/* Animated Icon */}
            <motion.div
                className="relative z-10 mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <MessageSquare className="w-8 h-8 text-white fill-white" />
            </motion.div>

            <h3 className="relative z-10 text-xl font-bold mb-1">Join Our Discord</h3>
            <p className="relative z-10 text-white/80 text-sm mb-6 max-w-[200px] mx-auto leading-relaxed">
                Connect with 50,000+ gamers. Exclusive drops & community events.
            </p>

            <a
                href="https://discord.gg/wPQG9gUMXH"
                target="_blank"
                className="relative z-10 flex items-center justify-center gap-2 w-full py-3 bg-white text-[#5865F2] font-bold rounded-xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20"
            >
                Join Server
            </a>
        </div>
    );
}
