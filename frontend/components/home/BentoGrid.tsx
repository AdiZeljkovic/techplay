"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Star } from "lucide-react";

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string;
    category: { name: string; slug: string };
    created_at: string;
    author: { name: string; avatar: string };
}

// Mock Data for Skeleton/Preview
const MOCK_ARTICLES = [
    {
        id: 1,
        title: "The Future of VR Gaming: Beyond the Headset",
        slug: "future-of-vr",
        excerpt: "Exploring the next generation of sensory immersion technology.",
        cover_image: "https://images.unsplash.com/photo-1622979135228-5b1ed31720b2?q=80&w=2600&auto=format&fit=crop",
        category: { name: "Tech", slug: "tech" },
        created_at: "2 hours ago",
        author: { name: "Alex Chen", avatar: "https://i.pravatar.cc/150?u=alex" },
    },
    {
        id: 2,
        title: "RTX 5090 Leaked Specs: What We Know",
        slug: "rtx-5090-leaks",
        excerpt: "Nvidia's upcoming flagship might redefine performance standards.",
        cover_image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=2600&auto=format&fit=crop",
        category: { name: "Hardware", slug: "hardware" },
        created_at: "5 hours ago",
        author: { name: "Sarah Jones", avatar: "https://i.pravatar.cc/150?u=sarah" },
    },
    {
        id: 3,
        title: "Cyberpunk 2077: Phantom Liberty Review",
        slug: "cyberpunk-dlc-review",
        excerpt: "A redemption story worth playing.",
        cover_image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2600&auto=format&fit=crop",
        category: { name: "Reviews", slug: "reviews" },
        created_at: "1 day ago",
        author: { name: "Mike Ross", avatar: "https://i.pravatar.cc/150?u=mike" },
    },
    {
        id: 4,
        title: "Indie Gems of the Month: December",
        slug: "indie-gems-dec",
        excerpt: "Hidden treasures you might have missed.",
        cover_image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2600&auto=format&fit=crop",
        category: { name: "Indie", slug: "indie" },
        created_at: "2 days ago",
        author: { name: "Jen Wu", avatar: "https://i.pravatar.cc/150?u=jen" },
    },
];

export default function BentoGrid() {
    return (
        <section className="py-8">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]"
                >
                    {/* Main Feature - Spans 2 cols, 2 rows */}
                    <Link href={`/news/${MOCK_ARTICLES[0].slug}`} className="group relative col-span-1 md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden border border-[var(--border)]">
                        <Image
                            src={MOCK_ARTICLES[0].cover_image}
                            alt={MOCK_ARTICLES[0].title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold text-white bg-[var(--accent)] rounded-full">
                                {MOCK_ARTICLES[0].category.name}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-[var(--accent)] transition-colors">
                                {MOCK_ARTICLES[0].title}
                            </h2>
                            <p className="text-gray-300 text-lg mb-6 max-w-2xl line-clamp-2">
                                {MOCK_ARTICLES[0].excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/10 relative overflow-hidden">
                                        <Image src={MOCK_ARTICLES[0].author.avatar} alt="Author" fill className="object-cover" />
                                    </div>
                                    <span className="text-white">{MOCK_ARTICLES[0].author.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{MOCK_ARTICLES[0].created_at}</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Secondary Top */}
                    <Link href={`/news/${MOCK_ARTICLES[1].slug}`} className="group relative col-span-1 row-span-1 rounded-2xl overflow-hidden border border-[var(--border)]">
                        <Image
                            src={MOCK_ARTICLES[1].cover_image}
                            alt={MOCK_ARTICLES[1].title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                                {MOCK_ARTICLES[1].category.name}
                            </span>
                            <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors">
                                {MOCK_ARTICLES[1].title}
                            </h3>
                        </div>
                    </Link>

                    {/* Secondary Bottom */}
                    <div className="col-span-1 row-span-1 grid grid-rows-2 gap-4">
                        {MOCK_ARTICLES.slice(2).map((article, idx) => (
                            <Link key={article.id} href={`/news/${article.slug}`} className="group relative rounded-xl overflow-hidden border border-[var(--border)]">
                                <Image
                                    src={article.cover_image}
                                    alt={article.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent" />
                                <div className="absolute inset-0 p-4 flex flex-col justify-center items-end text-right">
                                    <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-bold text-white bg-green-600 rounded-full">
                                        {article.category.name}
                                    </span>
                                    <h4 className="text-lg font-bold text-white leading-tight group-hover:text-green-400 transition-colors max-w-[80%]">
                                        {article.title}
                                    </h4>
                                </div>
                            </Link>
                        ))}
                    </div>

                </motion.div>
            </div>
        </section>
    );
}
