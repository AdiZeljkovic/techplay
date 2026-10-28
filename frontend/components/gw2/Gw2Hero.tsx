import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The head of every /gw2 page: where the page sits, a large title in sentence
 * case, a line under it, and a scene on the right.
 *
 * It replaces the site's `PageHero` inside the tool because that one is
 * full-bleed and centred, and inside the tool's frame it would sit under the
 * menu and centre itself on a column it does not own.
 *
 * The scenes come from ArenaNet's official asset kits (`HERO_ART` in
 * lib/gw2domain.ts says which and why), and a hero that shows one says whose it
 * is in the corner. The gradient here is not decoration: the scene darkens
 * towards the title so the title stays readable whatever the picture does —
 * the only kind of gradient the tool keeps (the mastery and Tonight renders
 * have the same, under their own text). No `"use client"`: server pages
 * render this directly.
 */
export default function Gw2Hero({
    title,
    description,
    eyebrow = "Guild Wars 2",
    art,
    back,
    children,
}: {
    title: string;
    description?: string;
    eyebrow?: string;
    /** A file under /images/gw2/ — one of `HERO_ART`. */
    art?: string;
    /** A step up, for pages that sit under another one. */
    back?: { href: string; label: string };
    children?: ReactNode;
}) {
    return (
        <header
            className="relative mb-6 mt-4 overflow-hidden rounded-[var(--radius-panel)] border lg:mt-6"
            style={{ borderColor: "var(--line-strong)", background: "var(--surface-1)" }}
        >
            {art && (
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
                    <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(90deg, var(--surface-1) 22%, color-mix(in srgb, var(--surface-1) 78%, transparent) 50%, color-mix(in srgb, var(--surface-1) 15%, transparent) 85%)",
                        }}
                    />
                </>
            )}

            <div className="relative px-5 py-6 md:px-8 md:py-9 lg:py-10">
                {back && (
                    <Link
                        href={back.href}
                        className="mb-3 inline-flex items-center gap-1 text-xs text-[var(--ink-low)] transition-colors hover:text-[var(--ink-hi)]"
                    >
                        <ChevronLeft size={14} aria-hidden />
                        {back.label}
                    </Link>
                )}

                <p className="text-xs font-medium text-[var(--ink-low)]">{eyebrow}</p>

                <h1 className="mt-2 max-w-[22ch] font-display text-[28px] font-bold leading-[1.1] text-[var(--ink-hi)] text-balance md:text-[38px]">
                    {title}
                </h1>

                {description && (
                    <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-mid)] md:text-[15px]">
                        {description}
                    </p>
                )}

                {children && <div className="mt-5">{children}</div>}
            </div>

            {art && (
                <span className="absolute bottom-2 right-3 text-[10px] text-[var(--ink-faint)]">Art © ArenaNet</span>
            )}
        </header>
    );
}
