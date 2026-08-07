"use client";

import PageHero from "@/components/ui/PageHero";
import { Shield, Lock, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen">
            <PageHero
                title="Privacy Policy"
                description="We value your privacy. Learn how we collect, use, and protect your data."
                icon={Shield}
            />

            <div className="container-page py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row gap-8"
                >
                    {/* Sidebar / Info Card */}
                    <div className="md:w-1/3 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-panel)] p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4 text-[var(--accent)]">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-bold text-sm uppercase tracking-wide">Last Updated</span>
                                </div>
                                <p className="text-2xl font-bold text-white">March 24, 2026</p>
                            </div>

                            <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-panel)] p-6">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-green-500" /> Key Points
                                </h3>
                                <ul className="space-y-3 text-sm text-white/55">
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                        Data is encrypted &amp; secure
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                        GDPR Compliant
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                        You own your data
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                        No ads without your consent
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-2/3">
                        <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-panel)] p-8 md:p-12 relative overflow-hidden">
                            {/* Decor */}

                            <div className="prose prose-invert prose-lg max-w-none relative z-10 prose-headings:text-white prose-p:text-white/55 prose-li:text-white/55 prose-strong:text-white prose-a:text-[var(--accent)] hover:prose-a:text-[var(--accent-soft)]">

                                <h2>1. Introduction</h2>
                                <p>
                                    TechPlay.gg ("we," "our," or "us"), owned and operated by <strong>Luminor Solutions</strong>, is a gaming and technology media platform based in Bosnia and Herzegovina.
                                    This Privacy Policy explains what data we collect when you use our website techplay.gg (the "Service"), how we use it, who we share it with, and what rights you have over it.
                                    We have written this policy to be as clear and readable as possible — not to hide anything in legal language.
                                </p>
                                <p>
                                    By using the Service, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use the Service.
                                </p>

                                <h2>2. Data Controller</h2>
                                <p>
                                    The Data Controller responsible for your personal data is:<br />
                                    <strong>Luminor Solutions</strong><br />
                                    71000 Sarajevo, Bosnia and Herzegovina<br />
                                    Email: <a href="mailto:privacy@techplay.gg">privacy@techplay.gg</a>
                                </p>

                                <h2>3. Information We Collect</h2>
                                <p>We collect different types of information depending on how you use the Service:</p>
                                <ul>
                                    <li><strong>Account Data:</strong> When you register, we collect your username, email address, and an encrypted password. If you choose to fill out your profile, we may also store a display name, bio, avatar, gamertags (e.g., Battle.net, Steam), and PC specifications.</li>
                                    <li><strong>Authentication via Third Parties:</strong> If you sign in using Discord, Battle.net, or Google, we receive a limited set of profile data from those services (typically your username and email). We do not receive or store your password from those providers.</li>
                                    <li><strong>Usage Data:</strong> We automatically collect technical information such as your IP address, browser type and version, operating system, pages visited, time spent on the Service, and referring URLs. This data is used to keep the platform running properly and to understand how it is being used.</li>
                                    <li><strong>Forum &amp; Community Content:</strong> Posts, comments, reactions, and other content you submit to the forum or article comment sections are stored and associated with your account.</li>
                                    <li><strong>Purchase Data:</strong> If you make a purchase in our shop, we collect order details and process payments through PayPal. We do not store full card numbers or financial credentials on our servers.</li>
                                    <li><strong>Cookies and Tracking Technologies:</strong> We use cookies, local storage, and similar technologies. See our <a href="/cookies">Cookie Policy</a> for a full breakdown.</li>
                                </ul>

                                <h2>4. How We Use Your Data</h2>
                                <p>We use the data we collect to:</p>
                                <ul>
                                    <li>Provide, operate, and maintain the Service — including account management, forum functionality, and content delivery.</li>
                                    <li>Process orders and handle payments through PayPal.</li>
                                    <li>Analyse how the platform is used so we can improve it over time.</li>
                                    <li>Send important service-related notifications (e.g., forum reply alerts, order confirmations). We do not send unsolicited marketing emails.</li>
                                    <li>Detect and prevent abuse, spam, and security threats.</li>
                                    <li>Comply with legal obligations.</li>
                                </ul>

                                <h2>5. Advertising &amp; Third-Party Services</h2>
                                <p>
                                    We work with several third-party services to operate the platform. Below is a transparent breakdown of each one, what data they may access, and how you can control them.
                                </p>

                                <h3>Google AdSense</h3>
                                <p>
                                    We display advertisements served by <strong>Google AdSense</strong> (Google LLC, Mountain View, CA, USA). AdSense uses cookies and similar technologies to serve ads that may be relevant to your interests, based on your browsing activity across websites that use Google services.
                                </p>
                                <p>
                                    Our publisher ID is <strong>pub-7427807317921666</strong>. As a result of ad serving on this website, third parties (including Google) may be placing and reading cookies on your browser, or using web beacons to collect information. Advertising cookies are only placed if you have consented to marketing cookies through our consent banner. If you decline, we still show ads, but they will not be personalised.
                                </p>
                                <p>
                                    You can opt out of personalised advertising at any time through <a href="https://myadcenter.google.com" target="_blank" rel="noopener noreferrer">Google My Ad Center</a> or by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">YourAdChoices</a>.
                                    Google's privacy policy is available at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>.
                                </p>

                                <h3>Google Analytics</h3>
                                <p>
                                    We use <strong>Google Analytics 4</strong> to understand how visitors use TechPlay.gg — which pages are popular, how long people stay, and where they come from. This data is aggregated and anonymised; it does not identify individual users.
                                    Analytics cookies are only activated if you consent to analytics tracking. We have implemented Google Consent Mode v2, which means no tracking data is sent to Google before you have made your choice.
                                </p>

                                <h3>Meta Pixel (Facebook)</h3>
                                <p>
                                    We use the <strong>Meta Pixel</strong> (Meta Platforms Ireland Ltd.) to measure the effectiveness of our content and, when permitted, to serve relevant ads on Facebook and Instagram. The Pixel is only loaded after you have explicitly accepted marketing cookies. If you decline, the Pixel does not load at all.
                                </p>
                                <p>
                                    You can manage your ad preferences on Facebook at <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer">facebook.com/adpreferences</a>.
                                </p>

                                <h3>Discord (Login &amp; Community)</h3>
                                <p>
                                    We offer <strong>Discord OAuth</strong> login, which allows you to sign in using your Discord account. If you use this option, Discord shares your username and email with us. We also use Discord webhooks for internal notifications; no user data is sent via webhooks. The Discord bot integration is used solely for community features (e.g., server roles for supporters). Discord's privacy policy is at <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">discord.com/privacy</a>.
                                </p>

                                <h3>Battle.net / Blizzard Entertainment</h3>
                                <p>
                                    We offer <strong>Battle.net OAuth</strong> login for users who want to connect their Blizzard account (primarily for WoW-related features). If you use this option, Blizzard shares your Battle.net tag and email with us. Blizzard's privacy policy is at <a href="https://www.blizzard.com/en-us/legal/a4380ee5-5c8d-4e3b-83b7-ea26d01a9918" target="_blank" rel="noopener noreferrer">blizzard.com</a>.
                                </p>

                                <h3>Google Sign-In</h3>
                                <p>
                                    You may sign in using your Google account. If you do, Google shares your name, email address, and profile picture with us. We do not receive your Google password.
                                </p>

                                <h3>PayPal</h3>
                                <p>
                                    Payments in our shop are processed by <strong>PayPal (Europe) S.à r.l. et Cie, S.C.A.</strong> When you complete a purchase, you are redirected to PayPal's secure checkout. We receive a transaction confirmation but do not store your payment credentials. PayPal's privacy policy is at <a href="https://www.paypal.com/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer">paypal.com</a>.
                                </p>

                                <h3>Wowhead</h3>
                                <p>
                                    On pages related to World of Warcraft content, we load tooltips powered by <strong>Wowhead</strong> (Fanbyte/Ziff Davis). This is a JavaScript script that enhances item and spell links with hover tooltips. It does not use cookies or collect personal data. It is loaded in a privacy-safe manner (lazyOnload) and does not require your consent.
                                </p>

                                <h2>6. Your Consent Choices</h2>
                                <p>
                                    When you first visit TechPlay.gg, you will see our cookie consent banner. You can choose to:
                                </p>
                                <ul>
                                    <li><strong>Accept all</strong> — enables analytics and marketing cookies.</li>
                                    <li><strong>Reject all</strong> — only strictly necessary cookies are used. Ads will still appear but will not be personalised.</li>
                                    <li><strong>Customise</strong> — you can enable or disable analytics and marketing independently.</li>
                                </ul>
                                <p>
                                    You can change your preferences at any time by clicking "Cookie Settings" in the site footer.
                                    We use Google Consent Mode v2, which means ad and analytics scripts default to a denied state and only activate after you have made your choice.
                                </p>

                                <h2>7. Data Retention</h2>
                                <p>
                                    We keep your personal data for as long as your account is active or as needed to provide you with the Service. If you delete your account, we anonymise your profile data within 30 days. Forum posts may be retained in an anonymised form to preserve thread continuity. We may retain certain data for longer periods where required by law (e.g., financial records related to purchases).
                                </p>

                                <h2>8. Your Rights (GDPR)</h2>
                                <p>
                                    If you are based in the European Economic Area (EEA) or the United Kingdom, you have the following rights under the GDPR:
                                </p>
                                <ul>
                                    <li><strong>Right of access:</strong> You can request a copy of all personal data we hold about you.</li>
                                    <li><strong>Right to rectification:</strong> You can ask us to correct inaccurate data.</li>
                                    <li><strong>Right to erasure ("Right to be forgotten"):</strong> You can request that we delete your account and personal data.</li>
                                    <li><strong>Right to restrict processing:</strong> You can ask us to pause how we use your data in certain circumstances.</li>
                                    <li><strong>Right to data portability:</strong> You can request your data in a machine-readable format.</li>
                                    <li><strong>Right to object:</strong> You can object to processing based on legitimate interests, including direct marketing.</li>
                                    <li><strong>Right to withdraw consent:</strong> Where processing is based on consent (e.g., analytics cookies), you can withdraw at any time without affecting the lawfulness of prior processing.</li>
                                </ul>
                                <p>To exercise any of these rights, email us at <a href="mailto:privacy@techplay.gg">privacy@techplay.gg</a>. We will respond within 30 days.</p>

                                <h2>9. Security of Data</h2>
                                <p>
                                    We take reasonable technical and organisational measures to protect your data — including HTTPS encryption, hashed passwords, and access controls. That said, no method of transmission over the internet is completely secure. We cannot guarantee absolute security, but we take every practical step to protect the data we hold.
                                </p>

                                <h2>10. Children&apos;s Privacy</h2>
                                <p>
                                    TechPlay.gg is not directed at children under the age of 13. We do not knowingly collect personal data from children. If you believe we have inadvertently collected data from a child, please contact us and we will delete it promptly.
                                </p>

                                <h2>11. Changes to This Policy</h2>
                                <p>
                                    We may update this policy from time to time. When we do, we will update the "Last Updated" date at the top of this page. For significant changes, we will notify registered users by email or through a notice on the website. We encourage you to review this page periodically.
                                </p>

                                <h2>12. Contact Us</h2>
                                <p>
                                    If you have questions about this Privacy Policy or want to exercise your rights, please reach out:<br />
                                    Email: <a href="mailto:privacy@techplay.gg">privacy@techplay.gg</a><br />
                                    Address: Luminor Solutions, 71000 Sarajevo, Bosnia and Herzegovina
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
