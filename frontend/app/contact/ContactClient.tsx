import { MessageSquare, Briefcase, HelpCircle, Phone, Mail } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";
import ContactForm from "./ContactForm";

/**
 * Contact — everything except the form renders on the server.
 *
 * The page was one client component because of the form's four pieces of
 * state, so the hero, three inbox cards and a postal address were all shipped
 * as JavaScript to draw text that never changes. The form moved to
 * ContactForm; this is the page around it.
 */

const INBOXES = [
    {
        icon: MessageSquare,
        title: "General & Editorial",
        desc: "News tips, game review requests, press releases, or just saying hi.",
        email: "redakcija@techplay.gg",
    },
    {
        icon: Briefcase,
        title: "Advertising & Partnerships",
        desc: "Want to advertise or partner with us? Let's talk rates and options.",
        email: "marketing@techplay.gg",
    },
    {
        icon: HelpCircle,
        title: "Technical Support",
        desc: "Site broken? Can't log in? Comments not working? We'll fix it.",
        email: "support@techplay.gg",
    },
];

export default function ContactClient() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Contact Us"
                description="Questions, tips, or partnership ideas — pick the right inbox and we'll answer."
                iconNode={<Mail className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />}
            />

            <div className="container-page py-10 md:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">
                    <div className="tp-fade-up tp-d1 space-y-4">
                        <p className="text-[14px] text-[var(--ink-mid)] leading-relaxed">
                            We actually read our emails (shocking, we know). Whether you&apos;ve got a news tip,
                            want your game reviewed, or just found a typo that&apos;s driving you nuts — hit the
                            right inbox below and we&apos;ll get back to you.
                        </p>

                        {INBOXES.map((inbox) => (
                            <a
                                key={inbox.email}
                                href={`mailto:${inbox.email}`}
                                className="group flex items-start gap-4 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                            >
                                <span className="inline-flex w-10 h-10 shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center">
                                    <inbox.icon className="w-[18px] h-[18px]" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)] group-hover:text-[var(--accent)] transition-colors duration-300">
                                        {inbox.title}
                                    </span>
                                    <span className="block mt-1 text-[12.5px] text-[var(--ink-low)] leading-snug">{inbox.desc}</span>
                                    <span className="block mt-1.5 text-[12.5px] font-semibold text-[var(--accent)]">{inbox.email}</span>
                                </span>
                            </a>
                        ))}

                        <Panel title="Visit us / mail us">
                            <address className="not-italic text-[13px] text-[var(--ink-low)] leading-relaxed">
                                <strong className="text-[var(--ink-hi)]">Luminor Solutions</strong><br />
                                71000 Sarajevo<br />
                                Bosnia and Herzegovina
                            </address>
                            <p className="mt-3.5 pt-3.5 border-t border-[var(--line)] flex items-center gap-2 text-[12.5px] text-[var(--ink-faint)]">
                                <Phone className="w-3.5 h-3.5" />
                                +387 62 574 783
                            </p>
                        </Panel>
                    </div>

                    <div className="tp-fade-up tp-d2">
                        <Panel title="Send us a message" variant="console">
                            <p className="mb-6 text-[12.5px] text-[var(--ink-low)] leading-relaxed">
                                We try to respond within 24–48 hours. Weekends might take a bit longer (we&apos;re human).
                            </p>
                            <ContactForm />
                        </Panel>
                    </div>
                </div>
            </div>
        </main>
    );
}
