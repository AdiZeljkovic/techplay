
import { Metadata } from 'next';
import { getServerApiUrl, serverHeaders } from '@/lib/api';

/**
 * Every title, description, canonical and OG tag on the site is decided here,
 * from `page_seo` and `site_settings` — the database is the source, and the
 * strings further down are only a fallback for when it cannot be reached.
 *
 * That fallback had become the actual value. This file read
 * NEXT_PUBLIC_API_URL and called it from the server, which means going out to
 * the public hostname and back through Cloudflare — and Cloudflare answers a
 * server-side Node request with a 403 challenge page. Verified from the box on
 * 17 Aug 2026: status 403, "Just a moment…". So every fetch failed, every page
 * silently used the code defaults, and none of the forty-four SEO records
 * anybody had written in the admin panel ever reached a visitor.
 *
 * NEXT_PRIVATE_API_URL exists for exactly this and goes straight to Octane.
 * Resolved per call rather than at module load, because the value is only in
 * the environment at request time.
 */
function apiUrl(): string {
    return getServerApiUrl();
}
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://api-beta.techplay.gg/storage';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg').replace(/\/$/, '');

export interface PageSeoData {
    page_path: string;
    page_name: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    canonical_url?: string;
    seo_text?: string;
}

export interface SiteSettings {
    site_name?: string;
    seo_meta_description?: string;
    seo_og_image_default?: string;
    seo_twitter_card_type?: string;
    seo_social_twitter?: string;
    [key: string]: any;
}

/**
 * Fetch page-specific SEO data from admin panel
 */
export async function fetchPageSeo(path: string): Promise<PageSeoData | null> {
    try {
        // Remove leading slash for API call, then re-add it
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        // Five minutes, not an hour.
        //
        // These are two small JSON calls that decide every page's title and
        // description, and they are edited in an admin form — so the cost of
        // being wrong is a page that misrepresents itself to search engines,
        // while the cost of re-fetching is nothing. An hour also outlives a
        // deploy: Next keeps its fetch cache in .next/cache between builds, so
        // "I changed the title and rebuilt and nothing happened" was exactly
        // what it looked like on 17 Aug 2026, twice.
        const res = await fetch(`${apiUrl()}/page-seo/${encodeURIComponent(cleanPath || '/')}`, {
            headers: serverHeaders(),
            next: { revalidate: 300 }
        });

        if (!res.ok) {
            // Loud on purpose. A silent fallback here is indistinguishable from
            // a working site: the page still renders, still has a title, and
            // nothing anywhere says the database was never consulted. That is
            // how forty-four SEO records went unused without anybody noticing.
            console.error(`[seo] page-seo for "${path}" answered ${res.status} — falling back to code defaults`);

            return null;
        }

        return res.json();
    } catch (error) {
        console.error(`[seo] page-seo for "${path}" could not be reached — falling back to code defaults`, error);

        return null;
    }
}

/**
 * Fetch global site settings
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
    try {
        const res = await fetch(`${apiUrl()}/settings`, {
            headers: serverHeaders(),
            next: { revalidate: 300 }
        });
        if (!res.ok) {
            console.error(`[seo] settings answered ${res.status} — falling back to code defaults`);

            return {};
        }

        return res.json();
    } catch (error) {
        console.error('[seo] settings could not be reached — falling back to code defaults', error);

        return {};
    }
}

/**
 * Generate SEO metadata for a page with admin panel integration
 * 
 * @param path - The page path (e.g., '/', '/about', '/news')
 * @param defaults - Optional default values if page SEO not configured
 */
export async function generatePageMetadata(
    path: string,
    defaults?: {
        title?: string;
        description?: string;
        keywords?: string[];
    }
): Promise<Metadata> {
    const [pageSeo, settings] = await Promise.all([
        fetchPageSeo(path),
        fetchSiteSettings()
    ]);

    const siteName = settings.site_name || "TechPlay";

    // Use page-specific SEO if available, otherwise fall back to defaults/global settings
    const title = pageSeo?.meta_title || defaults?.title || siteName;
    const description = pageSeo?.meta_description || defaults?.description || settings.seo_meta_description || "TechPlay puts every game you own in one library — Steam, PlayStation and Xbox together, with the hours you played — then reads your taste back to you. Plus reviews, release dates and a 141,000-game catalogue.";
    const ogTitle = pageSeo?.og_title || title;
    const ogDescription = pageSeo?.og_description || description;
    const ogImage = pageSeo?.og_image
        ? `${STORAGE_URL}/${pageSeo.og_image}`
        : settings.seo_og_image_default
            ? `${STORAGE_URL}/${settings.seo_og_image_default}`
            : undefined;
    const keywords = pageSeo?.meta_keywords?.split(',').map((k: string) => k.trim())
        || defaults?.keywords
        || ["gaming", "tech", "reviews"];
    // Always generate canonical — fallback to APP_URL + path so every page has one.
    const canonical = pageSeo?.canonical_url || `${APP_URL}${path === '/' ? '' : path}`;

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical,
            languages: { 'x-default': canonical },
        },
        openGraph: {
            title: ogTitle,
            description: ogDescription,
            siteName,
            images: ogImage ? [{ url: ogImage }] : [],
            type: 'website',
        },
        twitter: {
            card: (settings.seo_twitter_card_type as "summary" | "summary_large_image") || 'summary_large_image',
            site: settings.seo_social_twitter,
            title: ogTitle,
            description: ogDescription,
            images: ogImage ? [ogImage] : [],
        },
    };
}

/**
 * Legacy function for backwards compatibility
 */
export async function generateDynamicMetadata(path: string): Promise<Metadata> {
    return generatePageMetadata(path);
}

/**
 * Get SEO text/content for a page (for bottom SEO text sections)
 */
export async function getPageSeoText(path: string): Promise<string | null> {
    const pageSeo = await fetchPageSeo(path);
    return pageSeo?.seo_text || null;
}
