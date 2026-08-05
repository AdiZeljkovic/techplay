"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, RefreshCw, Globe, Gamepad2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { decodeHtml } from "@/lib/decode";

interface CategoryItem {
    id: string;
    label: string;
    icon: LucideIcon;
    slug?: string;
}

interface FeaturedItem {
    slug: string;
    title: string;
    excerpt?: string | null;
    featured_image_url?: string | null;
    published_at?: string | null;
    created_at?: string | null;
    category?: { name?: string | null } | null;
}

interface NewsroomHeroProps {
    sectionLabel?: string;
    headline: string;
    headlineAccent?: string;
    tagline?: string;
    description?: string;
    stats?: { icon: LucideIcon; label: string }[];
    categories?: CategoryItem[];
    selectedCategory?: string;
    onSelectCategory?: (id: string) => void;
    basePath?: string;
    categoryBase?: string;
    featuredItem?: FeaturedItem;
    featuredBasePath?: string;
}

const DEFAULT_STATS = [
    { icon: RefreshCw, label: "Updated Daily" },
    { icon: Globe,     label: "Global Coverage" },
    { icon: Gamepad2,  label: "Built for Players" },
];

export default function NewsroomHero({
    sectionLabel = "TECHPLAY.GG NEWSROOM",
    headline,
    headlineAccent,
    tagline,
    description,
    stats = DEFAULT_STATS,
    categories,
    selectedCategory,
    onSelectCategory,
    basePath,
    categoryBase,
    featuredItem,
    featuredBasePath,
}: NewsroomHeroProps) {
    const featuredImageUrl = featuredItem?.featured_image_url
        ? (featuredItem.featured_image_url.startsWith('http')
            ? featuredItem.featured_image_url
            : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${featuredItem.featured_image_url}`)
        : null;

    const featuredHref = featuredItem
        ? `${featuredBasePath || basePath || '/news'}/${featuredItem.slug}`
        : '#';

    const publishedDate = (() => {
        const raw = featuredItem?.published_at || featuredItem?.created_at;
        if (!raw) return '';
        try {
            const d = new Date(raw);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return ''; }
    })();

    return (
        <div className="relative w-full overflow-hidden bg-[#030507] border-b border-[#0F1318] mb-10">

            {/* ── Background atmosphere ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-24 w-[700px] h-[500px] bg-tp-accent/[0.12] blur-[160px] rounded-full" />
                <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-tp-accent/[0.04] blur-[100px] rounded-full" />
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(220, 20, 60,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 20, 60,0.4) 1px, transparent 1px)',
                        backgroundSize: '80px 80px',
                    }}
                />
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-tp-accent via-tp-accent/40 to-transparent" />
            </div>

            {/* ── Corner brackets ── */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-tp-accent/60" />
            <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-tp-accent/60" />
            <div className="absolute bottom-0 left-4 w-5 h-5 border-l border-b border-white/5" />
            <div className="absolute bottom-0 right-4 w-5 h-5 border-r border-b border-white/5" />

            <div className="relative z-10 container-page pt-12 pb-0">
                <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 items-stretch">

                    {/* ══ LEFT ══ */}
                    <motion.div
                        className="flex-1 min-w-0 flex flex-col justify-between pb-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div>
                            {/* Top meta row */}
                            <div className="flex items-center mb-8">
                                <span className="w-2 h-2 rounded-full bg-tp-accent shadow-[0_0_8px_rgba(220, 20, 60,0.8)]" />
                                <span className="ml-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#3F3F46]">
                                    {sectionLabel}
                                </span>
                            </div>

                            {/* ── Headline ── */}
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-[5px] shrink-0 self-stretch bg-gradient-to-b from-tp-accent to-tp-accent/20 rounded-full mt-1 mb-1" />
                                <h1 className="font-display font-black leading-[0.85] tracking-[-0.02em]">
                                    <span
                                        className="block text-white"
                                        style={{
                                            fontSize: 'clamp(56px, 8.5vw, 110px)',
                                            textShadow: '0 0 60px rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        {headline}
                                    </span>
                                    {headlineAccent && (
                                        <span
                                            className="block text-tp-accent"
                                            style={{
                                                fontSize: 'clamp(56px, 8.5vw, 110px)',
                                                textShadow: '0 0 80px rgba(220, 20, 60,0.4)',
                                            }}
                                        >
                                            {headlineAccent.trim()}
                                        </span>
                                    )}
                                </h1>
                            </div>

                            {/* Tagline */}
                            {tagline && (
                                <p className="text-[17px] md:text-[20px] font-semibold text-white/90 leading-snug mb-3 pl-9">
                                    {tagline}
                                </p>
                            )}

                            {/* Description */}
                            {description && (
                                <p className="text-[13px] md:text-[14px] text-[#52525B] leading-relaxed max-w-[520px] pl-9 mb-8">
                                    {description}
                                </p>
                            )}

                            {/* Stats row */}
                            {stats.length > 0 && (
                                <div className="flex items-center gap-0 flex-wrap pl-9 mb-10">
                                    {stats.map((stat, i) => (
                                        <span key={i} className="flex items-center">
                                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#3A3A3A]">
                                                <stat.icon className="w-3 h-3 text-tp-accent/40" />
                                                {stat.label}
                                            </span>
                                            {i < stats.length - 1 && (
                                                <span className="mx-5 h-3 w-px bg-[#1A1F26]" />
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Category pills ── */}
                        {categories && categories.length > 0 && (
                            <div className="pb-10">
                                <div className="flex flex-wrap gap-2 max-w-[560px]">
                                    {categories.map((cat) => {
                                        const isSelected = selectedCategory === cat.id;
                                        const pillClass = cn(
                                            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-200 border whitespace-nowrap",
                                            isSelected
                                                ? "bg-tp-accent text-white border-tp-accent shadow-lg shadow-tp-accent/20"
                                                : "bg-[#0A0D12] text-[#52525B] border-[#161B22] hover:text-white hover:border-[#2A2F3A] hover:bg-[#0F1318]"
                                        );
                                        const iconClass = cn("w-3 h-3 shrink-0", isSelected ? "text-white" : "text-tp-accent/50");

                                        if (onSelectCategory) {
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => onSelectCategory(cat.id)}
                                                    className={pillClass}
                                                >
                                                    <cat.icon className={iconClass} />
                                                    <span>{cat.label}</span>
                                                </button>
                                            );
                                        }

                                        const href = cat.slug === 'all'
                                            ? (basePath || '#')
                                            : `${categoryBase || basePath}/${cat.slug}`;
                                        return (
                                            <Link key={cat.id} href={href} className={pillClass}>
                                                <cat.icon className={iconClass} />
                                                <span>{cat.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* ══ RIGHT — Full-bleed editorial card ══ */}
                    {featuredItem && featuredImageUrl && (
                        <motion.div
                            className="w-full xl:flex-1 py-8 flex xl:items-center xl:justify-center"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Link
                                href={featuredHref}
                                className="group relative flex flex-col w-full xl:max-w-[420px] h-full min-h-[420px] rounded-[20px] overflow-hidden border border-[#161B22] hover:border-tp-accent/40 hover:-translate-x-1 hover:shadow-[0_8px_40px_rgba(220, 20, 60,0.18)] transition-all duration-300"
                            >
                                {/* Orange accent bar */}
                                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-tp-accent scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 z-20" />

                                {/* Full bleed image */}
                                <div className="absolute inset-0">
                                    <Image
                                        src={featuredImageUrl}
                                        alt={decodeHtml(featuredItem.title)}
                                        fill
                                        className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                                        sizes="(max-width: 1280px) 100vw, 420px"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#030507] via-[#030507]/50 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#030507]/40 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#030507]/60 via-transparent to-transparent" />
                                </div>

                                {/* Category badge */}
                                {featuredItem.category?.name && (
                                    <div className="relative z-10 flex items-start justify-end p-4">
                                        <div className="bg-tp-accent text-white text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full shadow-lg shadow-tp-accent/30">
                                            {featuredItem.category.name}
                                        </div>
                                    </div>
                                )}

                                {/* Bottom content */}
                                <div className="relative z-10 mt-auto p-6">
                                    {publishedDate && (
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4B5563] mb-2.5">
                                            {publishedDate}
                                        </p>
                                    )}

                                    <h3 className="font-display font-black text-[18px] md:text-[20px] text-white leading-[1.15] mb-2 group-hover:text-tp-accent transition-colors duration-300 line-clamp-3">
                                        {decodeHtml(featuredItem.title)}
                                    </h3>

                                    {featuredItem.excerpt && (
                                        <p className="text-[12px] text-[#71717A] leading-relaxed line-clamp-2 mb-5">
                                            {decodeHtml(featuredItem.excerpt)}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 text-tp-accent text-[11px] font-black uppercase tracking-[0.15em] group-hover:gap-3 transition-all duration-300">
                                        Read More
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
}
