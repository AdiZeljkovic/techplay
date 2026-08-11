"use client";

import { Shield, CheckCircle, XCircle, Flag, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageHero from "@/components/ui/PageHero";

/**
 * The rules, as rules rather than as a wall.
 *
 * Every clause is numbered because a moderator has to be able to point at one
 * — "3.1" is the whole reason the numbering exists here, unlike the decorative
 * 01 / 02 / 03 that turns up on marketing pages.
 */
const SECTIONS = [
    {
        icon: CheckCircle,
        tone: "#34d399",
        title: "Core principles",
        rules: [
            {
                ref: "1.1",
                head: "Be respectful",
                body: "Treat every member with respect. Disruptive, insulting or abusive behaviour is not tolerated. We are a mixed room of gamers and tech people — disagreement is fine, hostility is not.",
            },
            {
                ref: "1.2",
                head: "No hate speech or harassment",
                body: "Hate speech, discrimination, threats or harassment on the basis of race, ethnicity, religion, gender, sexual orientation, disability or anything else is prohibited outright.",
            },
        ],
    },
    {
        icon: MessageSquare,
        tone: "#60a5fa",
        title: "Posting and content",
        rules: [
            {
                ref: "2.1",
                head: "Keep it relevant",
                body: "Post on the right board. Read the board description before opening a topic — off-topic threads get moved or removed.",
            },
            {
                ref: "2.2",
                head: "No spam or self-promotion",
                body: "Do not spam threads. Promoting your own channel, stream or site belongs in the designated showcase space or your signature. Unsolicited advertising is banned.",
            },
            {
                ref: "2.3",
                head: "Safe content",
                body: "TechPlay is safe for work. No pornography, no gore, no gratuitous violence. Sensitive subjects are welcome if handled with maturity and tagged where required.",
            },
        ],
    },
    {
        icon: XCircle,
        tone: "#f43f5e",
        title: "Strictly prohibited",
        rules: [
            {
                ref: "3.1",
                head: "Piracy and illegal activity",
                body: "No links to pirated software, cracks or keygens, and no promotion of illegal activity. We respect intellectual property.",
            },
            {
                ref: "3.2",
                head: "Doxxing and privacy",
                body: "Never share another member's personal information without their explicit consent. Protect your own as carefully as theirs.",
            },
        ],
    },
];

export default function ForumRulesPage() {
    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Community Guidelines"
                description="What keeps the boards worth reading. Every rule here is one a moderator can point at, so they are numbered."
                icon={Shield}
            />

            <div className="container-page pb-14 max-w-[860px]">
                <Link
                    href="/forum"
                    className="inline-flex items-center gap-2 mb-6 font-display text-[10px] font-black uppercase tracking-[0.12em] text-white/35 hover:text-[var(--accent)] transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to the forum
                </Link>

                <div className="space-y-4">
                    {SECTIONS.map((section) => {
                        const Icon = section.icon;

                        return (
                            <section
                                key={section.title}
                                className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-5 md:p-6"
                            >
                                <h2 className="flex items-center gap-3 pb-4 mb-4 border-b border-white/[0.06] font-display text-[15px] font-black uppercase tracking-[0.1em] text-white">
                                    <span
                                        className="w-8 h-8 shrink-0 rounded-[var(--radius-card)] flex items-center justify-center"
                                        style={{ background: `color-mix(in srgb, ${section.tone} 14%, transparent)`, color: section.tone }}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </span>
                                    {section.title}
                                </h2>

                                <ul className="space-y-4">
                                    {section.rules.map((rule) => (
                                        <li key={rule.ref} className="flex gap-4">
                                            <span className="shrink-0 w-[34px] font-display text-[13px] font-black tabular-nums text-[var(--accent)]">
                                                {rule.ref}
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="font-display text-[13.5px] font-black text-white">{rule.head}</h3>
                                                <p className="mt-1 text-[13px] text-white/45 leading-relaxed">{rule.body}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}

                    <section className="rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[var(--accent-soft)] p-5 md:p-6 flex gap-4">
                        <Flag className="w-5 h-5 shrink-0 mt-0.5 text-[var(--accent)]" />
                        <div className="min-w-0">
                            <h2 className="font-display text-[14px] font-black uppercase tracking-[0.1em] text-white">
                                How moderation works
                            </h2>
                            <p className="mt-2 text-[13px] text-white/50 leading-relaxed">
                                If you see a rule broken, use Report rather than replying to it — a reply gives the thread
                                the argument it was looking for. Moderators read every report, and their reading of a rule
                                is the one that stands. Sanctions run from a warning to a permanent ban, depending on what
                                was done and how often.
                            </p>
                            <Link
                                href="/contact"
                                className="btn-command btn-command-quiet mt-4 inline-flex items-center justify-center h-9 px-5 bg-white/[0.05] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors"
                            >
                                Contact staff
                            </Link>
                        </div>
                    </section>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/forum"
                        className="btn-command inline-flex items-center justify-center h-11 px-8 bg-[var(--accent)] font-display text-[11px] font-black uppercase tracking-[0.12em] text-white hover:brightness-110 transition-[filter]"
                    >
                        Back to the boards
                    </Link>
                </div>
            </div>
        </div>
    );
}
