"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsRight, type LucideIcon } from "lucide-react";
import BrandPanel, { type Perk } from "./BrandPanel";

/**
 * What a signed-out reader gets instead of the page they asked for.
 *
 * Every gate on the site used to invent its own: an icon, a sentence and a
 * button, centred in an otherwise empty screen. This is the login card's own
 * face, so being stopped looks like part of the site rather than like the site
 * failing to load — and the sign-in link carries where they were going, so
 * signing in finishes the trip instead of dropping them on the homepage.
 */
interface SignInWallProps {
    /** Two words; the second takes the accent. */
    headline: [string, string];
    eyebrow: string;
    /** The line under the headline on the left panel. */
    blurb: string;
    /** What this particular page gives you once you are in. */
    perks: Perk[];
    /** The heading on the right, above the buttons. */
    title: string;
    description: string;
    icon: LucideIcon;
}

export default function SignInWall({
    headline, eyebrow, blurb, perks, title, description, icon: Icon,
}: SignInWallProps) {
    // Where to put them back. usePathname rather than a prop: the wall always
    // knows the page it is standing in front of. Only the sign-in link carries
    // it — a new account is sent to verify its address first, so the same
    // parameter on /register would be a promise nothing keeps.
    const here = usePathname();
    const back = `?redirect=${encodeURIComponent(here || "/")}`;

    return (
        <main className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center px-4 py-14">
            <div className="relative w-full max-w-[1000px] grid lg:grid-cols-2 rounded-[var(--radius-panel)] overflow-hidden border border-[var(--line)] shadow-[0_24px_64px_rgba(0,0,0,0.6)] bg-[var(--surface-1)]">
                <BrandPanel eyebrow={eyebrow} headline={headline} blurb={blurb} perks={perks} />

                <div className="flex flex-col justify-center p-8 sm:p-10">
                    <span className="w-12 h-12 rounded-[var(--radius-panel)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />
                    </span>

                    <h1 className="mt-5 font-display text-[26px] sm:text-[30px] font-black uppercase leading-none tracking-tight text-white">
                        {title}
                    </h1>

                    <p className="mt-3 text-[13.5px] leading-relaxed text-white/45 max-w-[380px]">
                        {description}
                    </p>

                    <Link
                        href={`/login${back}`}
                        className="btn-command mt-8 flex items-center justify-center gap-2 h-[52px] bg-[var(--accent)] hover:brightness-110 font-display text-[12px] font-black uppercase tracking-[0.14em] text-white transition-[filter]"
                    >
                        Sign in <ChevronsRight className="w-4 h-4" />
                    </Link>

                    <p className="mt-5 text-center text-[12.5px] text-white/55">
                        New player?{" "}
                        <Link href="/register" className="font-display font-black uppercase tracking-[0.1em] text-[var(--accent)] hover:brightness-125 transition-[filter]">
                            Create your account →
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
