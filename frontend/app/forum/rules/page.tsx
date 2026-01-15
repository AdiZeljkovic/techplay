"use client";

import { Shield, CheckCircle, AlertTriangle, XCircle, Flag, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ForumRulesPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex p-3 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mb-4 shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                        Community <span className="text-[var(--accent)]">Guidelines</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                        To keep the TechPlay community helpful, friendly, and safe for everyone, please read and follow these rules.
                    </p>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-10 shadow-2xl space-y-10">
                    {/* Section 1: Core Principles */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            1. Core Principles
                        </h2>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <span className="font-bold text-[var(--accent)] tracking-widest text-lg">1.1</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Be Respectful</h4>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        Treat all members with respect. Disruptive, insulting, or abusive behavior will not be tolerated.
                                        We are a diverse community of gamers and tech enthusiasts; disagreements are fine, but hostility is not.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="font-bold text-[var(--accent)] tracking-widest text-lg">1.2</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">No Hate Speech or Harassment</h4>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        Any form of hate speech, discrimination, threats, or harassment based on race, ethnicity, religion,
                                        gender, sexual orientation, disability, or any other characteristic is strictly prohibited.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* Section 2: Content Rules */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                            <MessageSquare className="w-6 h-6 text-blue-500" />
                            2. Posting & Content
                        </h2>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <span className="font-bold text-[var(--accent)] tracking-widest text-lg">2.1</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Keep it Relevant</h4>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        Post in the appropriate sub-forums. Read the thread descriptions before creating a new topic.
                                        Off-topic posts may be moved or deleted.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="font-bold text-[var(--accent)] tracking-widest text-lg">2.2</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">No Spam or Self-Promotion</h4>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        Do not spam threads. Self-promotion (channels, streams, websites) is only permitted in the designated
                                        "Community Showcase" section or signature areas. Unsolicited advertising is banned.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="font-bold text-[var(--accent)] tracking-widest text-lg">2.3</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Safe Content Policy (NSFW)</h4>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        TechPlay is a safe-for-work environment. Do not post pornography, gore, or excessively violent content.
                                        Sensitive topics should be handled with maturity and tagged appropriately if permitted.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* Section 3: Forbidden Activities */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                            <XCircle className="w-6 h-6 text-red-500" />
                            3. Strictly Prohibited
                        </h2>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <span className="font-bold text-red-500 tracking-widest text-lg">3.1</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Piracy & Illegal Activities</h4>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        Sharing links to pirated software, cracks, keygens, or promoting illegal activities is strictly forbidden.
                                        We respect intellectual property rights.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="font-bold text-red-500 tracking-widest text-lg">3.2</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Doxxing & Privacy</h4>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        Do not share personal information of other users without their explicit consent.
                                        Protect your own privacy and that of others.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* Moderation */}
                    <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-6 rounded-2xl flex gap-4 items-start">
                        <Flag className="w-6 h-6 text-[var(--accent)] shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-white text-lg mb-2">Moderation Policy</h3>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                                Our moderators work to keep the community safe. If you see a violation, please use the "Report" button
                                instead of engaging. Moderators have the final say in rule interpretation and enforcement.
                                Sanctions may range from warnings to permanent bans depending on the severity of the infraction.
                            </p>
                            <Link href="/staff">
                                <Button size="sm" variant="outline">Contact Staff</Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <Link href="/forum">
                        <Button className="px-8" size="lg">I Agree - Back to Forum</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
