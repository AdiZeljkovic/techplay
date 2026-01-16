"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
    // Generate JSON-LD structured data for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.label,
            "item": item.href ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}${item.href}` : undefined
        }))
    };

    return (
        <>
            {/* JSON-LD for Google Rich Results */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Visual Breadcrumbs */}
            <nav
                aria-label="Breadcrumb"
                className={`flex items-center gap-1 text-sm text-[var(--text-muted)] ${className}`}
            >
                {/* Home Icon */}
                <Link
                    href="/"
                    className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors p-1 rounded"
                    aria-label="Home"
                >
                    <Home className="w-4 h-4" />
                </Link>

                {items.map((item, index) => (
                    <span key={index} className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-[var(--text-muted)]/50" />
                        {item.href && index < items.length - 1 ? (
                            <Link
                                href={item.href}
                                className="hover:text-[var(--accent)] transition-colors px-1 py-0.5 rounded hover:bg-white/5"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span
                                className="text-[var(--text-secondary)] font-medium truncate max-w-[200px] md:max-w-[400px]"
                                aria-current="page"
                            >
                                {item.label}
                            </span>
                        )}
                    </span>
                ))}
            </nav>
        </>
    );
}
