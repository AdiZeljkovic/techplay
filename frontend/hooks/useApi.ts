import useSWR, { SWRConfiguration } from 'swr';
import axios from 'axios';
import { Article, Review, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Configure axios defaults
axios.defaults.baseURL = API_BASE;
axios.defaults.withCredentials = true;

// Generic fetcher for SWR
const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data;
};

/**
 * Default SWR configuration for API calls
 * PERFORMANCE: Increased dedupingInterval to 30s to reduce API calls during navigation
 */
const defaultConfig: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    dedupingInterval: 30000, // 30 seconds - prevents redundant calls during page navigation
    errorRetryCount: 3,
};

/**
 * Hook for fetching home page data
 */
export function useHome(fallbackData?: { hero: any[]; news: any[]; reviews: any[]; tech: any[] }) {
    const { data, error, isLoading, mutate } = useSWR('/home', fetcher, {
        ...defaultConfig,
        revalidateOnMount: !fallbackData, // Skip initial fetch if we have server data
        fallbackData: fallbackData ? { data: fallbackData } : undefined,
    });

    return {
        hero: data?.data?.hero ?? [],
        news: data?.data?.news ?? [],
        reviews: data?.data?.reviews ?? [],
        tech: data?.data?.tech ?? [],
        isLoading: fallbackData ? false : isLoading,
        isError: !!error,
        mutate,
    };
}

/**
 * Hook for fetching news list with pagination
 */
export function useNews(page: number = 1, perPage: number = 12) {
    const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Article>>(
        `/news?page=${page}&per_page=${perPage}`,
        fetcher,
        defaultConfig
    );

    return {
        articles: data?.data ?? [],
        pagination: {
            currentPage: data?.current_page ?? 1,
            lastPage: data?.last_page ?? 1,
            total: data?.total ?? 0,
        },
        isLoading,
        isError: !!error,
        mutate,
    };
}

/**
 * Hook for fetching a single article by slug
 */
export function useArticle(slug: string) {
    const { data, error, isLoading, mutate } = useSWR<Article>(
        slug ? `/news/${slug}` : null,
        fetcher,
        defaultConfig
    );

    return {
        article: data,
        isLoading,
        isError: !!error,
        mutate,
    };
}

/**
 * Hook for fetching reviews list with pagination
 */
export function useReviews(page: number = 1, perPage: number = 12) {
    const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Review>>(
        `/reviews?page=${page}&per_page=${perPage}`,
        fetcher,
        defaultConfig
    );

    return {
        reviews: data?.data ?? [],
        pagination: {
            currentPage: data?.current_page ?? 1,
            lastPage: data?.last_page ?? 1,
            total: data?.total ?? 0,
        },
        isLoading,
        isError: !!error,
        mutate,
    };
}

/**
 * Hook for fetching a single review by slug
 */
export function useReview(slug: string) {
    const { data, error, isLoading, mutate } = useSWR<Review>(
        slug ? `/reviews/${slug}` : null,
        fetcher,
        defaultConfig
    );

    return {
        review: data,
        isLoading,
        isError: !!error,
        mutate,
    };
}

/**
 * Hook for fetching navigation tree
 */
export function useNavigation() {
    const { data, error, isLoading } = useSWR('/navigation/tree', fetcher, {
        ...defaultConfig,
        revalidateOnMount: true,
        dedupingInterval: 60000, // Cache for 1 minute
    });

    return {
        navigation: data ?? [],
        isLoading,
        isError: !!error,
    };
}

/**
 * Hook for fetching site settings
 */
export function useSettings() {
    const { data, error, isLoading } = useSWR('/settings', fetcher, {
        ...defaultConfig,
        revalidateOnMount: true,
        dedupingInterval: 60000, // Cache for 1 minute
    });

    return {
        settings: data ?? {},
        isLoading,
        isError: !!error,
    };
}
