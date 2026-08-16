"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BoardMarkComponent } from "@/lib/forum";

/**
 * One frame for every forum page.
 *
 * Each page had built its own opening: the category page a back-link and an
 * icon block, the thread page a breadcrumb and badges, search a 300px marketing
 * hero with a search icon in a box. Measured on production, the first line of
 * actual content sat at 782px on the thread page and 465px on search — while
 * the rest of the site had already been brought under 400px.
 *
 * So the header is a strip, not a stage: crumbs, a title with its action on the
 * same line, one line of description, and the counts as text rather than as
 * boxes. Everything below it is the page.
 */

export interface Crumb {
    label: string;
    href?: string;
}

export interface ForumStat {
    label: string;
    value: string | number;
}

export default function ForumShell({
    crumbs,
    title,
    description,
    mark: Mark,
    stats,
    action,
    rail,
    children,
}: {
    crumbs?: Crumb[];
    title: string;
    description?: string;
    mark?: BoardMarkComponent;
    stats?: ForumStat[];
    action?: React.ReactNode;
    rail?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
            {crumbs && crumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-4 pb-2 text-[11.5px]">
                    {crumbs.map((c, i) => (
                        <span key={`${c.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
                            {i > 0 && <ChevronRight aria-hidden className="w-3 h-3 shrink-0 text-white/20" />}
                            {c.href ? (
                                // Explicit colour: these inherit the document's link
                                // colour otherwise, and rendered visited-purple against
                                // a crimson site.
                                <Link
                                    href={c.href}
                                    className="truncate font-medium text-[var(--ink-low)] hover:text-[var(--accent-ink)] transition-colors"
                                >
                                    {c.label}
                                </Link>
                            ) : (
                                <span className="truncate font-medium text-[var(--ink-mid)]">{c.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            <header className="flex flex-wrap items-start gap-x-4 gap-y-3 pb-3">
                {Mark && (
                    <span
                        aria-hidden
                        className="mt-0.5 hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] text-[var(--accent)]"
                    >
                        <Mark className="h-[22px] w-[22px]" />
                    </span>
                )}

                <div className="min-w-0 flex-1">
                    <h1 className="font-display text-[22px] md:text-[26px] font-bold text-white leading-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-[13px] text-[var(--ink-low)] leading-snug max-w-[68ch]">
                            {description}
                        </p>
                    )}
                </div>

                {action && <div className="shrink-0">{action}</div>}
            </header>

            {stats && stats.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-y border-[var(--line)] py-2.5">
                    {stats.map((s) => (
                        <span key={s.label} className="flex items-baseline gap-1.5">
                            <span className="font-numeric text-[13px] text-white">{s.value}</span>
                            <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                                {s.label}
                            </span>
                        </span>
                    ))}
                </div>
            )}

            {/* The rail is a companion, not a second page: it stops being a column
                below xl, where it would squeeze the reading width instead. */}
            <div className={rail ? "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_324px] gap-6 py-5" : "py-5"}>
                <div className="min-w-0">{children}</div>
                {rail && <aside className="min-w-0">{rail}</aside>}
            </div>
        </div>
    );
}
