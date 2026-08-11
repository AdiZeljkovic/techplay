import Link from "next/link";
import { ArrowRight, Bell, Twitter, Youtube, Twitch, MessageCircle } from "lucide-react";

/**
 * Where the roadmap ends: follow us, or make an account.
 *
 * Was an 800px accent blob at 10% opacity behind a card whose border glowed
 * through accent, purple and blue, with a bell that bobbed up and down forever.
 * Each social link also carried its platform's brand colour, so the row read as
 * four unrelated buttons.
 */

const SOCIALS = [
    { icon: Twitter, label: "Twitter", href: "https://twitter.com/techplaygg" },
    { icon: Youtube, label: "YouTube", href: "https://youtube.com/@techplaygg" },
    { icon: Twitch, label: "Twitch", href: "https://twitch.tv/techplaygg" },
    { icon: MessageCircle, label: "Discord", href: "https://discord.gg/techplaygg" },
];

export default function RoadmapCTA() {
    return (
        <section className="container-page">
            <div className="tp-fade-up tp-d6 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-8 text-center">
                <span className="inline-flex w-12 h-12 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-4">
                    <Bell className="w-5 h-5" />
                </span>

                <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)] mb-3">
                    Stay updated on our journey
                </h2>
                <p className="mx-auto mb-6 max-w-2xl text-[13.5px] text-[var(--ink-low)] leading-relaxed">
                    Follow our progress and be the first to know when new features drop. Join our community and
                    help shape the future of TechPlay.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
                    {SOCIALS.map((s) => (
                        <a
                            key={s.label}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={s.label}
                            className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--ink-low)] items-center justify-center hover:text-[var(--accent)] transition-colors duration-300"
                        >
                            <s.icon className="w-[18px] h-[18px]" />
                        </a>
                    ))}
                </div>

                <Link
                    href="/register"
                    className="btn-command inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                >
                    Join TechPlay
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}
