import { Article } from "@/types";
import HomeHero from "@/components/home/HomeHero";
import QuickLinksBand from "@/components/home/QuickLinksBand";
import DiscoverGames, { type DiscoverGame } from "@/components/home/DiscoverGames";
import EditorialSpotlight from "@/components/home/EditorialSpotlight";
import ReviewWall from "@/components/home/ReviewWall";
import HiddenGems, { type GemGame } from "@/components/home/HiddenGems";
import OnThisDay, { type OnThisDayData } from "@/components/home/OnThisDay";
import ProfileCtaBand from "@/components/home/ProfileCtaBand";

interface HomeClientProps {
    initialData?: {
        hero: Article[];
        news: Article[];
        reviews: Article[];
        tech: Article[];
        latestGlobal: Article[];
        popularGlobal: Article[];
    };
    gems: GemGame[];
    onThisDay: OnThisDayData;
    discoverTrending: DiscoverGame[];
}

/**
 * Public (guest) homepage — app-style landing per the 2026 redesign:
 * hero + quick links + game discovery + editorial + releases/community + profile CTA.
 * Logged-in users never see this page (HomeGate swaps them to DashboardHome).
 *
 * A server component, reached as a prop from page.tsx rather than rendered by
 * HomeGate directly — which is what keeps it on the server even though
 * HomeGate itself has to be a client component to read localStorage.
 */
export default function HomeClient({ initialData, gems, onThisDay, discoverTrending }: HomeClientProps) {
    // The server already fetched all of this and passes it down. The hook
    // this replaced imported raw axios and mutated its global defaults on
    // import, bypassing every interceptor in lib/axios.
    const heroArticles = initialData?.hero ?? [];
    const news = initialData?.news ?? [];
    const reviews = initialData?.reviews ?? [];
    const tech = initialData?.tech ?? [];

    return (
        <main className="min-h-screen bg-[var(--surface-0)] font-sans text-[var(--ink-mid)]">
            <div className="container-page py-6 md:py-8 space-y-10 md:space-y-14">
                {/* Hero + quick links enter as one band; the choreography then
                    walks the full page — no section appears without its cue */}
                <div className="tp-fade-up tp-d1 space-y-6">
                    <HomeHero heroArticles={heroArticles} />
                    <QuickLinksBand />
                </div>
                <div className="tp-fade-up tp-d2"><DiscoverGames initialTrending={discoverTrending} /></div>
                <div className="tp-fade-up tp-d3"><EditorialSpotlight news={news} reviews={reviews} tech={tech} /></div>
                <div className="tp-fade-up tp-d4"><ReviewWall reviews={reviews} /></div>

                {/* Database discovery — content only a 200K-title catalog can produce */}
                <div className="tp-fade-up tp-d5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <HiddenGems games={gems} />
                    <OnThisDay data={onThisDay} />
                </div>

                <div className="tp-fade-up tp-d6"><ProfileCtaBand /></div>
            </div>
        </main>
    );
}
