import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The head of every /gw2 page, drawn the way the mockups draw it: a small
 * spaced eyebrow, a large title in sentence case, a line under it, and a scene
 * on the right that fades into the page on its left and bottom edges.
 *
 * It replaces the site's `PageHero` inside the tool because that one is
 * full-bleed and centred, and inside the tool's frame it would sit under the
 * menu and centre itself on a column it does not own.
 *
 * The scenes are ours to make (see `gw2/REDIZAJN.md` §5) — ArenaNet's art is
 * not ours to use until the site's status with them is settled. Until a page
 * has its scene, the corner carries a wash in the page's own colour, which is
 * the mockup's lighting without a picture under it. No `"use client"`: server
 * pages render this directly.
 */
export default function Gw2Hero({
    title,
    description,
    eyebrow = "Guild Wars 2",
    art,
    tone = "var(--accent)",
    back,
    children,
}: {
    title: string;
    description?: string;
    eyebrow?: string;
    /** A file under /images/gw2/, once it exists. */
    art?: string;
    /** The page's domain colour, from `DOMAIN_TONE`; the site accent otherwise. */
    tone?: string;
    /** A step up, for pages that sit under another one. */
    back?: { href: string; label: string };
    children?: ReactNode;
}) {
    return (
        <header
            className="relative mb-6 mt-4 overflow-hidden rounded-[var(--radius-panel)] border lg:mt-6"
            style={{ borderColor: "var(--line)", background: "var(--surface-1)" }}
        >
            {art ? (
                <>
                    <Image
                        src={art}
                        alt=""
                        aria-hidden
                        fill
                        priority
                        sizes="(min-width: 1024px) 1200px, 100vw"
                        className="object-cover object-right"
                    />
                    {/* The text side has to stay readable whatever the scene does. */}
                    <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(90deg, var(--surface-1) 18%, color-mix(in srgb, var(--surface-1) 72%, transparent) 46%, transparent 82%)",
                        }}
                    />
                </>
            ) : (
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(55% 150% at 100% 0%, color-mix(in srgb, ${tone} 20%, transparent), transparent 70%), radial-gradient(35% 90% at 80% 110%, color-mix(in srgb, ${tone} 9%, transparent), transparent 70%)`,
                    }}
                />
            )}
            <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-16"
                style={{ background: "linear-gradient(to top, var(--surface-1), transparent)" }}
            />

            <div className="relative px-5 py-6 md:px-8 md:py-9 lg:py-11">
                {back && (
                    <Link
                        href={back.href}
                        className="mb-3 inline-flex items-center gap-1 text-xs text-[var(--ink-low)] transition-colors hover:text-[var(--ink-hi)]"
                    >
                        <ChevronLeft size={14} aria-hidden />
                        {back.label}
                    </Link>
                )}

                <p className="flex items-center gap-2.5 text-[10.5px] font-medium uppercase tracking-[0.32em] text-[var(--ink-low)]">
                    <span aria-hidden className="h-px w-6" style={{ background: tone }} />
                    {eyebrow}
                </p>

                <h1 className="mt-3 max-w-[22ch] font-display text-[28px] font-bold leading-[1.08] text-[var(--ink-hi)] text-balance md:text-[40px] lg:text-[44px]">
                    {title}
                </h1>

                {description && (
                    <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-mid)] md:text-[15px]">
                        {description}
                    </p>
                )}

                {children && <div className="mt-5">{children}</div>}
            </div>
        </header>
    );
}
