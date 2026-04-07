import type { Metadata } from "next";
import HubPage from "@/app/games/_hub/HubPage";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
    const { year } = await params;
    return {
        title:       `Best Games of ${year} — TechPlay`,
        description: `Discover the best video games released in ${year}. Top-rated titles sorted by rating, metacritic score and more.`,
        alternates:  { canonical: `https://techplay.gg/games/year/${year}` },
        openGraph: {
            title:       `Best Games of ${year} — TechPlay`,
            description: `Discover the best video games released in ${year}.`,
            url:         `https://techplay.gg/games/year/${year}`,
        },
    };
}

export default async function YearHubPage({ params }: { params: Promise<{ year: string }> }) {
    const { year } = await params;
    return (
        <HubPage
            type="year"
            value={year}
            title={`Best Games of ${year}`}
            description={`Discover the best video games released in ${year}. Top-rated titles sorted by rating, metacritic score and more.`}
        />
    );
}
