"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Download, Mail, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

interface StickyNavProps {
    contactEmail?: string;
    onDownloadPDF: () => void;
    onOpenPackageModal: () => void;
}

const navSections = [
    { id: "about", label: "About" },
    { id: "stats", label: "Statistics" },
    { id: "success", label: "Success Stories" },
    { id: "why-choose", label: "Why TechPlay" },
    { id: "calculator", label: "ROI Calculator" },
    { id: "pricing", label: "Pricing" },
    { id: "testimonials", label: "Testimonials" },
    { id: "contact", label: "Contact" },
];

export default function StickyNav({ contactEmail, onDownloadPDF, onOpenPackageModal }: StickyNavProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    // Show nav after scrolling past hero
    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 600);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: 'smooth'
            });
        }
        setMobileMenuOpen(false);
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: isVisible ? 0 : -100 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 bg-[#00112e]/95 backdrop-blur-xl
                         border-b border-white/[0.08] shadow-lg shadow-black/20"
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-orange-600
                                          flex items-center justify-center shadow-lg shadow-[var(--accent)]/25">
                                <span className="text-white text-sm font-black">TP</span>
                            </div>
                            <div>
                                <div className="text-sm font-black text-white">TechPlay</div>
                                <div className="text-xs text-white/50 font-semibold">Media Kit</div>
                            </div>
                        </motion.div>

                        {/* Desktop Nav Links */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -10 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="hidden lg:flex items-center gap-1"
                        >
                            {navSections.map((section, i) => (
                                <motion.button
                                    key={section.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -10 }}
                                    transition={{ duration: 0.3, delay: 0.2 + i * 0.03 }}
                                    onClick={() => scrollToSection(section.id)}
                                    className="px-3 py-2 text-sm font-semibold text-white/60
                                             hover:text-white hover:bg-white/[0.04]
                                             rounded-lg transition-all duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {section.label}
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="hidden md:flex items-center gap-3"
                        >
                            <motion.button
                                onClick={onDownloadPDF}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-2 px-5 py-2.5
                                         bg-white/[0.04] border border-white/[0.08]
                                         text-white text-sm font-bold rounded-xl
                                         hover:bg-white/[0.08] hover:border-white/[0.15]
                                         transition-all duration-300"
                            >
                                <Download className="w-4 h-4" />
                                <span>PDF</span>
                            </motion.button>

                            <motion.button
                                onClick={onOpenPackageModal}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-2 px-5 py-2.5
                                         bg-gradient-to-r from-[var(--accent)] to-orange-600
                                         text-white text-sm font-bold rounded-xl
                                         shadow-lg shadow-[var(--accent)]/25
                                         hover:shadow-xl hover:shadow-[var(--accent)]/40
                                         transition-shadow duration-300"
                            >
                                <Mail className="w-4 h-4" />
                                <span>Contact</span>
                            </motion.button>
                        </motion.div>

                        {/* Mobile menu button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isVisible ? 1 : 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08]
                                     flex items-center justify-center text-white
                                     hover:bg-white/[0.08] transition-colors duration-300"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </motion.button>
                    </div>
                </div>

                {/* Mobile menu */}
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                        height: mobileMenuOpen ? 'auto' : 0,
                        opacity: mobileMenuOpen ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="lg:hidden overflow-hidden bg-[#00112e] border-t border-white/[0.08]"
                >
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        {navSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className="w-full text-left px-4 py-3 text-sm font-semibold text-white/60
                                         hover:text-white hover:bg-white/[0.04]
                                         rounded-lg transition-all duration-300"
                            >
                                {section.label}
                            </button>
                        ))}
                        <div className="pt-4 space-y-2 border-t border-white/[0.08]">
                            <button
                                onClick={onDownloadPDF}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3
                                         bg-white/[0.04] border border-white/[0.08]
                                         text-white text-sm font-bold rounded-xl"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                            <button
                                onClick={onOpenPackageModal}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3
                                         bg-gradient-to-r from-[var(--accent)] to-orange-600
                                         text-white text-sm font-bold rounded-xl"
                            >
                                <Mail className="w-4 h-4" />
                                Get in Touch
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.nav>

            {/* Spacer when nav is visible (prevents content jump) */}
            {isVisible && <div className="h-20" />}
        </>
    );
}
