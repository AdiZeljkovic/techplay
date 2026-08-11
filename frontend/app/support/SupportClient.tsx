import { Heart, Shield, Star, Zap } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SupportTiers from "./SupportTiers";
import type { SupportTier } from "@/types/support";

/**
 * Support — the page around the tier cards.
 *
 * A server component. The tiers used to be fetched in a useEffect, so the
 * first thing a visitor saw was a spinner where the offer should be, and the
 * PayPal provider wrapped the entire page to serve three cards near the
 * bottom of it. Both are fixed by moving the fetch to the server and the
 * provider into SupportTiers.
 */

const BENEFITS = [
    { icon: Shield, title: "Ad-free experience", desc: "Browse TechPlay without interruptions. No banners, no pop-ups, just pure content." },
    { icon: Star, title: "Exclusive badges", desc: "Stand out in comments and forums with a unique profile badge showcasing your rank." },
    { icon: Zap, title: "Direct impact", desc: "Your contribution directly funds hardware for reviews, server costs, and freelance writers." },
];

export default function SupportClient({ tiers }: { tiers: SupportTier[] }) {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Support TechPlay"
                description="Join our inner circle. Get exclusive benefits while supporting independent gaming journalism."
                iconNode={<Heart className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />}
            />

            <div className="container-page py-10 md:py-14 space-y-10 md:space-y-14">
                <section className="tp-fade-up tp-d1 max-w-3xl">
                    <h2 className="flex items-center gap-2.5 mb-4 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                        <span aria-hidden className="w-[3px] h-[14px] rounded-full bg-[var(--accent)]" />
                        Level up your experience
                    </h2>
                    <p className="text-[14.5px] text-[var(--ink-mid)] leading-relaxed">
                        TechPlay is built by gamers, for gamers. Your support helps us remain independent,
                        ad-free for members, and focused on high-quality content without clickbait.
                    </p>
                </section>

                <section className="tp-fade-up tp-d2">
                    <SupportTiers tiers={tiers} />
                </section>

                <section className="tp-fade-up tp-d3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {BENEFITS.map((b) => (
                        <div
                            key={b.title}
                            className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5"
                        >
                            <span className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-4">
                                <b.icon className="w-[18px] h-[18px]" />
                            </span>
                            <h3 className="font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-2">
                                {b.title}
                            </h3>
                            <p className="text-[13px] text-[var(--ink-low)] leading-relaxed">{b.desc}</p>
                        </div>
                    ))}
                </section>
            </div>
        </main>
    );
}
