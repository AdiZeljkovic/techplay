import Link from "next/link";
import { Layout, Layers, MonitorSmartphone, Zap, Users, Globe, Cpu, ShoppingCart, Shield, MousePointerClick, Mail, Download, Megaphone, Video } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";

/**
 * Advertising & Partnerships.
 *
 * Two numbers were removed rather than restyled. The audience cards claimed
 * "72% aged 18-34" and "85% PC & console gamers" to people who might buy
 * advertising on the strength of them, and nothing in this project measures
 * either. Restyling a figure nobody can source would only have made it look
 * more official. The cards now say what is actually known; the moment there
 * are real analytics numbers, they belong here in place of these.
 */

const AD_SPECS = [
    { name: "Billboard / Skin", dims: "970×250 + background", desc: "Maximum impact. Own the top of the homepage and wrap the site experience.", icon: Layout },
    { name: "Leaderboard", dims: "728×90", desc: "High visibility across all pages. The industry staple for brand awareness.", icon: Layers },
    { name: "Medium Rectangle", dims: "300×250", desc: "Integrated into the sidebar and article content. High click-through rates.", icon: MonitorSmartphone },
    { name: "Mobile Sticky", dims: "320×50 / 320×100", desc: "Persistent footer ad on mobile devices. Cannot be missed.", icon: Zap },
];

const AUDIENCE = [
    { icon: Users, title: "Gamers who read", value: "Long-form", note: "Deep dives and reviews, not headline scrolling" },
    { icon: Globe, title: "Global reach", value: "Worldwide", note: "Balkans-founded, US and EU audience" },
    { icon: Cpu, title: "Hardware enthusiasts", value: "PC & console", note: "People who research before they buy" },
    { icon: ShoppingCart, title: "Active buyers", value: "High intent", note: "They come to decide, not to browse" },
];

const BEYOND = [
    { icon: Shield, title: "Brand Storytelling", desc: "Share your announcements through PR and promo articles. We give your launches the context they need, ensuring your message lands with impact." },
    { icon: Video, title: "Video & Social", desc: "Short-form video content (Reels/TikTok) and social media blasts that reach gamers where they scroll." },
    { icon: MousePointerClick, title: "Giveaways", desc: "High-engagement campaigns that drive traffic and social following. You provide the loot, we bring the crowd." },
];

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
    return (
        <div className="mb-6">
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                <span aria-hidden className="w-[3px] h-[14px] rounded-full bg-[var(--accent)]" />
                {children}
            </h2>
            {sub && <p className="mt-2.5 max-w-2xl text-[13px] text-[var(--ink-low)] leading-relaxed">{sub}</p>}
        </div>
    );
}

export default function MarketingClient() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Advertising & Partnerships"
                description="Connect with a passionate audience of gamers, tech enthusiasts, and early adopters."
                iconNode={<Megaphone className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />}
            />

            <div className="container-page py-10 md:py-14 space-y-10 md:space-y-14">
                <section className="tp-fade-up tp-d1 max-w-3xl">
                    <SectionTitle>More than impressions</SectionTitle>
                    <div className="space-y-4 text-[14.5px] text-[var(--ink-mid)] leading-relaxed">
                        <p>
                            TechPlay isn&apos;t just another content farm. We&apos;re a community-driven hub where
                            gamers come for deep dives, honest reviews, and tech analysis.
                        </p>
                        <p>
                            When you advertise with us, you&apos;re not just buying pixels — you&apos;re starting a
                            conversation with an audience that actually listens, researches, and invests in their setup.
                        </p>
                    </div>
                </section>

                <section className="tp-fade-up tp-d2">
                    <SectionTitle>Who reads TechPlay</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {AUDIENCE.map((a) => (
                            <div
                                key={a.title}
                                className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5"
                            >
                                <span className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-4">
                                    <a.icon className="w-[18px] h-[18px]" />
                                </span>
                                <p className="font-display text-[12px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                                    {a.title}
                                </p>
                                <p className="mt-1 font-display text-[19px] font-black text-[var(--ink-hi)] leading-tight">
                                    {a.value}
                                </p>
                                <p className="mt-1.5 text-[12.5px] text-[var(--ink-low)] leading-snug">{a.note}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="tp-fade-up tp-d3 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">
                    <div>
                        <SectionTitle sub="We support all IAB standard ad units, optimized for performance and visibility without ruining the user experience.">
                            Standard advertising units
                        </SectionTitle>
                        <div className="space-y-3">
                            {AD_SPECS.map((spec) => (
                                <div key={spec.name} className="flex items-start gap-3.5 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-4">
                                    <span className="inline-flex w-9 h-9 shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center">
                                        <spec.icon className="w-4 h-4" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)]">{spec.name}</span>
                                            <span className="rounded border border-[var(--line)] bg-[var(--fill-1)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--ink-faint)]">
                                                {spec.dims}
                                            </span>
                                        </span>
                                        <span className="mt-1 block text-[12.5px] text-[var(--ink-low)] leading-snug">{spec.desc}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Panel title="Where they sit" variant="console" className="lg:sticky lg:top-24">
                        <div className="space-y-3" aria-hidden>
                            <div className="h-20 rounded-[var(--radius-inner)] border border-dashed border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--fill-1)] flex items-center justify-center font-mono text-[11px] text-[var(--accent)]">
                                Billboard 970×250
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-3">
                                    <div className="h-3 w-3/4 rounded bg-[var(--fill-2)]" />
                                    <div className="h-3 w-full rounded bg-[var(--fill-2)]" />
                                    <div className="h-3 w-5/6 rounded bg-[var(--fill-2)]" />
                                    <div className="h-12 rounded-[var(--radius-inner)] border border-dashed border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--fill-1)] flex items-center justify-center font-mono text-[10.5px] text-[var(--accent)]">
                                        Leaderboard 728×90
                                    </div>
                                    <div className="h-3 w-full rounded bg-[var(--fill-2)]" />
                                    <div className="h-3 w-2/3 rounded bg-[var(--fill-2)]" />
                                </div>
                                <div className="w-[38%] h-[136px] rounded-[var(--radius-inner)] border border-dashed border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--fill-1)] flex items-center justify-center text-center font-mono text-[10.5px] text-[var(--accent)]">
                                    Rectangle<br />300×250
                                </div>
                            </div>
                            <div className="h-8 rounded-[var(--radius-inner)] border border-dashed border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--fill-1)] flex items-center justify-center font-mono text-[10.5px] text-[var(--accent)]">
                                Mobile sticky 320×50
                            </div>
                        </div>
                    </Panel>
                </section>

                <section className="tp-fade-up tp-d4">
                    <SectionTitle sub="Display is great, but story is better. We specialize in custom integrations that cut through banner blindness.">
                        Beyond the banner
                    </SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {BEYOND.map((item) => (
                            <Panel key={item.title} title={item.title}>
                                <span className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-3.5">
                                    <item.icon className="w-[18px] h-[18px]" />
                                </span>
                                <p className="text-[13px] text-[var(--ink-low)] leading-relaxed">{item.desc}</p>
                            </Panel>
                        ))}
                    </div>
                </section>

                <section className="tp-fade-up tp-d5 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-8 text-center">
                    <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)] mb-3">
                        Let&apos;s talk business
                    </h2>
                    <p className="mx-auto mb-6 max-w-2xl text-[13.5px] text-[var(--ink-low)] leading-relaxed">
                        We don&apos;t do &ldquo;one size fits all&rdquo; pricing. Every campaign is unique. Tell us
                        your budget and goals, and we&apos;ll craft a plan that works.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <a
                            href="mailto:marketing@techplay.gg"
                            className="btn-command inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                        >
                            <Mail className="w-4 h-4" /> marketing@techplay.gg
                        </a>
                        <Link
                            href="/media-kit"
                            className="btn-command btn-command-quiet inline-flex items-center gap-2 h-11 px-6 bg-[var(--fill-2)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            <Download className="w-4 h-4" /> View Media Kit
                        </Link>
                    </div>

                    <p className="mt-6 text-[12px] text-[var(--ink-faint)]">Agency? Ask for our agency rate card.</p>
                </section>
            </div>
        </main>
    );
}
