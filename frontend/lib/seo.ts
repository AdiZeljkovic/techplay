
import { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
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
        const res = await fetch(`${API_URL}/page-seo/${encodeURIComponent(cleanPath || '/')}`, {
            next: { revalidate: 3600 }
        });

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('Error fetching SEO data:', error);
        return null;
    }
}

/**
 * Fetch global site settings
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
    try {
        const res = await fetch(`${API_URL}/settings`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return {};
        return res.json();
    } catch {
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
