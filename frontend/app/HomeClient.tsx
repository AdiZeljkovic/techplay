"use client";

import { Article } from "@/types";
import { Zap, Gamepad2, Cpu } from "lucide-react";
import HeroCarousel from "@/components/home/HeroCarousel";
import HomeSidebar from "@/components/sidebar/HomeSidebar";
import ContentSection from "@/components/home/ContentSection";
import AdUnit from "@/components/ads/AdUnit";
import { useHome } from "@/hooks/useApi";

interface HomeClientProps {
    initialData?: {
        hero: Article[];
        news: Article[];
        reviews: Article[];
        tech: Article[];
        latestGlobal: Article[];
        popularGlobal: Article[];
    };
}

export default function HomeClient({ initialData }: HomeClientProps) {
    const { hero: heroArticles, news: latestNews, reviews: latestReviews, tech: hardwareLab, isLoading } = useHome(initialData);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">

            {/* Immersive Hero Carousel */}
            <HeroCarousel articles={heroArticles} />

            {/* Hero Banner Ad */}
            <div className="container mx-auto px-4 pt-8">
                <AdUnit position="home_hero" className="max-w-5xl mx-auto" />
            </div>

            {/* Main Content */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Main Column (8 cols) */}
                    <div className="lg:col-span-8 space-y-16">

                        {/* 1. LATEST NEWS */}
                        <ContentSection
                            title="Latest News"
                            icon={Zap}
                            articles={latestNews}
                            viewAllLink="/news"
                            isLoading={isLoading}
                        />

                        {/* Mid-Section Ad 1 */}
                        <AdUnit position="home_mid_1" />

                        {/* 2. LATEST REVIEWS */}
                        <ContentSection
                            title="Latest Reviews"
                            icon={Gamepad2}
                            articles={latestReviews}
                            viewAllLink="/reviews"
                            isLoading={isLoading}
                        />

                        {/* Mid-Section Ad 2 */}
                        <AdUnit position="home_mid_2" />

                        {/* 3. HARDWARE LAB */}
                        <ContentSection
                            title="Hardware Lab"
                            icon={Cpu}
                            articles={hardwareLab}
                            viewAllLink="/hardware"
                            color="#06b6d4"
                            isLoading={isLoading}
                        />

                    </div>

                    {/* Sidebar (4 cols) */}
                    <HomeSidebar
                        latestGlobal={initialData?.latestGlobal ?? []}
                        popularGlobal={initialData?.popularGlobal ?? []}
                    />

                </div>
            </section>
        </div>
    );
}
