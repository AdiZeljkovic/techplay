"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageSquare, Briefcase, HelpCircle, ArrowRight, CheckCircle2, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useState, FormEvent } from "react";

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
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

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSent(true);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Get in Touch"
                description="Have a question, suggestion, or just want to say hi? We'd love to hear from you."
            />

            <div className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

                    {/* Left Column: Contact Info & Departments */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <motion.div variants={fadeInUp} className="mb-12">
                            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">Contact Information</h2>
                            <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-8">
                                Whether you're a reader with a tip, a developer wanting your game reviewed, or a brand looking to partner,
                                we're here to help. Choose the right department below for the fastest response.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl group hover:border-[var(--accent)] transition-colors">
                                    <div className="p-3 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)] group-hover:scale-110 transition-transform">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1">General & Editorial</h3>
                                        <p className="text-[var(--text-secondary)] text-sm mb-2">For news tips, press releases, and general feedback.</p>
                                        <a href="mailto:info@techplay.gg" className="text-[var(--accent)] font-medium hover:underline">info@techplay.gg</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl group hover:border-purple-500 transition-colors">
                                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1">Advertising & Partnerships</h3>
                                        <p className="text-[var(--text-secondary)] text-sm mb-2">For marketing campaigns, sponsorships, and business Inquiries.</p>
                                        <a href="mailto:marketing@techplay.gg" className="text-purple-400 font-medium hover:underline">marketing@techplay.gg</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl group hover:border-blue-500 transition-colors">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                                        <HelpCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1">Technical Support</h3>
                                        <p className="text-[var(--text-secondary)] text-sm mb-2">Issues with the website or your account?</p>
                                        <a href="mailto:support@techplay.gg" className="text-blue-400 font-medium hover:underline">support@techplay.gg</a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)]">
                            <h3 className="flex items-center gap-2 font-bold text-[var(--text-primary)] mb-4">
                                <MapPin className="w-5 h-5 text-[var(--accent)]" />
                                Visit Us / Mail Us
                            </h3>
                            <address className="not-italic text-[var(--text-secondary)] space-y-1">
                                <strong className="text-[var(--text-primary)]">Luminor Solutions</strong><br />
                                71000 Sarajevo<br />
                                Bosnia and Herzegovina
                            </address>
                            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2 text-[var(--text-muted)] text-sm">
                                <Phone className="w-4 h-4" />
                                <span>+387 33 123 456</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Column: Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8 md:p-10 relative overflow-hidden">
                            {/* Decorative gradients */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -z-0 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Send us a message</h3>
                                <p className="text-[var(--text-secondary)] mb-8">Usually we respond within 24 hours.</p>

                                {isSent ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center"
                                    >
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">Message Sent!</h4>
                                        <p className="text-[var(--text-secondary)]">
                                            Thank you for reaching out. We've received your message and will get back to you shortly.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-6"
                                            onClick={() => setIsSent(false)}
                                        >
                                            Send Another Message
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="text-sm font-medium text-[var(--text-secondary)]">Name</label>
                                                <Input id="name" placeholder="John Doe" required className="bg-[var(--bg-primary)]" />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
                                                <Input id="email" type="email" placeholder="john@example.com" required className="bg-[var(--bg-primary)]" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-sm font-medium text-[var(--text-secondary)]">Subject</label>
                                            <div className="relative">
                                                <select
                                                    id="subject"
                                                    className="w-full h-10 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none"
                                                    required
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Select a topic...</option>
                                                    <option value="general">General Inquiry</option>
                                                    <option value="press">Press / News Tip</option>
                                                    <option value="advertising">Advertising</option>
                                                    <option value="support">Technical Support</option>
                                                    <option value="feedback">Feedback</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                                                    <ArrowRight className="w-4 h-4 rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="message" className="text-sm font-medium text-[var(--text-secondary)]">Message</label>
                                            <Textarea id="message" placeholder="How can we help you?" required className="min-h-[150px] bg-[var(--bg-primary)]" />
                                        </div>

                                        <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2" /> Send Message
                                                </>
                                            )}
                                        </Button>

                                        <p className="text-xs text-[var(--text-muted)] text-center mt-4">
                                            By sending this message, you agree to our Privacy Policy.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
