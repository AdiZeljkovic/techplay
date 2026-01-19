
import { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface PageSeoData {
    title: string;
    description: string;
    keywords?: string;
    og_image?: string;
    seo_text?: string;
}

export async function fetchPageSeo(path: string): Promise<PageSeoData | null> {
    try {
        const res = await fetch(`${API_URL}/page-seo?path=${encodeURIComponent(path)}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) return null;

        return res.json();
    } catch (error) {
        console.error('Error fetching SEO data:', error);
        return null;
    }
}

export async function generateDynamicMetadata(path: string): Promise<Metadata> {
    const seo = await fetchPageSeo(path);

    if (!seo) {
        return {};
    }

    return {
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        openGraph: {
            title: seo.title,
            description: seo.description,
            images: seo.og_image ? [seo.og_image] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: seo.title,
            description: seo.description,
            images: seo.og_image ? [seo.og_image] : [],
        },
    };
}
