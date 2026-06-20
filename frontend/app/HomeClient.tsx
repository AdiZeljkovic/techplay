"use client";

import { Article } from "@/types";
import HeroCarousel from "@/components/home/HeroCarousel";
import NewsSection from "@/components/home/NewsSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import HardwareSection from "@/components/home/HardwareSection";
import ReleaseCalendarSection from "@/components/home/ReleaseCalendarSection";
import PlatformHighlights from "@/components/home/PlatformHighlights";
import CommunityForum from "@/components/home/CommunityForum";
import DiscordWidget from "@/components/home/DiscordWidget";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import PersonalizedFeedSection from "@/components/home/PersonalizedFeedSection";
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
    const { hero: heroArticles, news: latestNews, reviews: latestReviews, tech: hardwareLab } = useHome(initialData);

    return (
        <main className="min-h-screen bg-[#F4F4F5] dark:bg-[#05070A] flex flex-col pt-0 font-sans text-zinc-900 dark:text-slate-300 transition-colors duration-300">

            <HeroCarousel articles={heroArticles} />

            <PlatformHighlights />

            {/* Row 1: Latest News + Upcoming Releases */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full mb-16 md:mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-[60px]">
                    <div className="lg:col-span-2">
                        <NewsSection articles={latestNews} />
                    </div>
                    <div className="lg:col-span-1 border-t lg:border-t-0 border-zinc-200 dark:border-white/5 lg:border-l lg:pl-10 xl:pl-[60px] pt-10 lg:pt-0 border-l-zinc-200 dark:border-l-white/5">
                        <ReleaseCalendarSection />
                    </div>
                </div>
            </div>

            {/* Row 2: Latest Reviews + Community Forum */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-[60px]">
                    <div className="lg:col-span-2">
                        <ReviewsSection articles={latestReviews} />
                    </div>
                    <div className="lg:col-span-1 border-t lg:border-t-0 border-zinc-200 dark:border-white/5 lg:border-l lg:pl-10 xl:pl-[60px] pt-10 lg:pt-0 border-l-zinc-200 dark:border-l-white/5">
                        <CommunityForum />
                    </div>
                </div>
            </div>

            {/* Row 3: Hardware Lab + Discord */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-[60px]">
                    <div className="lg:col-span-2">
                        <HardwareSection articles={hardwareLab} />
                    </div>
                    <div className="lg:col-span-1 border-t lg:border-t-0 border-zinc-200 dark:border-white/5 lg:border-l lg:pl-10 xl:pl-[60px] pt-10 lg:pt-0 border-l-zinc-200 dark:border-l-white/5">
                        <DiscordWidget />
                    </div>
                </div>
            </div>

            <PersonalizedFeedSection />

            <NewsletterCTA />

        </main>
    );
}
