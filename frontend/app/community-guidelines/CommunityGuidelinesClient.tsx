"use client";

import PageHero from "@/components/ui/PageHero";
import { Shield, AlertTriangle, MessageSquare, Flag, Calendar, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function CommunityGuidelinesClient() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Community Guidelines"
                description="Rules and expectations for participating in the TechPlay community."
                icon={Shield}
            />

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row gap-8"
                >
                    {/* Sidebar */}
                    <div className="md:w-1/3 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4 text-[var(--accent)]">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-bold text-sm uppercase tracking-wide">Last Updated</span>
                                </div>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">March 26, 2026</p>
                            </div>

                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-[var(--accent)]" /> Quick Summary
                                </h3>
                                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                        Be respectful to others
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                        Stay on-topic
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                        No spam or self-promotion
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                        No hate speech or harassment
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                        No illegal content
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                    <Flag className="w-5 h-5 text-orange-400" /> Report a Post
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-3">
                                    See something that breaks these rules? Use the report button on any thread or post, or contact us directly.
                                </p>
                                <a
                                    href="mailto:contact@techplay.gg"
                                    className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
                                >
                                    <Mail className="w-4 h-4" />
                                    contact@techplay.gg
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-2/3">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -z-0 pointer-events-none" />

                            <div className="prose prose-invert prose-lg max-w-none relative z-10 prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-li:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)] hover:prose-a:text-[var(--accent-light)]">

                                <h2>1. Be Respectful</h2>
                                <p>
                                    TechPlay is a community for gamers and tech enthusiasts of all backgrounds. Treat every member with respect, even when you disagree. Constructive criticism of ideas is welcome; personal attacks are not.
                                </p>
                                <ul>
                                    <li>Do not insult, demean, or mock other users.</li>
                                    <li>Disagreements should stay focused on the topic, not the person.</li>
                                    <li>Sarcasm and humour are fine — cruelty is not.</li>
                                </ul>

                                <h2>2. No Harassment or Hate Speech</h2>
                                <p>
                                    We have zero tolerance for content that targets individuals or groups based on race, ethnicity, nationality, religion, gender, sexual orientation, disability, or any other characteristic.
                                </p>
                                <ul>
                                    <li>Do not threaten, intimidate, or doxx other members.</li>
                                    <li>Do not use slurs or derogatory language.</li>
                                    <li>Do not coordinate harassment campaigns against any person.</li>
                                </ul>

                                <h2>3. Stay On-Topic</h2>
                                <p>
                                    Keep discussions relevant to the forum category you are posting in. TechPlay covers gaming, technology, hardware, esports, and related topics.
                                </p>
                                <ul>
                                    <li>Post in the appropriate category for your topic.</li>
                                    <li>Do not derail threads with unrelated tangents.</li>
                                    <li>Off-topic posts may be moved or removed by moderators.</li>
                                </ul>

                                <h2>4. No Spam or Excessive Self-Promotion</h2>
                                <p>
                                    Sharing your own content is allowed, but flooding the forum with promotional posts is not. A good rule of thumb: contribute meaningfully to the community before promoting anything.
                                </p>
                                <ul>
                                    <li>Do not post the same message in multiple threads or categories.</li>
                                    <li>Do not post referral links, affiliate links, or unsolicited advertisements.</li>
                                    <li>Do not create accounts solely for promotional purposes.</li>
                                </ul>

                                <h2>5. No Misinformation</h2>
                                <p>
                                    The gaming and tech space moves fast — misinformation spreads just as fast. Please verify information before posting, and correct yourself if you share something inaccurate.
                                </p>
                                <ul>
                                    <li>Do not knowingly share false rumours or fabricated news.</li>
                                    <li>Clearly label speculation as speculation.</li>
                                    <li>Link to credible sources when making factual claims.</li>
                                </ul>

                                <h2>6. No Illegal Content</h2>
                                <p>
                                    Do not post, link to, or solicit content that violates applicable law, including but not limited to:
                                </p>
                                <ul>
                                    <li>Pirated software, games, or media.</li>
                                    <li>Cheats, hacks, or exploits intended to harm other players.</li>
                                    <li>Content that violates copyright or intellectual property rights.</li>
                                    <li>Any content that is illegal in Bosnia and Herzegovina or the user&apos;s country of residence.</li>
                                </ul>

                                <h2>7. Protect Privacy</h2>
                                <p>
                                    Respect the privacy of others. Do not share personal information about another person without their consent.
                                </p>
                                <ul>
                                    <li>Do not share private messages, emails, or screenshots of private conversations without permission.</li>
                                    <li>Do not attempt to identify anonymous users.</li>
                                    <li>Do not share anyone&apos;s real name, address, phone number, or other identifying information (doxxing).</li>
                                </ul>

                                <h2>8. Account Responsibility</h2>
                                <p>
                                    You are responsible for all activity on your account.
                                </p>
                                <ul>
                                    <li>Do not share your account with others.</li>
                                    <li>Do not create multiple accounts to evade bans or restrictions.</li>
                                    <li>If your account is compromised, contact us immediately at <a href="mailto:contact@techplay.gg">contact@techplay.gg</a>.</li>
                                </ul>

                                <h2>9. Moderation & Enforcement</h2>
                                <p>
                                    TechPlay moderators have the authority to remove content, issue warnings, or suspend accounts that violate these guidelines. Enforcement decisions are made at the moderators&apos; discretion.
                                </p>
                                <p>Possible actions include:</p>
                                <ul>
                                    <li><strong>Warning:</strong> A private notice that your post violated the guidelines.</li>
                                    <li><strong>Post removal:</strong> Content that breaks the rules will be deleted.</li>
                                    <li><strong>Temporary suspension:</strong> Repeated or serious violations may result in a temporary ban.</li>
                                    <li><strong>Permanent ban:</strong> Severe violations (hate speech, illegal content, doxxing) result in a permanent account ban.</li>
                                </ul>
                                <p>
                                    If you believe a moderation action was taken in error, you may appeal by emailing <a href="mailto:contact@techplay.gg">contact@techplay.gg</a> with the subject line &quot;Moderation Appeal&quot;.
                                </p>

                                <h2>10. Reporting Violations</h2>
                                <p>
                                    If you see content that violates these guidelines, please report it using the report button on the thread or post. Reports are reviewed by our moderation team. Do not engage with rule-breaking content — report it and move on.
                                </p>
                                <p>
                                    For urgent issues (threats, illegal content), you can also email us directly at <a href="mailto:contact@techplay.gg">contact@techplay.gg</a>.
                                </p>

                                <h2>11. Changes to These Guidelines</h2>
                                <p>
                                    We may update these guidelines as the community grows and evolves. We will post a notice in the forum when significant changes are made. Continued use of the forum after changes are posted constitutes acceptance of the updated guidelines.
                                </p>

                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
