import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { generatePageMetadata } from "@/lib/seo";

/*
 * The tools, on one page.
 *
 * The header has offered a Tools menu with an "All Tools" link since the menu
 * was built, and that link pointed at /wow-analyzer — one of the five. /tools
 * answered 404. So the five most involved things on this site, the ones that
 * are not articles, had no page that collected them and no single URL to link
 * to from anywhere else.
 */

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/tools", {
        title: "Gaming Tools",
        description:
            "Five tools built here: a WoW character readiness check, a backlog advisor that reads your own library, community game lists, the GTA 6 hub and The Last Disc.",
        keywords: ["gaming tools", "wow character check", "backlog advisor", "gta 6 map", "game lists"],
    });
}

export default function ToolsPage() {
    const url = "https://techplay.gg/tools";

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://techplay.gg" },
            { "@type": "ListItem", position: 2, name: "Tools", item: url },
        ],
    };

    /*
     * ItemList rather than CollectionPage: the order is the page's own — most
     * used first — and naming the five with their URLs is the fact worth
     * stating. A CollectionPage would say "this page collects things" without
     * saying which.
     */
    const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "TechPlay gaming tools",
        url,
        numberOfItems: TOOLS.length,
        itemListElement: TOOLS.map((tool, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: tool.name,
            description: tool.blurb,
            url: `https://techplay.gg${tool.href}`,
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

            <div className="container-page py-10 md:py-14">
                <header className="max-w-[640px]">
                    <p className="font-display text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                        TechPlay
                    </p>
                    <h1 className="mt-2 font-display text-[30px] md:text-[38px] font-black leading-[1.05] tracking-[-0.01em] text-white">
                        Gaming Tools
                    </h1>
                    <p className="mt-3 text-[14px] leading-relaxed text-white/70">
                        The things here that are not articles. Each one answers a question a list of news cannot.
                    </p>
                </header>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {TOOLS.map((tool) => {
                        const Icon = tool.icon;

                        return (
                            <Link
                                key={tool.href}
                                href={tool.href}
                                className="group flex flex-col rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] p-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] bg-white/[0.05] text-[var(--accent)]">
                                    <Icon className="h-[18px] w-[18px]" />
                                </span>

                                <h2 className="mt-4 font-display text-[16px] font-black uppercase tracking-[0.04em] text-white">
                                    {tool.name}
                                </h2>

                                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-white/70">
                                    {tool.blurb}
                                </p>

                                <span className="mt-4 inline-flex items-center gap-1.5 font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/55 transition-colors group-hover:text-[var(--accent)]">
                                    Open
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
