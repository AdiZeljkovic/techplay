"use client";

import { Shield, CheckCircle, XCircle, Flag, MessageSquare } from "lucide-react";
import Link from "next/link";
import ForumShell from "@/components/forum/ForumShell";

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
        <ForumShell
            crumbs={[{ label: "Forum", href: "/forum" }, { label: "Guidelines" }]}
            title="Community guidelines"
            description="What keeps the boards worth reading. Every rule here is one a moderator can point at, which is why they carry numbers."
            mark={Shield}
        >
            <div className="max-w-[820px] space-y-4">
                {SECTIONS.map((section) => {
                    const Icon = section.icon;

                    return (
                        <section
                            key={section.title}
                            className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden"
                        >
                            <h2 className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 font-display text-[13.5px] font-bold text-white">
                                <span
                                    aria-hidden
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-inner)]"
                                    style={{ background: `color-mix(in srgb, ${section.tone} 14%, transparent)`, color: section.tone }}
                                >
                                    <Icon className="h-[15px] w-[15px]" strokeWidth={1.7} />
                                </span>
                                {section.title}
                            </h2>

                            {/* Hairlines between clauses, so a rule is a row you can
                                point at rather than a paragraph in a stack. */}
                            <ul className="divide-y divide-[var(--line)]">
                                {section.rules.map((rule) => (
                                    <li key={rule.ref} className="flex gap-4 px-4 py-3.5">
                                        <span className="w-[30px] shrink-0 font-numeric text-[13px] text-[var(--accent)]">
                                            {rule.ref}
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="font-display text-[13px] font-bold text-white">{rule.head}</h3>
                                            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ink-low)]">{rule.body}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}

                <section className="flex gap-4 rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[var(--accent-soft)] px-4 py-4">
                    <Flag aria-hidden className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--accent)]" strokeWidth={1.7} />
                    <div className="min-w-0">
                        <h2 className="font-display text-[13px] font-bold text-white">How moderation works</h2>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-low)]">
                            If you see a rule broken, use Report rather than replying to it — a reply gives the thread
                            the argument it was looking for. Moderators read every report, and their reading of a rule
                            is the one that stands. Sanctions run from a warning to a permanent ban, depending on what
                            was done and how often.
                        </p>
                        <Link
                            href="/contact"
                            className="btn-command btn-command-quiet mt-3.5 inline-flex h-9 items-center justify-center bg-white/[0.05] px-5 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-mid)] transition-colors hover:bg-white/[0.1] hover:text-white"
                        >
                            Contact staff
                        </Link>
                    </div>
                </section>

                <div className="pt-1">
                    <Link
                        href="/forum"
                        className="btn-command inline-flex h-10 items-center justify-center bg-[var(--accent)] px-6 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white transition-[filter] hover:brightness-110"
                    >
                        Back to the boards
                    </Link>
                </div>
            </div>
        </ForumShell>
    );
}
