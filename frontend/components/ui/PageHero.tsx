"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

/**
 * The backdrop every page on this hero gets unless it asks for another.
 *
 * It arrived as the feed's own art and there was no reason for it to stay
 * there: fifteen pages share this component, and fourteen of them were
 * opening on a flat accent wash while one had a picture. A shared hero that
 * looks different per page is not a shared hero.
 */
const HOUSE_BACKDROP = "/images/page-hero.webp";

interface CategoryItem {
    id: string; // The backend ID/Slug used for filtering
    label: string;
    icon: LucideIcon;
    slug?: string; // The URL slug (optional, defaults to id if not provided)
}

interface PageHeroProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    /**
     * An already-rendered icon, for callers that are server components.
     * A Lucide icon is a function, and a function cannot cross from a server
     * component into a client one — LegalLayout hit exactly that. Rendering it
     * on the caller's side turns it into an element, which travels fine.
     * Ignored when `icon` is given.
     */
    iconNode?: React.ReactNode;
    /**
     * Full-bleed backdrop. Defaults to the house hero art so every page on
     * this component opens the same way; pass a different path to override it,
     * or an empty string for the plain accent wash.
     */
    backgroundImage?: string;
    categories?: CategoryItem[];
    /**
     * How big the category row is drawn. Most heroes use it as a filter strip
     * and want it quiet; the feed uses it to ask which feed you are reading,
     * which is the page's first question and deserves the size of one.
     */
    categorySize?: "sm" | "lg";
    selectedCategory?: string; // The ID currently selected
    onSelectCategory?: (id: string) => void;
    basePath?: string; // If provided, uses Links instead of buttons
    categoryBase?: string; // Optional override for category links (e.g. /news/category)
}

/**
 * The shared hero for the pages that don't have a bespoke one — shop, support,
 * the legal set, marketing. Same shape as the hand-built heroes: centred title
 * over an optional backdrop, the last word in the accent.
 */
export default function PageHero({
    title,
    description = "",
    icon: MainIcon,
    iconNode,
    backgroundImage = HOUSE_BACKDROP,
    categories,
    categorySize = "sm",
    selectedCategory,
    onSelectCategory,
    basePath,
    categoryBase
}: PageHeroProps) {
    // The accent belongs on the word that names the thing, which in English
    // headings is the last one — "About TechPlay", "Secure Checkout".
    const words = title.trim().split(" ");
    const lead = words.slice(0, -1).join(" ");
    const tail = words[words.length - 1];

    return (
        <section className="relative w-full mb-10 overflow-hidden border-b border-white/[0.07] bg-[var(--surface-0)]">
            {backgroundImage ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={backgroundImage}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_45%,rgba(5,7,10,0.82),rgba(5,7,10,0.55)_72%)]" />
                </>
            ) : (
                <span
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(70%_130%_at_50%_-15%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_62%)]"
                />
            )}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

            <div className="relative z-10 container-page pt-12 pb-9 flex flex-col items-center text-center">
                {(MainIcon || iconNode) && (
                    <span className="w-12 h-12 rounded-[var(--radius-panel)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center mb-4">
                        {MainIcon
                            ? <MainIcon className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />
                            : iconNode}
                    </span>
                )}

                <h1 className="font-display text-3xl md:text-5xl font-black uppercase leading-none tracking-tight">
                    {lead && <span className="text-white">{lead} </span>}
                    <span className="text-[var(--accent)]">{tail}</span>
                </h1>

                {description && (
                    <p className="mt-3 max-w-2xl text-[13.5px] md:text-[14.5px] text-white/45 leading-relaxed">
                        {description}
                    </p>
                )}

                {categories && categories.length > 0 && (
                    <div className={cn("max-w-full flex flex-wrap justify-center overflow-x-auto scrollbar-hide", categorySize === "lg" ? "mt-8 gap-2.5" : "mt-7 gap-1.5")}>
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            const big = categorySize === "lg";
                            const pill = cn(
                                "inline-flex items-center border font-display font-black uppercase transition-colors whitespace-nowrap shrink-0",
                                big
                                    ? "gap-2.5 h-11 px-6 rounded-[10px] text-[12px] tracking-[0.12em]"
                                    : "gap-1.5 h-8 px-3.5 rounded-[8px] text-[9.5px] tracking-[0.1em]",
                                isSelected
                                    ? "bg-[var(--accent)] border-transparent text-white"
                                    : "bg-white/[0.04] border-white/[0.1] text-white/55 hover:text-white hover:border-white/25"
                            );
                            const glyph = (
                                <cat.icon
                                    className={cn(big ? "w-[17px] h-[17px]" : "w-3.5 h-3.5", isSelected ? "text-white" : "text-[var(--accent)]")}
                                />
                            );

                            if (basePath) {
                                return (
                                    <Link
                                        key={cat.id}
                                        href={cat.slug === "all" ? basePath : `${categoryBase || basePath}/${cat.slug}`}
                                        className={pill}
                                    >
                                        {glyph} {cat.label}
                                    </Link>
                                );
                            }

                            return (
                                <button key={cat.id} onClick={() => onSelectCategory && onSelectCategory(cat.id)} className={pill}>
                                    {glyph} {cat.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
