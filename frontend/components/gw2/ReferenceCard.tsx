import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ActionLink } from "@/components/gw2/Gw2Ui";

/**
 * A card that opens a part of the public reference — a section of the
 * database, or one guide.
 *
 * The mockups' recommendation card without the account in it: ringed icon,
 * title, a few lines, the full-width button at the foot, all in the colour of
 * what it opens. The title is a link as well as the button, because on a page
 * a crawler reads the title is the anchor text that says what is behind it —
 * "Read the guide" five times over says nothing.
 *
 * No `"use client"`: the public pages are server-rendered and this renders
 * with them.
 */
export default function ReferenceCard({
    href,
    icon,
    title,
    body,
    tone,
    cta,
    eyebrow,
    meta,
    image,
}: {
    href: string;
    icon: ReactNode;
    title: string;
    body?: string | null;
    tone: string;
    /** The button's label. */
    cta: string;
    eyebrow?: string;
    /** A figure or a date under the text. */
    meta?: ReactNode;
    /**
     * A picture across the top, when there is one. Passed through unoptimized:
     * a guide's image is a free-text field in the admin and can point anywhere,
     * and only our own uploads are configured for the optimizer.
     */
    image?: string | null;
}) {
    return (
        <article
            className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] border"
            style={{
                background: "var(--surface-1)",
                borderColor: `color-mix(in srgb, ${tone} 32%, var(--line-strong))`,
            }}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(80% 60% at 0% 0%, color-mix(in srgb, ${tone} 12%, transparent), transparent 70%)` }}
            />

            {image && (
                <div className="relative h-32 shrink-0">
                    <Image src={image} alt="" fill unoptimized sizes="400px" className="object-cover" />
                    <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, var(--surface-1), transparent 70%)" }}
                    />
                </div>
            )}

            <div className="relative flex flex-1 flex-col gap-3 p-5">
                <span
                    aria-hidden
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2"
                    style={{
                        color: tone,
                        borderColor: `color-mix(in srgb, ${tone} 70%, transparent)`,
                        boxShadow: `0 0 18px color-mix(in srgb, ${tone} 25%, transparent)`,
                    }}
                >
                    {icon}
                </span>

                <div className="space-y-1.5">
                    {eyebrow && (
                        <p className="text-[10.5px] font-medium uppercase tracking-[0.2em]" style={{ color: tone }}>
                            {eyebrow}
                        </p>
                    )}
                    <h3 className="font-display text-lg font-bold leading-snug text-[var(--ink-hi)]">
                        <Link href={href} className="transition-colors hover:text-[var(--accent-ink)]">
                            {title}
                        </Link>
                    </h3>
                    {body && <p className="line-clamp-4 text-sm leading-relaxed text-[var(--ink-mid)]">{body}</p>}
                </div>

                {meta && <div className="text-xs text-[var(--ink-low)]">{meta}</div>}

                <div className="mt-auto pt-1">
                    <ActionLink href={href} tone={tone}>
                        {cta}
                    </ActionLink>
                </div>
            </div>
        </article>
    );
}
