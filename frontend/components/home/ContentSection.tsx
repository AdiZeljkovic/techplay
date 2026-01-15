"use client";

import Link from "next/link";
import { ArrowRight, Calendar, User, Clock, Layers } from "lucide-react";
import { Article } from "@/types";
import { format } from "date-fns";

interface ContentSectionProps {
    title: string;
    icon: any;
    articles: Article[];
    viewAllLink: string;
    color?: string;
}

export default function ContentSection({ title, icon: Icon, articles, viewAllLink, color = "var(--accent)" }: ContentSectionProps) {
    if (!articles || articles.length === 0) return null;

    // Split into featured (first item) and grid (next 4 items)
    const featured = articles[0];
    const gridItems = articles.slice(1, 5);

    return (
        <div className="mb-12">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 border-l-4 border-[var(--accent)] pl-4">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                    <Icon className="w-6 h-6 text-[var(--accent)]" />
                    {title}
                </h2>
                <Link
                    href={viewAllLink}
                    className="group flex items-center gap-2 text-xs font-bold text-white/60 hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
                >
                    View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Featured Article (Left) */}
                <Link href={`/news/${featured.slug}`} className="group relative h-[350px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg border border-white/10">
                    {/* Image */}
                    <div className="absolute inset-0">
                        {featured.featured_image_url ? (
                            <img
                                src={featured.featured_image_url.startsWith('http')
                                    ? featured.featured_image_url
                                    : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${featured.featured_image_url}`}
                                alt={featured.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#001540]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#000B25] via-[#000B25]/60 to-transparent" />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <span className="inline-block px-3 py-1 bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider rounded mb-3 shadow-[0_4px_10px_rgba(252,65,0,0.4)]">
                            {featured.category.name}
                        </span>
                        <h3 className="text-2xl font-bold text-white leading-tight mb-3 group-hover:text-[var(--accent-hover)] transition-colors">
                            {featured.title}
                        </h3>
                        <p className="text-white/70 text-sm line-clamp-2 mb-4 font-medium leading-relaxed">
                            {featured.excerpt}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-white/50 font-bold uppercase tracking-wide">
                            <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                                {featured.author?.username || "Editor"}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                                {featured.published_at ? format(new Date(featured.published_at), 'dd/MM/yyyy') : 'Recently'}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Grid of 4 Smaller Articles (Right) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {gridItems.map((item) => (
                        <Link key={item.id} href={`/news/${item.slug}`} className="group flex flex-col gap-3 p-4 bg-[#00215E] border border-white/5 rounded-2xl hover:bg-white/5 transition-all hover:border-white/10 hover:-translate-y-1 shadow-md">
                            <div className="relative h-32 rounded-xl overflow-hidden">
                                {item.featured_image_url ? (
                                    <img
                                        src={item.featured_image_url.startsWith('http')
                                            ? item.featured_image_url
                                            : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${item.featured_image_url}`}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#0a0f1c]" />
                                )}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
                                    {item.category.name}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-[var(--accent)] transition-colors">
                                    {item.title}
                                </h4>
                                <div className="mt-auto flex items-center justify-between text-[10px] text-white/40 uppercase font-bold tracking-wide">
                                    <span className="truncate max-w-[80px]">{item.author?.username || "TechPlay"}</span>
                                    <span>{item.published_at ? format(new Date(item.published_at), 'dd/MM/yyyy') : ''}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
