"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AnalysisProgressProps {
    stage: string;
}

export default function AnalysisProgress({ stage }: AnalysisProgressProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center"
        >
            <Loader2 className="w-16 h-16 text-[var(--accent)] mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                {stage}
            </h3>
            <p className="text-[var(--text-muted)]">
                This may take a few seconds...
            </p>

            <div className="mt-8 max-w-md mx-auto">
                <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
