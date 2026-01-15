import { Button } from "@/components/ui/Button";
import { Lock } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}

export default function LimitModal({
    isOpen,
    onClose,
    title = "Join TechPlay to Continue",
    description = "You've reached your free search limit for today. Create a free account to unlock unlimited access to our game database and release calendar."
}: LimitModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
                <div
                    className="absolute inset-0"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-[var(--accent)]" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3">
                            {title}
                        </h3>

                        <p className="text-[var(--text-secondary)] mb-8">
                            {description}
                        </p>

                        <div className="flex flex-col gap-3">
                            <Link href="/register" className="w-full">
                                <Button className="w-full justify-center">
                                    Create Free Account
                                </Button>
                            </Link>

                            <Link href="/login" className="w-full">
                                <Button variant="outline" className="w-full justify-center">
                                    Sign In
                                </Button>
                            </Link>

                            <button
                                onClick={onClose}
                                className="text-sm text-[var(--text-muted)] hover:text-white mt-2 transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
