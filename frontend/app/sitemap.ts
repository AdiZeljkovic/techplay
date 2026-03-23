import { MetadataRoute } from 'next'

const BASE_URL = 'https://techplay.gg'

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()

    return [
        // Core
        { url: BASE_URL,                        lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
        { url: `${BASE_URL}/news`,              lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
        { url: `${BASE_URL}/reviews`,           lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
        { url: `${BASE_URL}/guides`,            lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
        { url: `${BASE_URL}/hardware`,          lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
        { url: `${BASE_URL}/videos`,            lastModified: now, changeFrequency: 'daily',   priority: 0.7 },

        // Community
        { url: `${BASE_URL}/forum`,             lastModified: now, changeFrequency: 'hourly',  priority: 0.8 },
        { url: `${BASE_URL}/calendar`,          lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
        { url: `${BASE_URL}/leaderboard`,       lastModified: now, changeFrequency: 'hourly',  priority: 0.6 },
        { url: `${BASE_URL}/giveaways`,         lastModified: now, changeFrequency: 'daily',   priority: 0.7 },

        // Tools
        { url: `${BASE_URL}/games`,             lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${BASE_URL}/wow-analyzer`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
        { url: `${BASE_URL}/shop`,              lastModified: now, changeFrequency: 'daily',   priority: 0.6 },

        // Info pages
        { url: `${BASE_URL}/about`,             lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/contact`,           lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/privacy`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
        { url: `${BASE_URL}/terms`,             lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
        { url: `${BASE_URL}/cookies`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    ]
}
