import useSWR from 'swr';

export interface MediaKitData {
    about: Record<string, any>;
    statistics: {
        content: {
            total_articles?: number;
            total_reviews?: number;
            total_guides?: number;
            total_content?: number;
            total_views?: number;
            avg_article_length?: number;
            articles_this_month?: number;
        };
        engagement: {
            total_comments?: number;
            total_registered_users?: number;
            avg_comments_per_article?: number;
        };
        audience: {
            monthly_visitors?: number;
            avg_session_duration?: string;
            bounce_rate?: string;
            pages_per_session?: string;
        };
        social: {
            facebook_followers?: number;
            instagram_followers?: number;
            youtube_subscribers?: number;
            tiktok_followers?: number;
            total_social_reach?: number;
        };
    };
    social: Record<string, any>;
    audience: Record<string, any>;
    content: Record<string, any>;
    development: Record<string, any>;
}

const fetcher = async (url: string): Promise<MediaKitData> => {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl?.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    const res = await fetch(`${apiUrl}${url}`, {
        headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error('Failed to fetch media kit data');
    return res.json();
};

export function useMediaKit() {
    const { data, error, isLoading, mutate } = useSWR<MediaKitData>(
        '/media-kit',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 3600000, // 1 hour - match backend cache
            revalidateIfStale: false,
        }
    );

    return {
        data: data ?? {
            about: {},
            statistics: {
                content: {},
                engagement: {},
                audience: {},
                social: {},
            },
            social: {},
            audience: {},
            content: {},
            development: {},
        },
        isLoading,
        error,
        mutate,
    };
}
