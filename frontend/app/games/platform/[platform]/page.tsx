import type { Metadata } from "next";
import HubPage from "@/app/games/_hub/HubPage";
import { getApiUrl } from "@/lib/api";

export const revalidate = 86400;
export const dynamicParams = true;

function getMeta(platform: string) {
    const name = platform.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
        title:       `Best ${name} Games`,
        description: `Browse the best games available on ${name}. Top-rated titles with ratings, reviews and details on TechPlay.`,
    };
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string }> }): Promise<Metadata> {
    const { platform } = await params;
    const meta = getMeta(platform);
    return {
        title:       `${meta.title} — TechPlay`,
        description: meta.description,
        alternates:  { canonical: `https://techplay.gg/games/platform/${platform}` },
        openGraph: {
            title:       `${meta.title} — TechPlay`,
            description: meta.description,
            url:         `https://techplay.gg/games/platform/${platform}`,
        },
    };
}

export default async function PlatformHubPage({ params }: { params: Promise<{ platform: string }> }) {
    const { platform } = await params;
    const meta = getMeta(platform);
    const initialData = await fetch(`${getApiUrl()}/games/hub/platform/${platform}?page=1&sort=rating`, { next: { revalidate: 600 } })
        .then((r) => r.ok ? r.json() : null).catch(() => null);
    return <HubPage type="platform" value={platform} title={meta.title} description={meta.description} initialData={initialData} />;
}
