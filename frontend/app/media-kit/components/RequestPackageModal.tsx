"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mail, Building2, User, MessageSquare, DollarSign, Target } from "lucide-react";
import { useState } from "react";

interface RequestPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactEmail?: string;
}

export default function RequestPackageModal({ isOpen, onClose, contactEmail }: RequestPackageModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        budget: "",
        objective: "",
        message: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create mailto link with form data
        const subject = `Media Kit Request from ${formData.name}`;
        const body = `
Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Budget: ${formData.budget}
Objective: ${formData.objective}

Message:
${formData.message}
        `.trim();

        window.location.href = `mailto:${contactEmail || 'marketing@techplay.gg'}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        setIsSubmitting(false);
        setSubmitted(true);

        setTimeout(() => {
            setSubmitted(false);
            setFormData({
                name: "",
                email: "",
                company: "",
                budget: "",
                objective: "",
                message: ""
            });
            onClose();
        }, 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
                                     bg-[#001540] rounded-3xl border border-white/[0.12]
                                     shadow-2xl shadow-black/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 w-10 h-10 rounded-xl
                                         bg-white/[0.04] border border-white/[0.08]
                                         flex items-center justify-center text-white/60
                                         hover:bg-white/[0.08] hover:text-white
                                         transition-all duration-300 z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 md:p-12">
                                {!submitted ? (
                                    <>
                                        {/* Header */}
                                        <div className="mb-8">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-orange-600
                                                         flex items-center justify-center shadow-lg shadow-[var(--accent)]/25 mb-6"
                                            >
                                                <Mail className="w-8 h-8 text-white" />
                                            </motion.div>
                                            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                                                Request Custom Package
                                            </h2>
                                            <p className="text-white/60 leading-relaxed">
                                                Tell us about your campaign goals and we'll create a tailored media plan
                                                with custom pricing and placement options.
                                            </p>
                                        </div>

                                        {/* Form */}
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div className="grid md:grid-cols-2 gap-5">
                                                {/* Name */}
                                                <div>
                                                    <label className="block text-sm font-bold text-white/80 mb-2">
                                                        Your Name *
                                                    </label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            placeholder="John Doe"
                                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl
                                                                     bg-white/[0.04] border border-white/[0.08]
                                                                     text-white placeholder:text-white/30
                                                                     focus:bg-white/[0.06] focus:border-[var(--accent)]/50
                                                                     outline-none transition-all duration-300"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Email */}
                                                <div>
                                                    <label className="block text-sm font-bold text-white/80 mb-2">
                                                        Email Address *
                                                    </label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                        <input
                                                            type="email"
                                                            required
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            placeholder="john@company.com"
                                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl
                                                                     bg-white/[0.04] border border-white/[0.08]
                                                                     text-white placeholder:text-white/30
                                                                     focus:bg-white/[0.06] focus:border-[var(--accent)]/50
                                                                     outline-none transition-all duration-300"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Company */}
                                                <div>
                                                    <label className="block text-sm font-bold text-white/80 mb-2">
                                                        Company
                                                    </label>
                                                    <div className="relative">
                                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                        <input
                                                            type="text"
                                                            value={formData.company}
                                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                            placeholder="Your Company"
                                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl
                                                                     bg-white/[0.04] border border-white/[0.08]
                                                                     text-white placeholder:text-white/30
                                                                     focus:bg-white/[0.06] focus:border-[var(--accent)]/50
                                                                     outline-none transition-all duration-300"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Budget */}
                                                <div>
                                                    <label className="block text-sm font-bold text-white/80 mb-2">
                                                        Budget Range
                                                    </label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                        <select
                                                            value={formData.budget}
                                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl
                                                                     bg-white/[0.04] border border-white/[0.08]
                                                                     text-white
                                                                     focus:bg-white/[0.06] focus:border-[var(--accent)]/50
                                                                     outline-none transition-all duration-300 appearance-none
                                                                     cursor-pointer"
                                                        >
                                                            <option value="" className="bg-[#001540]">Select budget range</option>
                                                            <option value="<5k" className="bg-[#001540]">Less than $5,000</option>
                                                            <option value="5k-10k" className="bg-[#001540]">$5,000 - $10,000</option>
                                                            <option value="10k-25k" className="bg-[#001540]">$10,000 - $25,000</option>
                                                            <option value="25k-50k" className="bg-[#001540]">$25,000 - $50,000</option>
                                                            <option value="50k+" className="bg-[#001540]">$50,000+</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Objective */}
                                            <div>
                                                <label className="block text-sm font-bold text-white/80 mb-2">
                                                    Campaign Objective
                                                </label>
                                                <div className="relative">
                                                    <Target className="absolute left-4 top-4 w-4 h-4 text-white/40" />
                                                    <select
                                                        value={formData.objective}
                                                        onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl
                                                                 bg-white/[0.04] border border-white/[0.08]
                                                                 text-white
                                                                 focus:bg-white/[0.06] focus:border-[var(--accent)]/50
                                                                 outline-none transition-all duration-300 appearance-none
                                                                 cursor-pointer"
                                                    >
                                                        <option value="" className="bg-[#001540]">Select objective</option>
                                                        <option value="brand-awareness" className="bg-[#001540]">Brand Awareness</option>
                                                        <option value="product-launch" className="bg-[#001540]">Product Launch</option>
                                                        <option value="lead-generation" className="bg-[#001540]">Lead Generation</option>
                                                        <option value="sales" className="bg-[#001540]">Drive Sales</option>
                                                        <option value="engagement" className="bg-[#001540]">Engagement</option>
                                                        <option value="other" className="bg-[#001540]">Other</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Message */}
                                            <div>
                                                <label className="block text-sm font-bold text-white/80 mb-2">
                                                    Additional Details
                                                </label>
                                                <div className="relative">
                                                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-white/40" />
                                                    <textarea
                                                        value={formData.message}
                                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                        placeholder="Tell us more about your campaign, target audience, timeline, or any specific requirements..."
                                                        rows={4}
                                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl
                                                                 bg-white/[0.04] border border-white/[0.08]
                                                                 text-white placeholder:text-white/30
                                                                 focus:bg-white/[0.06] focus:border-[var(--accent)]/50
                                                                 outline-none transition-all duration-300 resize-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Submit button */}
                                            <motion.button
                                                type="submit"
                                                disabled={isSubmitting}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full flex items-center justify-center gap-3 px-8 py-4
                                                         bg-gradient-to-r from-[var(--accent)] to-orange-600
                                                         text-white text-lg font-bold rounded-2xl
                                                         shadow-lg shadow-[var(--accent)]/25
                                                         hover:shadow-xl hover:shadow-[var(--accent)]/40
                                                         transition-shadow duration-500
                                                         disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                        />
                                                        <span>Sending...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        <span>Send Request</span>
                                                    </>
                                                )}
                                            </motion.button>
                                        </form>
                                    </>
                                ) : (
                                    // Success state
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", duration: 0.6 }}
                                            className="w-20 h-20 rounded-full bg-green-500/20 border-4 border-green-500
                                                     flex items-center justify-center mx-auto mb-6"
                                        >
                                            <motion.svg
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.6, delay: 0.3 }}
                                                className="w-10 h-10 text-green-500"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                viewBox="0 0 24 24"
                                            >
                                                <motion.path
                                                    d="M5 13l4 4L19 7"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </motion.svg>
                                        </motion.div>
                                        <h3 className="text-2xl font-black text-white mb-3">Request Sent!</h3>
                                        <p className="text-white/60">
                                            We'll get back to you within 24 hours with a custom proposal.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
