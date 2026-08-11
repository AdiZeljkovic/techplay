import Link from "next/link";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";
import { Target, Zap, Heart, Globe, Shield, Users, ArrowRight } from "lucide-react";

/**
 * About — the first of the static pages brought onto the current language.
 *
 * It used to hand-roll every card, drive its own framer-motion choreography
 * per section, and fill a 400px block with floating icons over a gradient.
 * Panel's own note rules that out: gradients and corner blooms read as
 * decoration, and the approved tone is a matte instrument panel where the
 * content is the only thing that glows.
 *
 * Not a client component any more. Nothing here reacts to anything, so the
 * entrance is the shared `tp-fade-up` choreography in CSS and framer-motion
 * leaves this route's bundle entirely.
 */

const VALUES = [
    { icon: Target, title: "We Actually Test Things", desc: "Benchmarks, stress tests, daily use. We don't copy-paste press releases and call it a review." },
    { icon: Shield, title: "No Sponsored Bullshit", desc: "If a product sucks, we'll tell you. Even if the brand sent us 10 units for free." },
    { icon: Users, title: "Community First", desc: "You guys keep the lights on, not advertisers. Your trust matters more than any partnership deal." },
    { icon: Heart, title: "We're Gamers Too", desc: "Our writers grind ranked, debate console wars in Slack, and spend paychecks on RGB. We get it." },
    { icon: Zap, title: "Fast & Accurate", desc: "Breaking news drops while it's still fresh. Deep dives go live when we've tested everything twice." },
    { icon: Globe, title: "For Everyone", desc: "Whether you're building a €3000 rig or gaming on a laptop from 2015, you belong here." },
];

const COVERAGE = [
    { title: "Hardware Reviews", items: ["GPUs, CPUs, and motherboards", "Gaming laptops and peripherals", "Monitors, mice, keyboards", "Real-world benchmarks"] },
    { title: "Game Coverage", items: ["Day-one reviews (no spoilers)", "Patch notes breakdowns", "Indie game spotlights", "Performance analysis"] },
    { title: "Guides & Tutorials", items: ["PC building for beginners", "Optimization guides", "Troubleshooting common issues", "Settings deep dives"] },
    { title: "Industry News", items: ["Game announcements", "Tech releases and rumors", "Esports updates", "Developer interviews"] },
];

const STORY = [
    "TechPlay started back in 2020 as a small blog covering local gaming news from the Balkans. Gaming has always been in our blood — late-night sessions, heated debates about which console is better, and that constant itch to know what's coming next.",
    "What began as a passion project quickly grew into something bigger. We realized there was a gap: people wanted honest takes on games and tech, not recycled press releases dressed up as reviews.",
    "Today, we cover everything from the latest AAA releases and esports drama to hardware reviews and that weird indie game everyone's sleeping on. Gaming isn't just what we write about — it's what we do when the keyboards go silent.",
];

/** Section heading, same treatment the homepage rails use. */
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
    return (
        <div className="mb-6">
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                <span aria-hidden className="w-[3px] h-[14px] rounded-full bg-[var(--accent)]" />
                {children}
            </h2>
            {sub && <p className="mt-2.5 text-[13px] text-[var(--ink-low)] leading-relaxed">{sub}</p>}
        </div>
    );
}

export default function AboutClient() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="About TechPlay"
                description="Built by gamers, for gamers. Just honest gaming and tech talk."
            />

            <div className="container-page py-10 md:py-14 space-y-10 md:space-y-14">
                <section className="tp-fade-up tp-d1 max-w-3xl">
                    <SectionTitle>What We Do</SectionTitle>
                    <div className="space-y-4 text-[14.5px] text-[var(--ink-mid)] leading-relaxed">
                        <p>
                            We test hardware until it breaks. We play games until 4 AM to write honest reviews.
                            We dig through patch notes so you don&apos;t have to. And we do it because we genuinely
                            care about this stuff — not because some PR agency asked nicely.
                        </p>
                        <p>
                            TechPlay exists to answer one simple question: &ldquo;Is this actually worth buying?&rdquo;
                            No fluff, no sponsored hot takes, just real opinions from people who spend their own
                            money on gear.
                        </p>
                    </div>
                </section>

                <section className="tp-fade-up tp-d2">
                    <SectionTitle>Core Values</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {VALUES.map((item) => (
                            <div
                                key={item.title}
                                className="group rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                            >
                                <span className="inline-flex w-9 h-9 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-4">
                                    <item.icon className="w-[18px] h-[18px]" />
                                </span>
                                <h3 className="font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-2 group-hover:text-[var(--accent)] transition-colors duration-300">
                                    {item.title}
                                </h3>
                                <p className="text-[13px] text-[var(--ink-low)] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="tp-fade-up tp-d3 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
                    <div>
                        <SectionTitle>Our Story</SectionTitle>
                        <div className="space-y-4 text-[14px] text-[var(--ink-mid)] leading-relaxed">
                            {STORY.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
                            <p className="text-[var(--ink-hi)] font-semibold">
                                We&apos;re not the biggest, but gaming runs in our veins. And we&apos;re just getting started.
                            </p>
                        </div>
                    </div>

                    <Panel title="By the numbers" variant="console" className="lg:sticky lg:top-24">
                        <dl className="divide-y divide-[var(--line)]">
                            {[
                                ["2020", "Founded"],
                                ["0", "Sponsored reviews"],
                                ["∞", "Gaming hours"],
                            ].map(([value, label]) => (
                                <div key={label} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{label}</dt>
                                    <dd className="font-display text-[22px] font-black tabular-nums text-[var(--ink-hi)]">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>
                </section>

                <section className="tp-fade-up tp-d4">
                    <SectionTitle sub="We cover the full spectrum of gaming and tech. Here's what to expect.">
                        What You&apos;ll Find Here
                    </SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {COVERAGE.map((category) => (
                            <Panel key={category.title} title={category.title}>
                                <ul className="space-y-2.5">
                                    {category.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--ink-low)] leading-snug">
                                            <span aria-hidden className="mt-[6px] w-1 h-1 rounded-full bg-[var(--accent)] shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Panel>
                        ))}
                    </div>
                </section>

                <section className="tp-fade-up tp-d5 flex flex-col items-center gap-4 py-4 text-center">
                    <p className="text-[13px] text-[var(--ink-low)]">
                        Questions? Suggestions? Think we missed something important?
                    </p>
                    <Link
                        href="/contact"
                        className="btn-command inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                    >
                        Get in Touch
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </section>
            </div>
        </main>
    );
}
