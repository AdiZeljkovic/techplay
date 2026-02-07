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
