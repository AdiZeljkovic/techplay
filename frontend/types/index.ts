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
    score?: number;
    user_vote?: 'up' | 'down' | null;
    is_liked_by_user?: boolean;
    replies?: Comment[];
    commentable_type?: string;
    commentable_id?: number;
    parent_id?: number | null;
    status?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    links?: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    // Keep flat structure for backward compatibility if some endpoints rely on it
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    prev_page_url?: string;
    next_page_url?: string;
}

// WoW Character Analyzer Types
export interface WowCharacter {
    name: string;
    level: number;
    class: string;
    race: string;
    faction: string;
    achievement_points: number;
    portrait_url?: string | null;
}

export interface WowAnalysisResult {
    character: WowCharacter;
    readiness_score: number;
    ai_advice: string[];
    missing_essentials: string[];
    void_mounts_count: number;
    has_void_elf: boolean;
}

export interface WowAnalysisResponse {
    success: boolean;
    data?: WowAnalysisResult;
    message?: string;
}

// Equipment & Gear Types
export interface EquipmentSlot {
    slot: string;
    name: string;
    ilvl: number;
    quality: string;
    is_tier: boolean;
    enchanted: boolean;
    gem_slots: number;
    gems_filled: number;
}

export interface WowEquipment {
    item_level: number;
    slots: EquipmentSlot[];
    tier_pieces: number;
    missing_enchants: string[];
    missing_gems: string[];
}

// Mythic+ Types
export interface MythicRun {
    dungeon: string;
    level: number;
    completed: boolean;
    upgrade_level: number; // 0 = failed, 1 = +1, 2 = +2, 3 = +3
}

export interface WowMythicPlus {
    score: number;
    best_runs: MythicRun[];
    vault_unlocked: boolean;
}

// Raid Types
export interface RaidBoss {
    name: string;
    normal: boolean;
    heroic: boolean;
    mythic: boolean;
}

export interface WowRaidProgress {
    current_tier: string;
    bosses: RaidBoss[];
    summary: string; // "7/8M, 8/8H"
}

// PvP Types
export interface WowPvP {
    honor_level: number;
    arena_2v2: number | null;
    arena_3v3: number | null;
    rbg_rating: number | null;
}

// Reputation Types
export interface MidnightFaction {
    name: string;
    standing: string; // "Neutral", "Friendly", "Honored", "Revered", "Exalted"
    tier: number; // 0-7
    progress: {
        current: number;
        max: number;
    };
}

export interface WowReputations {
    exalted_count: number;
    midnight_factions: MidnightFaction[];
    top_factions: Array<{
        name: string;
        standing: string;
        tier: number;
    }>;
}

// Raider.IO Data (embedded in mythic_plus)
export interface RaiderIOData {
    rio_score: number | null;
    rio_color: string | null;
    world_rank: number | null;
    region_rank: number | null;
    realm_rank: number | null;
}

// Comprehensive Analysis Result (extends base)
export interface ComprehensiveWowAnalysis extends WowAnalysisResult {
    equipment: WowEquipment | null;
    mythic_plus: (WowMythicPlus & Partial<RaiderIOData>) | null;
    raids: WowRaidProgress | null;
    pvp: WowPvP | null;
    reputations: WowReputations | null;
}

// Tab navigation type
export type WowTabId = 'overview' | 'gear' | 'mythic' | 'raids' | 'pvp';
