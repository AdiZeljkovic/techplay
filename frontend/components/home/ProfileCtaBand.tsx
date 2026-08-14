import Link from "next/link";
import Image from "next/image";
import { Gamepad2, ListChecks, Award, Users, Check } from "lucide-react";

const FEATURES = [
    { icon: Gamepad2, title: "Track Games", sub: "Log and organize your collection" },
    { icon: ListChecks, title: "Build Backlog", sub: "Save games and plan your next play" },
    { icon: Award, title: "Earn Achievements", sub: "Unlock badges and show your progress" },
    { icon: Users, title: "Join Community", sub: "Discuss, review and connect with players" },
];

/**
 * Closing conversion band. The staged dashboard shot IS the box — the scene
 * is dark on the left by design, so the pitch sits directly on it and the
 * product glows behind the words instead of beside them.
 */
export default function ProfileCtaBand() {
    return (
        <section className="relative rounded-[var(--radius-panel)] border border-[var(--line)] overflow-hidden">
            {/* The scene, full bleed — dashboard anchored right where the render puts it */}
            <Image
                src="/images/profile-showcase.webp"
                alt=""
                aria-hidden
                fill
                // 1200, not 1280: the declared widths jump 1200 -> 1920, so asking for
                // 1280 fetches a 1920 variant of a decorative object-cover backdrop.
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover object-[72%_center]"
                priority={false}
            />
            {/* Legibility scrim: solid under the words, gone over the product */}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)]/95 via-[var(--surface-0)]/60 to-transparent" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--surface-0)]/70 to-transparent" />
            {/* Crown */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 p-6 md:p-10 lg:py-14">
                {/* ── Pitch, on the dark side of the scene ── */}
                <div className="flex flex-col justify-center">
                    <p className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
                        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                        Build your gaming identity
                    </p>

                    <h2 className="font-display text-[28px] md:text-[34px] font-black text-[var(--ink-hi)] leading-[1.08]">
                        Your games. Your profile.
                        <br />
                        <span className="text-[var(--accent)]">Your community.</span>
                    </h2>

                    <p className="mt-4 text-[14px] text-[var(--ink-mid)] max-w-[440px] leading-relaxed">
                        Create a free TechPlay profile to track everything you play, earn your rank, and join a community that actually cares about games.
                    </p>

                    <ul className="mt-7 space-y-3">
                        {FEATURES.map((f) => (
                            <li key={f.title} className="flex items-center gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center">
                                    <Check className="w-3 h-3 text-[var(--accent)]" strokeWidth={3} />
                                </span>
                                <span className="min-w-0">
                                    <span className="font-display text-[13px] font-bold text-[var(--ink-hi)]">{f.title}</span>
                                    <span className="text-[13px] text-[var(--ink-low)]"> — {f.sub}</span>
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-7 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                        >
                            Create Your Profile
                        </Link>
                        <span className="text-[12px] text-[var(--ink-faint)]">
                            Free forever ·{" "}
                            <Link href="/login" className="text-[var(--ink-mid)] hover:text-[var(--accent)] font-semibold transition-colors">
                                Already a member?
                            </Link>
                        </span>
                    </div>
                </div>

                {/* Right half belongs to the render itself; it only needs the room. */}
                <div aria-hidden className="hidden lg:block min-h-[380px]" />
            </div>
        </section>
    );
}
