
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
    meta_keywords?: string | string[];
    og_title?: string;
    og_description?: string;
    og_image?: string;
    canonical_url?: string;
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
    /**
     * A title written in the admin panel is the finished title.
     *
     * The root layout appends "| TechPlay" to whatever a page returns, and 31
     * of the 44 records already end in it — so the moment these finally began
     * arriving, /news read "Gaming News 2026 | Breaking Headlines & Industry
     * Updates | TechPlay | TechPlay". Marking it absolute keeps the editor's
     * wording exactly as written; a fallback title is a fragment and still
     * takes the template.
     */
    const dbTitle = pageSeo?.meta_title?.trim() || null;
    /**
     * No title at all beats the site name as a title.
     *
     * The last resort here was `siteName`, which the root template then
     * completed into "TechPlay | TechPlay" — that is what /news and /reviews
     * served, because neither passes a default and neither has a record. The
     * root layout already declares `default: siteName` for pages that set
     * nothing, and that path produces a plain "TechPlay". Returning undefined
     * hands the decision back to it.
     */
    const title = dbTitle ?? defaults?.title ?? undefined;
    const description = pageSeo?.meta_description || defaults?.description || settings.seo_meta_description || "TechPlay puts every game you own in one library — Steam, PlayStation and Xbox together, with the hours you played — then reads your taste back to you. Plus reviews, release dates and a 141,000-game catalogue.";
    // The page title may now be undefined so the layout's default can take
    // over, but an og:title never inherits anything — a share card with no
    // title is a bare link, so it falls back to the site name here.
    const ogTitle = pageSeo?.og_title || title || siteName;
    const ogDescription = pageSeo?.og_description || description;
    const ogImage = pageSeo?.og_image
        ? `${STORAGE_URL}/${pageSeo.og_image}`
        : settings.seo_og_image_default
            ? `${STORAGE_URL}/${settings.seo_og_image_default}`
            : undefined;
    /**
     * `meta_keywords` arrives as an array, not a string.
     *
     * The admin field is a `TagsInput`, so Laravel stores it as JSON — `[]` for
     * empty, `["gaming news 2026", …]` when filled. This line used to call
     * `.split(',')` on it, which produced `["[]"]` for the forty-two empty rows
     * and mangled the two filled ones at the commas *inside* the JSON. Every
     * page on the site was serving `<meta name="keywords" content="[]">`.
     *
     * Both shapes are accepted because the column has held both. Empty means
     * the tag is omitted rather than emitted blank — search engines ignore
     * keywords either way, but an empty tag is a thing an audit flags.
     */
    const rawKeywords = pageSeo?.meta_keywords;
    const dbKeywords = Array.isArray(rawKeywords)
        ? rawKeywords.map((k) => String(k).trim()).filter(Boolean)
        : typeof rawKeywords === 'string' && rawKeywords.trim() && rawKeywords.trim() !== '[]'
            ? rawKeywords.split(',').map((k) => k.trim()).filter(Boolean)
            : [];
    const keywords = dbKeywords.length > 0
        ? dbKeywords
        : defaults?.keywords ?? undefined;
    // Always generate canonical — fallback to APP_URL + path so every page has one.
    const canonical = pageSeo?.canonical_url || `${APP_URL}${path === '/' ? '' : path}`;

    return {
        title: dbTitle ? { absolute: dbTitle } : title,
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

/*
 * `getPageSeoText` used to live here.
 *
 * It returned `page_seo.seo_text` — the long descriptive blocks meant to sit at
 * the bottom of a page — and no file ever called it. Forty-four pages had one
 * written, ninety thousand characters in total, and not a single one reached a
 * reader.
 *
 * Removed 18 Aug 2026 on the owner's call: keyword-heavy text appended below
 * the content is a tactic search engines stopped rewarding years ago, and it
 * would have cost the pages more than it earned. The writing is not lost — it
 * was exported to `storage/app/backups/seo-text-2026-08-18.json` first.
 */
