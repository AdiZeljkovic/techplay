"use client";

import { Article } from "@/types";
import HomeHero from "@/components/home/HomeHero";
import QuickLinksBand from "@/components/home/QuickLinksBand";
import DiscoverGames from "@/components/home/DiscoverGames";
import EditorialSpotlight from "@/components/home/EditorialSpotlight";
import ComingThisWeek from "@/components/home/ComingThisWeek";
import CommunityPulse from "@/components/home/CommunityPulse";
import ProfileCtaBand from "@/components/home/ProfileCtaBand";
import NewsletterCTA from "@/components/home/NewsletterCTA";
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

/**
 * Public (guest) homepage — app-style landing per the 2026 redesign:
 * hero + quick links + game discovery + editorial + releases/community + profile CTA.
 * Logged-in users never see this page (HomeGate swaps them to DashboardHome).
 */
export default function HomeClient({ initialData }: HomeClientProps) {
    const { hero: heroArticles, news, reviews, tech } = useHome(initialData);

    return (
        <main className="min-h-screen bg-[var(--bg-primary)] font-sans text-slate-300">
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full py-6 md:py-8 space-y-12 md:space-y-16">
                <div className="tp-fade-up tp-d1"><HomeHero heroArticles={heroArticles} /></div>
                <div className="tp-fade-up tp-d2 !mt-6"><QuickLinksBand /></div>
                <div className="tp-fade-up tp-d3"><DiscoverGames /></div>
                <EditorialSpotlight news={news} reviews={reviews} tech={tech} />

                {/* Releases + community signals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <ComingThisWeek />
                    <CommunityPulse latestReview={reviews[0]} />
                </div>

                <ProfileCtaBand />
            </div>

            <NewsletterCTA />
        </main>
    );
}
