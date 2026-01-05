"use client";

import PageHero from "@/components/ui/PageHero";
import { FileText, Calendar, Scale } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Terms of Service"
                description="Please read these terms carefully before using our service."
                icon={FileText}
            />

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row gap-8"
                >
                    {/* Sidebar / Info Card */}
                    <div className="md:w-1/3 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4 text-[var(--accent)]">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-bold text-sm uppercase tracking-wide">Last Updated</span>
                                </div>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">January 1, 2026</p>
                            </div>

                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-blue-400" /> Summary
                                </h3>
                                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                                        Legal agreement between User and Luminor Solutions
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                                        Respect intellectual property
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                                        No prohibited activities
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-2/3">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-12 relative overflow-hidden">
                            {/* Decor */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

                            <div className="prose prose-invert prose-lg max-w-none relative z-10 prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-li:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)] hover:prose-a:text-[var(--accent-light)]">

                                <h2>1. Agreement to Terms</h2>
                                <p>
                                    These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you")
                                    and <strong>Luminor Solutions</strong>, doing business as <strong>TechPlay.gg</strong> ("we," "us" or "our"), concerning your access to and use of the
                                    techplay.gg website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
                                </p>
                                <p>
                                    You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms of Service.
                                    IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND YOU MUST DISCONTINUE USE IMMEDIATELY.
                                </p>

                                <h2>2. Intellectual Property Rights</h2>
                                <p>
                                    Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs,
                                    and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us,
                                    and are protected by copyright and trademark laws.
                                </p>

                                <h2>3. User Representations</h2>
                                <p>By using the Site, you represent and warrant that:</p>
                                <ul>
                                    <li>All registration information you submit will be true, accurate, current, and complete.</li>
                                    <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                                    <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
                                    <li>You are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the Site.</li>
                                </ul>

                                <h2>4. User Registration</h2>
                                <p>
                                    You may be required to register with the Site. You agree to keep your password confidential and will be responsible for all use of your account and password.
                                    We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
                                </p>

                                <h2>5. User Generated Contributions</h2>
                                <p>
                                    The Site may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create,
                                    submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Site, including but not limited to text, writings, video, audio,
                                    photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions").
                                </p>
                                <p>
                                    Contributions may be viewable by other users of the Site and the Marketplace and through third-party websites. When you post Contributions, you grant us a non-exclusive,
                                    unrestricted, unlimited, irrevocable, perpetual, worldwide, royalty-free license to host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive,
                                    store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such Contributions.
                                </p>

                                <h2>6. Prohibited Activities</h2>
                                <p>You may not use the Site for any purpose other than that for which we make the Site available. Prohibited activities include:</p>
                                <ul>
                                    <li>Systematically retrieving data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                                    <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                                    <li>Circumvent, disable, or otherwise interfere with security-related features of the Site.</li>
                                    <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Site.</li>
                                    <li>Use the Site in a manner inconsistent with any applicable laws or regulations.</li>
                                    <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming, that interferes with the uninterrupted use of the Site.</li>
                                </ul>

                                <h2>7. Termination</h2>
                                <p>
                                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                                    Upon termination, your right to use the Service will immediately cease.
                                </p>

                                <h2>8. Limitation of Liability</h2>
                                <p>
                                    In no event shall we, nor our directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages,
                                    including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                                </p>

                                <h2>9. Governing Law</h2>
                                <p>
                                    These Terms shall be governed and construed in accordance with the laws of Bosnia and Herzegovina, without regard to its conflict of law provisions.
                                </p>

                                <h2>10. Contact Us</h2>
                                <p>
                                    To resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:<br />
                                    <a href="mailto:info@techplay.gg">info@techplay.gg</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
