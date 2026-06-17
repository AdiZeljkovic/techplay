export interface Achievement {
    id: number;
    name: string;
    description: string;
    points: number;
    icon_path?: string;
    is_unlocked: boolean;
    unlocked_at?: string | null;
}

export interface UserRank {
    name: string;
    icon?: string;
    color?: string;
    min_xp?: number;
}

export interface ActiveSupport {
    tier: {
        name: string;
        color: string;
    };
}

export interface ProfileUser {
    id: number;
    username: string;
    display_name?: string;
    role: string;
    email: string;
    created_at: string;
    threads: any[];
    posts: any[];
    xp: number;
    gamertags: any;
    pc_specs: any;
    achievements: Achievement[];
    avatar_url?: string;
    cover_image?: string;
    bio?: string;
    location?: string;
    tagline?: string;
    playstyle_tags?: string[];
    forum_reputation?: number;
    rank?: UserRank;
    active_support?: ActiveSupport;
}

export interface ProfileStats {
    threads_count: number;
    posts_count: number;
    comments_count: number;
    reputation: number;
    joined_at: string;
    xp: number;
    achievements_count: number;
    level: number;
    reviews_count?: number;
    // Game collection counts (Phase 1 — default 0 until populated)
    games_count?: number;
    playing_count?: number;
    backlog_count?: number;
    completed_count?: number;
    wishlist_count?: number;
    favorites_count?: number;
}

export interface RecentArticle {
    id: number;
    title: string;
    slug: string;
    type: string;
    featured_image?: string;
    excerpt?: string;
    published_at: string;
    views: number;
}

export interface UserProfile {
    user: ProfileUser;
    stats: ProfileStats;
    achievements: Achievement[];
    next_rank: { name: string; min_xp: number } | null;
    recent_articles?: RecentArticle[];
    is_staff?: boolean;
}
