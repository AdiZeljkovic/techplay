"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageSquare, Briefcase, HelpCircle, ArrowRight, CheckCircle2, Loader2, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useState, FormEvent, useRef } from "react";
import { submitContactForm } from "./actions";

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
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            subject: formData.get('subject') as string,
            message: formData.get('message') as string,
        };

        try {
            const result = await submitContactForm(data);

            if (result.success) {
                setIsSent(true);
                formRef.current?.reset();
            } else {
                setError(result.message);
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen">
            <PageHero
                title="Get in Touch"
                description="Got a tip? Found a bug? Want to work with us? We're all ears."
            />

            <div className="container-page py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

                    {/* Left Column: Contact Info & Departments */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <motion.div variants={fadeInUp} className="mb-12">
                            <h2 className="font-display text-3xl font-bold text-white mb-6 uppercase tracking-tight">Contact Information</h2>
                            <p className="text-white/55 text-lg leading-relaxed mb-8">
                                We actually read our emails (shocking, we know). Whether you've got a news tip, want your game reviewed,
                                or just found a typo that's driving you nuts—hit the right inbox below and we'll get back to you.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-6 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-panel)] group hover:border-[var(--accent)] transition-colors">
                                    <div className="p-3 bg-[var(--accent)]/10 rounded-[var(--radius-card)] text-[var(--accent)] group-hover:scale-110 transition-transform">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg mb-1">General & Editorial</h3>
                                        <p className="text-white/55 text-sm mb-2">News tips, game review requests, press releases, or just saying hi.</p>
                                        <a href="mailto:redakcija@techplay.gg" className="text-[var(--accent)] font-medium hover:underline">redakcija@techplay.gg</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-6 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-panel)] group hover:border-[var(--accent)]/40 transition-colors">
                                    <div className="p-3 bg-[var(--accent)]/10 rounded-[var(--radius-card)] text-[var(--accent)] group-hover:scale-110 transition-transform">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg mb-1">Advertising & Partnerships</h3>
                                        <p className="text-white/55 text-sm mb-2">Want to advertise or partner with us? Let's talk rates and options.</p>
                                        <a href="mailto:marketing@techplay.gg" className="text-[var(--accent)] font-medium hover:underline">marketing@techplay.gg</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-6 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-panel)] group hover:border-[var(--accent)]/40 transition-colors">
                                    <div className="p-3 bg-[var(--accent)]/10 rounded-[var(--radius-card)] text-[var(--accent)] group-hover:scale-110 transition-transform">
                                        <HelpCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg mb-1">Technical Support</h3>
                                        <p className="text-white/55 text-sm mb-2">Site broken? Can't log in? Comments not working? We'll fix it.</p>
                                        <a href="mailto:support@techplay.gg" className="text-[var(--accent)] font-medium hover:underline">support@techplay.gg</a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="bg-[var(--surface-1)] p-8 rounded-[var(--radius-panel)] border border-[var(--line)]">
                            <h3 className="flex items-center gap-2 font-bold text-white mb-4">
                                <MapPin className="w-5 h-5 text-[var(--accent)]" />
                                Visit Us / Mail Us
                            </h3>
                            <address className="not-italic text-white/55 space-y-1">
                                <strong className="text-white">Luminor Solutions</strong><br />
                                71000 Sarajevo<br />
                                Bosnia and Herzegovina
                            </address>
                            <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center gap-2 text-white/35 text-sm">
                                <Phone className="w-4 h-4" />
                                <span>+387 62 574 783</span>
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
                        <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-panel)] p-8 md:p-10 relative overflow-hidden">
                            {/* Decorative gradients */}

                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-white mb-2">Send us a message</h3>
                                <p className="text-white/55 mb-8">We try to respond within 24-48 hours. Weekends might take a bit longer (we're human).</p>

                                {isSent ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-green-500/10 border border-green-500/20 rounded-[var(--radius-card)] p-8 text-center"
                                    >
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h4 className="text-xl font-bold text-white mb-2">Message Sent!</h4>
                                        <p className="text-white/55">
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
                                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-[var(--radius-card)] p-4 flex items-center gap-3 text-red-400">
                                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                <p className="text-sm">{error}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="text-sm font-medium text-white/55">Name</label>
                                                <Input id="name" name="name" placeholder="John Doe" required className="bg-[var(--surface-0)]" />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-sm font-medium text-white/55">Email</label>
                                                <Input id="email" name="email" type="email" placeholder="john@example.com" required className="bg-[var(--surface-0)]" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-sm font-medium text-white/55">Subject</label>
                                            <div className="relative">
                                                <select
                                                    id="subject"
                                                    name="subject"
                                                    className="w-full h-10 px-3 py-2 border border-[var(--line)] rounded-[var(--radius-inner)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none"
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
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/35">
                                                    <ArrowRight className="w-4 h-4 rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="message" className="text-sm font-medium text-white/55">Message</label>
                                            <Textarea id="message" name="message" placeholder="How can we help you?" required className="min-h-[150px]" />
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

                                        <p className="text-xs text-white/35 text-center mt-4">
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
