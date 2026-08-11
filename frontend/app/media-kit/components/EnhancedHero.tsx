import { Mail, Download, BarChart3, Users, Newspaper, type LucideIcon } from "lucide-react";
import DeviceMockupsReal from "./DeviceMockupsReal";

/**
 * The media kit's opening screen.
 *
 * Was a full 100vh with two radial orbs drifting on a loop, a grid overlay, a
 * headline in a three-stop gradient with an underline that swiped in, and a
 * pulsing dot on the badge. It is the first thing a media buyer sees on a slow
 * connection, so it now paints once and stops moving.
 *
 * A server component. Nothing here reacted to anything — the `mounted` state
 * existed only to delay the orb animation past hydration.
 *
 * TODO(numbers): "20,000 monthly readers", "171+", "2K+" are the same
 * placeholders as the rest of the page.
 */

interface EnhancedHeroProps {
    contactEmail?: string;
    /** Kept for the call site; the button is a plain link until a PDF exists. */
    onDownloadPDF?: () => void;
}

const TRUST = [
    { icon: Newspaper, value: "171+", label: "In-depth reviews" },
    { icon: Users, value: "20K+", label: "Monthly readers" },
    { icon: BarChart3, value: "2K+", label: "Social following" },
];

function TrustBadge({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
    return (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] px-4 py-3">
            <span className="inline-flex w-9 h-9 shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center">
                <Icon className="w-4 h-4" />
            </span>
            <span>
                <span className="block font-display text-[16px] font-black tabular-nums leading-tight text-[var(--ink-hi)]">{value}</span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{label}</span>
            </span>
        </div>
    );
}

export default function EnhancedHero({ contactEmail }: EnhancedHeroProps) {
    const email = contactEmail || "marketing@techplay.gg";

    return (
        <section className="border-b border-[var(--line)] bg-[var(--surface-0)]">
            <div className="container-page py-12 md:py-16">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div className="tp-fade-up tp-d1">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[var(--fill-1)] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                            Official Media Kit 2026
                        </span>

                        <h1 className="mt-5 font-display text-[30px] md:text-[44px] font-black uppercase leading-[0.95] tracking-tight text-[var(--ink-hi)]">
                            Reach gamers who
                            <br />
                            <span className="text-[var(--accent)]">actually buy stuff</span>
                        </h1>

                        <p className="mt-5 max-w-xl text-[14.5px] text-[var(--ink-mid)] leading-relaxed">
                            Over <strong className="text-[var(--ink-hi)]">20,000 monthly readers</strong> who trust our
                            reviews when making tech purchases. No bots, no fake traffic — just real people who
                            genuinely care about gaming and tech.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <a
                                href={`mailto:${email}`}
                                className="btn-command inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                            >
                                <Mail className="w-4 h-4" />
                                Let&apos;s talk
                            </a>
                            <a
                                href="#pricing"
                                className="btn-command btn-command-quiet inline-flex items-center gap-2 h-11 px-6 bg-[var(--fill-2)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                            >
                                <Download className="w-4 h-4" />
                                See the rates
                            </a>
                        </div>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {TRUST.map((badge) => (
                                <TrustBadge key={badge.label} {...badge} />
                            ))}
                        </div>
                    </div>

                    <div className="tp-fade-up tp-d2">
                        <DeviceMockupsReal />
                    </div>
                </div>
            </div>
        </section>
    );
}
