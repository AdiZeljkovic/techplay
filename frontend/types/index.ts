export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    avatar_url?: string;
    bio?: string;
    role: string;
    rank_id: number;
    forum_reputation: number;
    created_at: string;
    rank?: {
        name: string;
        color: string;
        icon: string;
        min_reputation: number;
    };
    active_support?: {
        tier: {
            name: string;
            color: string;
        };
        amount: string;
        expires_at: string;
    } | null;
    articles?: Article[];
    xp?: number;
    display_name?: string;
    cookie_preferences?: {
        necessary: boolean;
        analytics: boolean;
        marketing: boolean;
    };
    [key: string]: any;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    type: string;
}

export interface Article {
    id: number;
    title: string;
    slug: string;
    featured_image_url: string;
    excerpt: string;
    content: string;
    category: Category; // Updated from string
    is_featured_in_hero: boolean;
    seo_title?: string;
    seo_description?: string;
    focus_keyword?: string;
    canonical_url?: string;
    is_noindex?: boolean;
    author?: User;
    status: 'draft' | 'published' | 'scheduled';
    published_at: string;
    created_at: string;
    updated_at: string;
    views?: number;
    review_score?: number;
    review_data?: {
        game_title: string;
        developer?: string;
        publisher?: string;
        release_date?: string;
        play_time?: string;
        tested_on?: string;
        price?: string;
        store_link?: string;
        trailer_url?: string;
        platforms?: string[];
        genres?: string[];
        provided_by?: string;
        ratings?: {
            gameplay?: number;
            visuals?: number;
            audio?: number;
            narrative?: number;
            replayability?: number;
        };
        pros?: string[];
        cons?: string[];
        conclusion?: string;
        cta?: 'none' | 'recommended' | 'must_play' | 'skip' | 'wait_sale';
    };
    comments?: Comment[];
}

export interface Review {
    id: number;
    title: string;
    slug: string;
    item_name?: string;
    category: Category;
    summary?: string;
    content: string;
    cover_image?: string;
    scores?: Record<string, number>; // { gameplay: 8, graphics: 9 }
    specs?: Record<string, string | number>;
    pros?: string[];
    cons?: string[];
    rating: number; // Overall score
    author: User;
    status: 'draft' | 'published' | 'scheduled';
    published_at: string;
    created_at: string;
    excerpt?: string; // Optional helper mapping
    featured_image_url?: string; // Optional helper mapping for reused components
    updated_at: string;
    seo_title?: string;
    seo_description?: string;
    focus_keyword?: string;
    canonical_url?: string;
    is_noindex?: boolean;
    review_score?: number;
    review_data?: {
        game_title: string;
        developer?: string;
        publisher?: string;
        release_date?: string;
        play_time?: string;
        tested_on?: string;
        price?: string;
        store_link?: string;
        trailer_url?: string;
        platforms?: string[];
        genres?: string[];
        provided_by?: string;
        ratings?: {
            gameplay?: number;
            visuals?: number;
            audio?: number;
            narrative?: number;
            replayability?: number;
        };
        pros?: string[];
        cons?: string[];
        conclusion?: string;
        cta?: 'none' | 'recommended' | 'must_play' | 'skip' | 'wait_sale';
    };
    tags?: string[];
}

export interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: User;
    likes_count: number;
    is_liked_by_user?: boolean;
    replies?: Comment[];
    commentable_type?: string;
    commentable_id?: number;
    parent_id?: number | null;
    status?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url?: string;
    next_page_url?: string;
}
