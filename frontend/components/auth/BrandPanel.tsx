"use client";

import Link from "next/link";
import { Zap, Trophy, MessageSquare, Gift, type LucideIcon } from "lucide-react";

/**
 * The left half of the login card, lifted out of it so anything that has to
 * stop a signed-out reader can wear the same face.
 *
 * It was written for /login and stays byte-identical there; everything the
 * other callers need to change — the eyebrow, the headline, the line under it,
 * the list — is a prop with the login page's own values as the default.
 */

export interface Perk {
    icon: LucideIcon;
    text: string;
}

const DEFAULT_PERKS: Perk[] = [
    { icon: Zap, text: "Earn XP for every comment and article you read" },
    { icon: Trophy, text: "Level up and unlock community ranks" },
    { icon: MessageSquare, text: "Join discussions on the forum" },
    { icon: Gift, text: "Enter exclusive giveaways" },
];

interface BrandPanelProps {
    eyebrow?: string;
    /** Rendered as two lines: the second takes the accent. */
    headline?: [string, string];
    blurb?: string;
    perks?: Perk[];
    /**
     * The strip along the foot. Off by default — the numbers on the login page
     * are marketing copy the site has not verified, and a component reused in
     * five places should not spread them further.
     */
    footnote?: React.ReactNode;
}

export default function BrandPanel({
    eyebrow = "Player login",
    headline = ["Game", "On."],
    blurb = "Sign back in and pick up where you left off — your XP, rank and community are waiting.",
    perks = DEFAULT_PERKS,
    footnote,
}: BrandPanelProps) {
    return (
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[var(--surface-0)] overflow-hidden">
            {/* Decorations */}
            <div className="absolute -top-[120px] -left-[80px] w-[400px] h-[400px] bg-[var(--accent)]/15 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-[150px] -right-[100px] w-[350px] h-[350px] bg-[var(--accent)]/10 blur-[100px] rounded-full pointer-events-none" />
            <div
                className="absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.9) 1px, transparent 0)', backgroundSize: '28px 28px' }}
            />
            {/* HUD corner brackets */}
            <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-[var(--accent)]/40" />
            <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-[var(--accent)]/40" />

            {/* Logo */}
            <Link href="/" className="relative z-10 flex items-center group w-max" aria-label="TechPlay — home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/techplay-logo.png" alt="TechPlay" width={156} height={26} className="h-[26px] w-auto group-hover:brightness-110 transition-[filter]" />
            </Link>

            {/* Middle */}
            <div className="relative z-10">
                <span className="flex items-center gap-2 text-[var(--accent)] font-bold tracking-[0.2em] text-[11px] uppercase mb-4">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                    {eyebrow}
                </span>
                <h2 className="font-display text-[42px] font-black text-white uppercase leading-[0.95] tracking-tight mb-5">
                    {headline[0]}<br />
                    <span className="text-[var(--accent)]">{headline[1]}</span>
                </h2>
                <p className="text-[14px] text-white/45 leading-relaxed max-w-[300px] mb-8">
                    {blurb}
                </p>

                <ul className="flex flex-col gap-3.5">
                    {perks.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-[var(--radius-card)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-[var(--accent)]" />
                            </span>
                            <span className="text-[13px] text-[#D4D4D8]">{text}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Bottom strip */}
            <div className="relative z-10 flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                {footnote}
            </div>
        </div>
    );
}
