import type { Metadata } from "next";
import HubPage from "@/app/games/_hub/HubPage";
import { getApiUrl } from "@/lib/api";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
    const { tag } = await params;
    const name = tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
        title:       `Best ${name} Games — TechPlay`,
        description: `Browse the best ${name.toLowerCase()} games. Top-rated titles tagged with "${name.toLowerCase()}" on TechPlay.`,
        alternates:  { canonical: `https://techplay.gg/games/tag/${tag}` },
        openGraph: {
            title:       `Best ${name} Games — TechPlay`,
            description: `Browse the best ${name.toLowerCase()} games on TechPlay.`,
            url:         `https://techplay.gg/games/tag/${tag}`,
        },
    };
}

export default async function TagHubPage({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = await params;
    const name = tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const initialData = await fetch(`${getApiUrl()}/games/hub/tag/${tag}?page=1&sort=rating`, { next: { revalidate: 600 } })
        .then((r) => r.ok ? r.json() : null).catch(() => null);
    return (
        <HubPage
            type="tag"
            value={tag}
            title={`Best ${name} Games`}
            description={`Browse the best ${name.toLowerCase()} games. Top-rated titles tagged with "${name.toLowerCase()}" on TechPlay.`}
            initialData={initialData}
        />
    );
}
