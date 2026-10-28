import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ActionLink } from "@/components/gw2/Gw2Ui";

/**
 * A card that opens a part of the public reference — a section of the
 * database, or one guide.
 *
 * The recommendation card without the account in it: title, a few lines, the
 * full-width button at the foot. The title is a link as well as the button,
 * because on a page a crawler reads the title is the anchor text that says what
 * is behind it — "Read the guide" five times over says nothing.
 *
 * No `"use client"`: the public pages are server-rendered and this renders
 * with them.
 */
export default function ReferenceCard({
    href,
    title,
    body,
    cta,
    eyebrow,
    meta,
    image,
}: {
    href: string;
    title: string;
    body?: string | null;
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
            className="flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] border"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
        >
            {image && (
                <div className="relative h-32 shrink-0 border-b" style={{ borderColor: "var(--line)" }}>
                    <Image src={image} alt="" fill unoptimized sizes="400px" className="object-cover" />
                </div>
            )}

            <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="space-y-1.5">
                    {eyebrow && <p className="text-xs font-medium text-[var(--ink-low)]">{eyebrow}</p>}
                    <h3 className="font-display text-lg font-semibold leading-snug text-[var(--ink-hi)]">
                        <Link href={href} className="transition-colors hover:text-[var(--accent-ink)]">
                            {title}
                        </Link>
                    </h3>
                    {body && <p className="line-clamp-4 text-sm leading-relaxed text-[var(--ink-mid)]">{body}</p>}
                </div>

                {meta && <div className="text-xs text-[var(--ink-low)]">{meta}</div>}

                <div className="mt-auto pt-1">
                    <ActionLink href={href}>
                        {cta}
                    </ActionLink>
                </div>
            </div>
        </article>
    );
}
