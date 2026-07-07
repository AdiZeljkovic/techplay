import type { Gta6Entity } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

/** Resolve a GTA6 entity image to a browser-usable URL. */
export function resolveGta6Image(image?: string | null): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    // Leading slash = served from the frontend's own /public (e.g. /gta6/vehicles/x.webp)
    if (image.startsWith("/")) return image;
    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${image}`;
}

/** Absolute variant for structured data (JSON-LD requires full URLs). */
export function absoluteGta6Image(image?: string | null): string | null {
    const resolved = resolveGta6Image(image);
    if (!resolved) return null;
    return resolved.startsWith("/") ? `${SITE_URL}${resolved}` : resolved;
}

/** ItemList JSON-LD for a GTA6 entity listing page. */
export function gta6ItemListLd(name: string, items: Gta6Entity[], detailBasePath?: string) {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        numberOfItems: items.length,
        itemListElement: items.map((e, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: e.name,
            ...(detailBasePath ? { url: `${SITE_URL}${detailBasePath}/${e.slug}` } : {}),
            ...(absoluteGta6Image(e.image) ? { image: absoluteGta6Image(e.image) } : {}),
        })),
    };
}

/** Server-side fetch of a GTA6 entity list (characters/vehicles/weapons). */
export async function fetchGta6Entities(apiUrl: string, path: string): Promise<Gta6Entity[]> {
    try {
        const res = await fetch(`${apiUrl}${path}`, {
            next: { revalidate: 3600 },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data ?? [];
    } catch {
        return [];
    }
}
