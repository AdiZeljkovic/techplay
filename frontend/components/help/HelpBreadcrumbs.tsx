import { ChevronRight } from "lucide-react";
import { HELP_URL } from "@/lib/help";

/**
 * The trail, and the BreadcrumbList that goes with it.
 *
 * Not `components/seo/Breadcrumbs.tsx`, and the reason is a single line in it:
 * that component builds every absolute URL in its JSON-LD from
 * NEXT_PUBLIC_APP_URL, which is techplay.gg. On this hostname that would
 * describe a hierarchy of pages that do not exist — Google would be told this
 * answer sits under techplay.gg/connections, follow it, and find nothing.
 *
 * It is also a client component, and there is nothing here to hydrate.
 */
export default function HelpBreadcrumbs({
    trail,
}: {
    /** Root first, current page last. The last one is never a link. */
    trail: { label: string; href?: string }[];
}) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((step, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: step.label,
            // Google wants an absolute URL on every item but the last, and
            // wants the last one left without one.
            ...(i < trail.length - 1 && step.href
                ? { item: `${HELP_URL}${step.href === "/" ? "/" : step.href}` }
                : {}),
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap text-[12px]">
                {trail.map((step, i) => {
                    const last = i === trail.length - 1;

                    return (
                        <span key={`${step.label}-${i}`} className="flex items-center gap-1.5">
                            {i > 0 && (
                                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "var(--ink-low)" }} aria-hidden />
                            )}

                            {last || !step.href ? (
                                <span style={{ color: "var(--ink-mid)" }} aria-current="page">
                                    {step.label}
                                </span>
                            ) : (
                                <a
                                    href={step.href}
                                    className="hover:text-[var(--accent)] transition-colors"
                                    style={{ color: "var(--ink-low)" }}
                                >
                                    {step.label}
                                </a>
                            )}
                        </span>
                    );
                })}
            </nav>
        </>
    );
}
