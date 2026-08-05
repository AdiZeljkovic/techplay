import { MetadataRoute } from "next";
import { getServerApiUrl } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

async function fetchSlugs(path: string): Promise<string[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}${path}`, {
            next: { revalidate: 3600 },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data ?? []).map((item: { slug?: string }) => item.slug).filter(Boolean) as string[];
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date().toISOString();

    const characterSlugs = await fetchSlugs("/gta6/characters");

    const staticPages: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}`,             lastModified: now, changeFrequency: "daily",  priority: 1.0 },
        { url: `${SITE_URL}/news`,        lastModified: now, changeFrequency: "daily",  priority: 0.9 },
        { url: `${SITE_URL}/reviews`,     lastModified: now, changeFrequency: "weekly", priority: 0.9 },
        { url: `${SITE_URL}/hardware`,    lastModified: now, changeFrequency: "weekly", priority: 0.85 },
        { url: `${SITE_URL}/guides`,      lastModified: now, changeFrequency: "weekly", priority: 0.85 },
        { url: `${SITE_URL}/games`,       lastModified: now, changeFrequency: "daily",  priority: 0.85 },
        { url: `${SITE_URL}/forum`,       lastModified: now, changeFrequency: "daily",  priority: 0.8 },
        { url: `${SITE_URL}/giveaways`,   lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ];

    const gta6StaticPages: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/gta6`,                      lastModified: now, changeFrequency: "daily",  priority: 0.95 },
        { url: `${SITE_URL}/gta6/map`,                  lastModified: now, changeFrequency: "weekly", priority: 0.9 },
        { url: `${SITE_URL}/gta6/characters`,           lastModified: now, changeFrequency: "weekly", priority: 0.9 },
        { url: `${SITE_URL}/gta6/vehicles`,             lastModified: now, changeFrequency: "weekly", priority: 0.85 },
        { url: `${SITE_URL}/gta6/weapons`,              lastModified: now, changeFrequency: "weekly", priority: 0.85 },
        { url: `${SITE_URL}/gta6/everything-we-know`,   lastModified: now, changeFrequency: "weekly", priority: 0.88 },
    ];

    const characterPages: MetadataRoute.Sitemap = characterSlugs.map(slug => ({
        url: `${SITE_URL}/gta6/characters/${slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.75,
    }));

    return [
        ...staticPages,
        ...gta6StaticPages,
        ...characterPages,
    ];
}
