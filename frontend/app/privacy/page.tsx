"use client";

import PageHero from "@/components/ui/PageHero";
import { Shield, Lock, Calendar, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Privacy Policy"
                description="We value your privacy. Learn how we collect, use, and protect your data."
                icon={Shield}
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
                                    <Lock className="w-5 h-5 text-green-500" /> Key Points
                                </h3>
                                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                        Data is encrypted & secure
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                        GDPR Compliant
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                        You own your data
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-2/3">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-12 relative overflow-hidden">
                            {/* Decor */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -z-0 pointer-events-none" />

                            <div className="prose prose-invert prose-lg max-w-none relative z-10 prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-li:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)] hover:prose-a:text-[var(--accent-light)]">

                                <h2>1. Introduction</h2>
                                <p>
                                    TehcPlay.gg ("we," "our," or "us"), owned and operated by <strong>Luminor Solutions</strong>, is committed to protecting your privacy.
                                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website
                                    techplay.gg (the "Service"). By using the Service, you consent to the data practices described in this policy.
                                </p>

                                <h2>2. Data Controller</h2>
                                <p>
                                    For the purposes of the General Data Protection Regulation (GDPR), the Data Controller is:<br />
                                    <strong>Luminor Solutions</strong><br />
                                    71000 Sarajevo<br />
                                    Bosnia and Herzegovina<br />
                                    Email: <a href="mailto:privacy@techplay.gg">privacy@techplay.gg</a>
                                </p>

                                <h2>3. Information We Collect</h2>
                                <p>We collect information that serves to provide, improve, and protect our services.</p>
                                <ul>
                                    <li><strong>Personal Data:</strong> When you register, we collect your username, email address, and encrypted password. If you choose to complete your profile, we may also store a bio, gamertags, and PC specifications.</li>
                                    <li><strong>Usage Data:</strong> We automatically collect information such as your IP address, browser type, operating system, pages visited, and time spent on the Service.</li>
                                    <li><strong>Cookies:</strong> We use cookies to enhance your experience. See our <a href="/cookies">Cookie Policy</a> for details.</li>
                                </ul>

                                <h2>4. How We Use Your Data</h2>
                                <p>We use the collected data for the following purposes:</p>
                                <ul>
                                    <li>To provide and maintain our Service (e.g., logging you in).</li>
                                    <li>To notify you about changes to our Service.</li>
                                    <li>To allow you to participate in interactive features (comments, forum, ratings).</li>
                                    <li>To provide customer support.</li>
                                    <li>To gather analysis or valuable information so that we can improve our Service.</li>
                                    <li>To monitor the usage of our Service and detect/prevent technical issues.</li>
                                </ul>

                                <h2>5. Data Retention</h2>
                                <p>
                                    We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy.
                                    We will retain and use your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws),
                                    resolve disputes, and enforce our legal agreements and policies.
                                </p>

                                <h2>6. Your Rights (GDPR)</h2>
                                <p>If you are a resident of the European Economic Area (EEA), you have certain data protection rights:</p>
                                <ul>
                                    <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
                                    <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
                                    <li><strong>The right to erasure ("Right to be forgotten"):</strong> You can request that we delete your Personal Data under certain conditions.</li>
                                    <li><strong>The right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data.</li>
                                    <li><strong>The right to data portability:</strong> You have the right to request that we transfer the data that we have collected to another organization, or directly to you.</li>
                                </ul>
                                <p>To exercise these rights, please contact us at <a href="mailto:privacy@techplay.gg">privacy@techplay.gg</a>.</p>

                                <h2>7. Third-Party Services</h2>
                                <p>
                                    We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf,
                                    or to assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf
                                    and are obligated not to disclose or use it for any other purpose.
                                </p>
                                <ul>
                                    <li><strong>Google Analytics:</strong> We use Google Analytics to monitor and analyze the use of our Service. Google uses the data collected to track and monitor the use of our Service.</li>
                                </ul>

                                <h2>8. Security of Data</h2>
                                <p>
                                    The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure.
                                    While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                                </p>

                                <h2>9. Changes to This Privacy Policy</h2>
                                <p>
                                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                                    You are advised to review this Privacy Policy periodically for any changes.
                                </p>

                                <h2>10. Contact Us</h2>
                                <p>
                                    If you have any questions about this Privacy Policy, please contact us:<br />
                                    By email: <a href="mailto:privacy@techplay.gg">privacy@techplay.gg</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
