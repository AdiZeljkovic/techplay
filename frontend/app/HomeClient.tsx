"use client";

import { Article } from "@/types";
import HomeHero from "@/components/home/HomeHero";
import QuickLinksBand from "@/components/home/QuickLinksBand";
import DiscoverGames from "@/components/home/DiscoverGames";
import EditorialSpotlight from "@/components/home/EditorialSpotlight";
import ReviewWall from "@/components/home/ReviewWall";
import HiddenGems from "@/components/home/HiddenGems";
import OnThisDay from "@/components/home/OnThisDay";
import ProfileCtaBand from "@/components/home/ProfileCtaBand";
import { DisplayAd } from "@/components/ads/AdSense";

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
 * The homepage — app-style landing per the 2026 redesign: hero + quick links
 * + game discovery + editorial + releases/community + profile CTA.
 *
 * Everybody sees it, signed in or not. It used to swap to the profile
 * dashboard the moment a token was found, which meant the site's front page
 * was somebody's own profile rather than the site — and paid for it twice: the
 * swap could only happen after hydration, so a signed-in reader got a skeleton
 * on top of an ISR page that had already been rendered and thrown away. The
 * dashboard has not moved; it is the Overview of your own profile, which is
 * where it was always also reachable.
 */
export default function HomeClient({ initialData }: HomeClientProps) {
    // The server already fetched all of this and passes it down. The hook
    // this replaced imported raw axios and mutated its global defaults on
    // import, bypassing every interceptor in lib/axios.
    const heroArticles = initialData?.hero ?? [];
    const news = initialData?.news ?? [];
    const reviews = initialData?.reviews ?? [];
    const tech = initialData?.tech ?? [];

    return (
        <main className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-mid)]">
            <div className="container-page py-3 md:py-8 space-y-7 md:space-y-14">
                {/* Hero + quick links enter as one band; the choreography then
                    walks the full page — no section appears without its cue */}
                <div className="tp-fade-up tp-d1 space-y-6">
                    <HomeHero heroArticles={heroArticles} />
                    <QuickLinksBand />
                </div>
                <div className="tp-fade-up tp-d2"><DiscoverGames /></div>
                <div className="tp-fade-up tp-d3"><EditorialSpotlight news={news} reviews={reviews} tech={tech} /></div>
                {/* One unit on the front page, between the editorial block
                    and the review wall — a section break the reader was going
                    to cross anyway, rather than a slot cut into a grid. */}
                <DisplayAd className="tp-fade-up tp-d4" minHeight={110} />

                <div className="tp-fade-up tp-d4"><ReviewWall reviews={reviews} /></div>

                {/* Database discovery — content only a 200K-title catalog can produce */}
                <div className="tp-fade-up tp-d5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <HiddenGems />
                    <OnThisDay />
                </div>

                <div className="tp-fade-up tp-d6"><ProfileCtaBand /></div>
            </div>
        </main>
    );
}
