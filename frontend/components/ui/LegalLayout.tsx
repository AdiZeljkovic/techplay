import type { LucideIcon, } from "lucide-react";
import { Calendar } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";

/**
 * The shell the three legal documents share.
 *
 * Privacy, Terms and Cookies were three copies of the same page: the same
 * sticky sidebar, the same hand-built "Last Updated" box, the same prose
 * wrapper with the same six colour overrides pasted into each. Editing the
 * look meant editing it three times, and they had already drifted.
 *
 * The document itself stays in its own file — that is the part that differs.
 * Everything around it lives here, and none of it is interactive, so all three
 * pages render on the server and ship no JavaScript of their own.
 */

/** Prose colours as ink tokens, so the documents follow the theme like everything else. */
const PROSE = [
    "prose prose-invert max-w-none",
    "prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wide",
    "prose-h2:text-[15px] prose-h2:text-[var(--ink-hi)] prose-h2:mt-10 prose-h2:mb-3",
    "prose-h3:text-[13px] prose-h3:text-[var(--ink-hi)] prose-h3:mt-6 prose-h3:mb-2",
    "prose-p:text-[14px] prose-p:leading-relaxed prose-p:text-[var(--ink-mid)]",
    "prose-li:text-[14px] prose-li:text-[var(--ink-mid)]",
    "prose-strong:text-[var(--ink-hi)]",
    "prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline",
].join(" ");

interface LegalLayoutProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    /** Printed as written — these are dates of record, not something to format. */
    lastUpdated: string;
    /** The short version, for someone who will not read the long one. */
    keyPoints?: { icon: LucideIcon; text: string }[];
    children: React.ReactNode;
}

export default function LegalLayout({
    title,
    description,
    icon: Icon,
    lastUpdated,
    keyPoints = [],
    children,
}: LegalLayoutProps) {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title={title}
                description={description}
                iconNode={Icon ? <Icon className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} /> : undefined}
            />

            <div className="container-page py-10 md:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
                    <aside className="tp-fade-up tp-d1 space-y-4 lg:sticky lg:top-24">
                        <Panel title="Last updated" variant="console">
                            <p className="flex items-center gap-2.5 font-display text-[17px] font-bold text-[var(--ink-hi)]">
                                <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" />
                                {lastUpdated}
                            </p>
                        </Panel>

                        {keyPoints.length > 0 && (
                            <Panel title="The short version">
                                <ul className="space-y-3">
                                    {keyPoints.map((point) => (
                                        <li key={point.text} className="flex items-start gap-2.5">
                                            <point.icon className="w-4 h-4 text-[var(--accent)] shrink-0 mt-[1px]" />
                                            <span className="text-[12.5px] text-[var(--ink-low)] leading-snug">{point.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Panel>
                        )}
                    </aside>

                    <article className="tp-fade-up tp-d2 rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] p-6 md:p-9">
                        <div className={PROSE}>{children}</div>
                    </article>
                </div>
            </div>
        </main>
    );
}
