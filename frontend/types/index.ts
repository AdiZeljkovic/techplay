export interface LinkedGameRef {
    slug: string;
    name: string;
    cover_url: string | null;
    released: string | null;
    rating: number | null;
    genres: string[];
    platforms: string[];
    critic_scores?: {
        opencritic?: { score?: number | null; url?: string | null } | null;
        metacritic?: { score?: number | null; url?: string | null } | null;
    } | null;
}

export interface User {
    id: number;
    name: string;
    username: string;
    author_slug?: string;
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
    /** Drawn on the profile hero, edited in Settings. */
    tagline?: string | null;
    location?: string | null;
    cover_image?: string | null;
    profile_visibility?: "public" | "friends";
    /** Own account only — the API withholds both from anybody else. */
    email_notifications?: boolean;
    discord_linked?: boolean;
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
    game?: LinkedGameRef | null;
    id: number;
    title: string;
    slug: string;
    featured_image_url: string;
    featured_video_url?: string | null;
    /** What the cover shows. Written in the admin's Media tab. */
    featured_image_alt?: string | null;
    excerpt: string;
    content: string;
    category: Category; // Updated from string
    is_featured_in_hero: boolean;
    /*
     * Dropped from `articles` on 18.08.2026: `seo_title` and `seo_description`
     * were a second SEO pair that no screen ever offered and no row ever filled,
     * sitting in the fallback chains as a term that could only be undefined.
     * `guides` and `categories` keep theirs — there `seo_*` is the real pair.
     */
    meta_title?: string;
    meta_description?: string;
    focus_keyword?: string;
    tags?: string[];
    canonical_url?: string;
    is_noindex?: boolean;
    author?: User;
    status: 'draft' | 'published' | 'scheduled';
    published_at: string;
    published_at_human?: string;
    reading_time?: string;
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
    game?: LinkedGameRef | null;
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
    /** What the cover shows. Written in the admin's Media tab. */
    featured_image_alt?: string | null;
    updated_at: string;
    /*
     * Dropped from `articles` on 18.08.2026: `seo_title` and `seo_description`
     * were a second SEO pair that no screen ever offered and no row ever filled,
     * sitting in the fallback chains as a term that could only be undefined.
     * `guides` and `categories` keep theirs — there `seo_*` is the real pair.
     */
    meta_title?: string;
    meta_description?: string;
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

/**
 * The author of a comment — what /comments actually sends, which is far less
 * than a User. A thread renders a name, a picture and a rank badge.
 */
export interface CommentAuthor {
    username: string;
    name?: string | null;
    avatar_url?: string | null;
    rank?: { name: string; color?: string } | null;
    is_staff?: boolean;
}

export interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: CommentAuthor;
    score?: number;
    user_vote?: 'up' | 'down' | null;
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

// User's linked WoW character (from user_wow_characters table)
export interface UserWowCharacter {
    id: number;
    user_id: number;
    character_name: string;
    realm_slug: string;
    region: string;
    character_class: string | null;
    faction: string | null;
    level: number;
    item_level: number | null;
    avatar_url: string | null;
    is_main: boolean;
    last_analyzed_at: string | null;
    created_at: string;
    updated_at: string;
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
export interface ItemStats {
    strength?: number;
    agility?: number;
    intellect?: number;
    stamina?: number;
    critical_strike?: number;
    haste?: number;
    mastery?: number;
    versatility?: number;
    armor?: number;
    [key: string]: number | undefined; // Allow for other stats
}

export interface EquipmentSlot {
    slot: string;
    name: string;
    ilvl: number;
    quality: string;
    is_tier: boolean;
    enchanted: boolean;
    gem_slots: number;
    gems_filled: number;
    stats?: ItemStats; // Optional detailed stats
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

// Collections Types
export interface WowPetCollection {
    total: number;
    unique: number;
    max_level: number; // Level 25 pets
}

export interface WowToyCollection {
    collected: number;
}

export interface WowTransmogCollection {
    slots_unlocked: number;
    total_appearances: number;
}

export interface WowCollections {
    pets: WowPetCollection;
    toys: WowToyCollection;
    transmog: WowTransmogCollection;
    mounts_count: number; // Already have mounts from base analysis
}

// Professions Types
export interface Profession {
    name: string;
    skill_level: number;
    max_skill: number;
}

export interface WowProfessions {
    primary: Profession[]; // Max 2 (e.g., Alchemy, Enchanting)
    secondary: Profession[]; // Cooking, Fishing, Archaeology
}

// Historical Progress (for progression charts)
export interface WowHistoricalSnapshot {
    analyzed_at: string; // ISO date
    item_level: number | null;
    mythic_plus_score: number | null;
    arena_rating: number | null;
    readiness_score: number | null;
    pet_count: number;
    toy_count: number;
    exalted_reps: number;
}

// Comprehensive Analysis Result (extends base)
export interface ComprehensiveWowAnalysis extends WowAnalysisResult {
    equipment: WowEquipment | null;
    mythic_plus: (WowMythicPlus & Partial<RaiderIOData>) | null;
    raids: WowRaidProgress | null;
    pvp: WowPvP | null;
    reputations: WowReputations | null;
    collections: WowCollections | null;
    professions: WowProfessions | null;
    history?: WowHistoricalSnapshot[]; // Optional - loaded separately for charts
}

// Tab navigation type
export type WowTabId = 'overview' | 'gear' | 'mythic' | 'raids' | 'pvp' | 'collections' | 'professions';

// Author page types
export interface AuthorSocialLinks {
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
    website?: string;
}

export interface AuthorProfile {
    id: number;
    username: string;
    author_slug: string;
    display_name: string;
    avatar_url?: string;
    cover_image?: string;
    bio?: string;
    tagline?: string;
    role: string;
    joined_at: string;
    social_links?: AuthorSocialLinks;
    social_urls?: string[];
}

export interface AuthorStats {
    total: number;
    news: number;
    reviews: number;
    tech: number;
    guides: number;
}

export interface AuthorPageData {
    author: AuthorProfile;
    stats: AuthorStats;
}

// GTA 6 Map types
export interface Gta6Location {
    id: number;
    gtadb_key: string;
    name: string;
    lat: number;
    lng: number;
    game_x?: number;
    game_y?: number;
    real_address?: string;
    categories: string[];
    is_unconfirmed: boolean;
}

// GTA 6 content databases (admin-curated)
export interface Gta6Character {
    id: number;
    slug: string;
    name: string;
    alias?: string | null;
    role?: string | null;
    description?: string | null;
    image?: string | null;
    gallery?: string[] | null;
    status: string;
}

export interface Gta6Vehicle {
    id: number;
    slug: string;
    name: string;
    vehicle_class?: string | null;
    real_equivalent?: string | null;
    description?: string | null;
    image?: string | null;
    gallery?: string[] | null;
    status: string;
}

export interface Gta6Weapon {
    id: number;
    slug: string;
    name: string;
    weapon_type?: string | null;
    description?: string | null;
    image?: string | null;
    gallery?: string[] | null;
    status: string;
}

// Shared shape for the generic GTA6 entity grid/card/detail components
export interface Gta6Entity {
    id: number;
    slug: string;
    name: string;
    image?: string | null;
    gallery?: string[] | null;
    description?: string | null;
    status: string;
    // optional type-specific subtitle fields
    role?: string | null;
    alias?: string | null;
    vehicle_class?: string | null;
    real_equivalent?: string | null;
    weapon_type?: string | null;
}
